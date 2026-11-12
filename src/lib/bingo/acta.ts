import { Carton, Juntada } from '@/types';

export interface EstadisticasActa {
  totalClasicosPool: number;
  clasicosCumplidosCount: number;
  porcentajeCumplimiento: number;
  ganadorNombre: string;
  ganadorHora: string;
  tipoVictoria: string;
  premio: string;
  clasicoNoPasoTexto: string;
  remateNoPaso: string;
}

const REMATES_HUMOR: Record<string, string> = {
  politica: 'Milagro navideño histórico.',
  luz: 'Edesur se portó bien por una vez.',
  asado: 'Aplauso de pie para el asador.',
  parrilla: 'El fuego fue dominado con éxito.',
  'vitel tone': 'Se comieron hasta la última gota de salsa.',
  llora: 'Estabilidad emocional digna de admirar.',
  novio: 'Respeto absoluto a la privacidad familiar.',
  novia: 'Respeto absoluto a la privacidad familiar.',
  abuela: 'La abuela estuvo más despierta que todos nosotros.',
  hielo: 'Logística de refrigeración impecable.',
  chiste: 'El tío renovó el repertorio.',
  fernet: 'Pulso de cirujano con las bebidas.',
  pileta: 'Nadie terminó empapado con ropa.',
  musica: 'Convivencia armónica con la playlist.',
};

export function generarRemateParaClasico(textoClasico: string): string {
  const lower = textoClasico.toLowerCase();
  for (const [key, remate] of Object.entries(REMATES_HUMOR)) {
    if (lower.includes(key)) {
      return remate;
    }
  }
  return 'Increíble pero real. Quizás el año que viene.';
}

export function calcularEstadisticasActa(
  juntada: Juntada,
  cartones: Carton[]
): EstadisticasActa {
  // Diccionario para registrar cuántos cartones contenían cada clásico y cuántos lo marcaron
  const ocurrencias: Record<string, { texto: string; asignados: number; marcados: number }> = {};

  cartones.forEach((c) => {
    const marcadosSet = new Set(c.marcados);
    c.casilleros.forEach((cas, idx) => {
      if (cas.esLibre) return;
      if (!ocurrencias[cas.id]) {
        ocurrencias[cas.id] = { texto: cas.texto, asignados: 0, marcados: 0 };
      }
      ocurrencias[cas.id].asignados += 1;
      if (marcadosSet.has(idx)) {
        ocurrencias[cas.id].marcados += 1;
      }
    });
  });

  const lista = Object.values(ocurrencias);
  const totalClasicosPool = lista.length || 16;

  // Un clásico se cumplió si al menos el 50% de los que lo tenían lo marcaron
  const cumplidos = lista.filter((item) => {
    if (item.asignados === 0) return false;
    return item.marcados / item.asignados >= 0.5;
  });

  const noCumplidos = lista.filter((item) => {
    if (item.asignados === 0) return true;
    return item.marcados / item.asignados < 0.5;
  });

  // Elegir el clásico menos marcado para el remate gracioso
  const menosMarcado = noCumplidos.sort(
    (a, b) => a.marcados / (a.asignados || 1) - b.marcados / (b.asignados || 1)
  )[0];

  const clasicoNoPasoTexto = menosMarcado
    ? menosMarcado.texto
    : 'Nadie se quejó del calor';

  const remateNoPaso = generarRemateParaClasico(clasicoNoPasoTexto);

  const ganadorNombre =
    juntada.ganadorLleno?.nombre ||
    juntada.ganadorLinea?.nombre ||
    (cartones[0]?.jugadorNombre ?? 'Alguien de la mesa');

  const ganadorHora =
    juntada.ganadorLleno?.hora ||
    juntada.ganadorLinea?.hora ||
    '00:47';

  const tipoVictoria = juntada.ganadorLleno
    ? 'Cartón Lleno'
    : 'Línea';

  return {
    totalClasicosPool,
    clasicosCumplidosCount: cumplidos.length,
    porcentajeCumplimiento: Math.round((cumplidos.length / (totalClasicosPool || 1)) * 100),
    ganadorNombre,
    ganadorHora,
    tipoVictoria,
    premio: juntada.premio || 'No lavar los platos',
    clasicoNoPasoTexto,
    remateNoPaso,
  };
}
