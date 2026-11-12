import { FormatoCarton, TipoJuntada, Casillero, Carton, Clasico } from '@/types';
import { getTotalCasilleros } from './rules';
import { getBancoCompletoParaTipo } from '@/data/bancoClasicos';

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Prepara el pool de clásicos para la juntada, rellenando con el banco si es necesario.
 */
export function prepararPoolClasicos(
  clasicosCargados: Clasico[],
  formato: FormatoCarton,
  tipo: TipoJuntada
): { pool: { id: string; texto: string }[]; rellenadoConBanco: boolean } {
  const totalNecesario = formato === '5x5' ? 24 : getTotalCasilleros(formato);
  const textosExistentes = new Set(clasicosCargados.map(c => c.texto.trim().toLowerCase()));

  const pool = clasicosCargados.map(c => ({ id: c.id, texto: c.texto }));
  let rellenadoConBanco = false;

  if (pool.length < totalNecesario) {
    rellenadoConBanco = true;
    const banco = getBancoCompletoParaTipo(tipo);
    for (const item of banco) {
      if (!textosExistentes.has(item.texto.trim().toLowerCase())) {
        pool.push({ id: `banco-${item.id}`, texto: item.texto });
        textosExistentes.add(item.texto.trim().toLowerCase());
        if (pool.length >= totalNecesario) break;
      }
    }
  }

  return { pool, rellenadoConBanco };
}

/**
 * Genera un cartón único para un jugador.
 */
export function generarCarton(
  juntadaId: string,
  jugadorId: string,
  jugadorNombre: string,
  numero: number,
  poolClasicos: { id: string; texto: string }[],
  formato: FormatoCarton,
  cartonesExistentes: Carton[] = []
): Carton {
  const totalCasilleros = getTotalCasilleros(formato);
  const es5x5 = formato === '5x5';
  const casillerosNecesarios = es5x5 ? 24 : totalCasilleros;

  // Si el pool es mayor que lo necesario, barajamos y tomamos un subconjunto
  let seleccion = shuffleArray(poolClasicos).slice(0, casillerosNecesarios);

  // Asegurar que no sea idéntico a ningún cartón previo
  let intentos = 0;
  while (intentos < 20) {
    const hash = seleccion.map(c => c.id).join(',');
    const esIdentico = cartonesExistentes.some(existente => 
      existente.casilleros.filter(c => !c.esLibre).map(c => c.id).join(',') === hash
    );

    if (!esIdentico) break;
    seleccion = shuffleArray(poolClasicos).slice(0, casillerosNecesarios);
    intentos++;
  }

  const casilleros: Casillero[] = [];
  const marcados: number[] = [];

  if (es5x5) {
    // 5x5 tiene el centro (índice 12) libre
    for (let i = 0; i < 25; i++) {
      if (i === 12) {
        casilleros.push({
          id: 'libre-center',
          texto: '¡LIBRE!',
          esLibre: true,
        });
        marcados.push(12);
      } else {
        const item = seleccion[i < 12 ? i : i - 1];
        casilleros.push({
          id: item.id,
          texto: item.texto,
          esLibre: false,
        });
      }
    }
  } else {
    for (let i = 0; i < totalCasilleros; i++) {
      const item = seleccion[i];
      casilleros.push({
        id: item.id,
        texto: item.texto,
        esLibre: false,
      });
    }
  }

  return {
    id: `carton_${jugadorId}`,
    juntadaId,
    jugadorId,
    jugadorNombre,
    numero,
    casilleros,
    marcados,
  };
}
