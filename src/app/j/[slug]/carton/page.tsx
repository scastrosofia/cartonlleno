'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { BingoGrid } from '@/components/bingo/BingoGrid';
import { SocialAlert } from '@/components/bingo/SocialAlert';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import {
  getJuntadaBySlug,
  subscribeToJuntada,
  subscribeToJugadores,
  subscribeToCarton,
  subscribeToAllCartones,
  toggleMarcarCasillero,
  cantarVictoria,
} from '@/lib/firebase/service';
import { getLocalPlayerSession } from '@/lib/firebase/auth';
import { checkLinea, checkCartonLleno, calcularFaltantesParaLinea, getTotalCasilleros } from '@/lib/bingo/rules';
import { Juntada, Jugador, Carton } from '@/types';
import confetti from 'canvas-confetti';
import { Trophy, Users, PartyPopper } from 'lucide-react';

import { Suspense } from 'react';

function MiCartonEnVivoContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [juntada, setJuntada] = useState<Juntada | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [carton, setCarton] = useState<Carton | null>(null);
  const [allCartones, setAllCartones] = useState<Carton[]>([]);
  const [activeCartonIdx, setActiveCartonIdx] = useState(0);
  const [deviceUid, setDeviceUid] = useState<string>('');
  const [notifVictoria, setNotifVictoria] = useState<{ nombre: string; tipo: string; hora: string } | null>(null);

  // Inicializar juntada y jugador local
  useEffect(() => {
    async function init() {
      if (!slug) return;
      const found = await getJuntadaBySlug(slug);
      if (!found) {
        setLoading(false);
        return;
      }
      setJuntada(found);

      const session = getLocalPlayerSession(found.id);
      if (!session) {
        router.replace(`/j/${found.slug}`);
        return;
      }

      setLoading(false);
    }
    init();
  }, [slug, router]);

  // Cargar UID de dispositivo para identificar cartones apadrinados
  useEffect(() => {
    import('@/lib/firebase/auth').then(({ getDeviceId }) => {
      getDeviceId().then(setDeviceUid);
    });
  }, []);

  // Suscripción en tiempo real a la juntada, jugadores y cartón
  useEffect(() => {
    if (!juntada?.id) return;
    const session = getLocalPlayerSession(juntada.id);
    if (!session) return;

    const unsubJ = subscribeToJuntada(juntada.id, (updated) => {
      if (updated) {
        setJuntada(updated);
        if (updated.ganadorLleno) {
          setNotifVictoria({
            nombre: updated.ganadorLleno.nombre,
            tipo: '¡CARTÓN LLENO!',
            hora: updated.ganadorLleno.hora,
          });
        } else if (updated.ganadorLinea) {
          setNotifVictoria({
            nombre: updated.ganadorLinea.nombre,
            tipo: '¡LÍNEA!',
            hora: updated.ganadorLinea.hora,
          });
        }
      }
    });

    const unsubJug = subscribeToJugadores(juntada.id, (list) => {
      setJugadores(list);
    });

    const unsubCarton = subscribeToCarton(juntada.id, session.jugadorId, (c) => {
      setCarton(c);
    });

    const unsubAll = subscribeToAllCartones(juntada.id, (list) => {
      setAllCartones(list);
    });

    return () => {
      unsubJ();
      unsubJug();
      unsubCarton();
      unsubAll();
    };
  }, [juntada?.id]);

  // Cartones que lleva este dispositivo (propio + apadrinados)
  const misCartones = useMemo(() => {
    if (!carton) return [];
    const list: Carton[] = [carton];

    // Buscar si hay jugadores apadrinados que le correspondan a este dispositivo
    const apadrinadosMios = jugadores.filter(
      (j) => j.tipo === 'apadrinado' && (j.padrinoUid === deviceUid || !j.padrinoUid)
    );

    apadrinadosMios.forEach((ap) => {
      const c = allCartones.find((card) => card.jugadorId === ap.id);
      if (c && !list.some((item) => item.id === c.id) && list.length < 3) {
        list.push(c);
      }
    });

    return list;
  }, [carton, jugadores, allCartones, deviceUid]);

  const cartonActual = misCartones[activeCartonIdx] || carton;

  // Marcado y desmarcado de casillero
  const handleToggleCell = async (index: number, targetCartonId?: string) => {
    if (!juntada || !cartonActual) return;
    const cId = targetCartonId || cartonActual.id;

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(35); } catch {}
    }

    try {
      await toggleMarcarCasillero(juntada.id, cId, index);
    } catch (err) {
      console.error('Error al marcar casillero:', err);
    }
  };

  // Reglas del cartón actualmente visible
  const tieneLinea = useMemo(() => {
    if (!cartonActual || !juntada) return false;
    return checkLinea(cartonActual.marcados, juntada.formato);
  }, [cartonActual, juntada]);

  const tieneLleno = useMemo(() => {
    if (!cartonActual || !juntada) return false;
    return checkCartonLleno(cartonActual.marcados, juntada.formato);
  }, [cartonActual, juntada]);

  const faltantesLinea = useMemo(() => {
    if (!cartonActual || !juntada) return 0;
    return calcularFaltantesParaLinea(cartonActual.marcados, juntada.formato);
  }, [cartonActual, juntada]);

  const totalCasilleros = juntada ? getTotalCasilleros(juntada.formato) : 16;
  const cantidadMarcados = cartonActual ? cartonActual.marcados.length : 0;

  // Lógica de alerta social considerando todos los cartones que lleva este celu
  const alertaSocial = useMemo(() => {
    if (!cartonActual || allCartones.length < 2) return null;

    const idsMios = new Set(misCartones.map((c) => c.id));
    const conteoPorClasico: Record<string, { texto: string; count: number }> = {};

    allCartones.forEach((c) => {
      if (idsMios.has(c.id)) return;
      c.marcados.forEach((idx) => {
        const item = c.casilleros[idx];
        if (item && !item.esLibre) {
          if (!conteoPorClasico[item.texto]) {
            conteoPorClasico[item.texto] = { texto: item.texto, count: 0 };
          }
          conteoPorClasico[item.texto].count += 1;
        }
      });
    });

    // Revisar si en mis cartones alguno tiene ese clásico sin marcar
    for (const [texto, info] of Object.entries(conteoPorClasico)) {
      if (info.count >= 2) {
        const cartonesConEseClasicoSinMarcar: { cartonId: string; index: number }[] = [];

        misCartones.forEach((c) => {
          const mSet = new Set(c.marcados);
          c.casilleros.forEach((cas, idx) => {
            if (cas.texto.toLowerCase() === texto.toLowerCase() && !mSet.has(idx) && !cas.esLibre) {
              cartonesConEseClasicoSinMarcar.push({ cartonId: c.id, index: idx });
            }
          });
        });

        if (cartonesConEseClasicoSinMarcar.length > 0) {
          return {
            texto,
            personas: info.count + 1,
            matches: cartonesConEseClasicoSinMarcar,
          };
        }
      }
    }

    return null;
  }, [cartonActual, allCartones, misCartones]);

  const handleMarcarSocial = async () => {
    if (!alertaSocial || !juntada) return;
    for (const match of alertaSocial.matches) {
      await toggleMarcarCasillero(juntada.id, match.cartonId, match.index);
    }
  };

  const handleCantarLinea = async () => {
    if (!juntada || !carton || !tieneLinea) return;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    await cantarVictoria(juntada.id, carton.id, carton.jugadorId, carton.jugadorNombre, 'linea');
    router.push(`/j/${juntada.slug}/victoria?tipo=linea`);
  };

  const handleCantarLleno = async () => {
    if (!juntada || !carton || !tieneLleno) return;

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
    });

    await cantarVictoria(juntada.id, carton.id, carton.jugadorId, carton.jugadorNombre, 'lleno');
    router.push(`/j/${juntada.slug}/victoria?tipo=lleno`);
  };

  // Iniciales del jugador para el avatar
  const initials = carton?.jugadorNombre
    ? carton.jugadorNombre
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'YO';

  if (loading || !juntada || !carton) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-neutral-700">Preparando tu cartón...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 justify-between pb-2">
        {/* Header superior */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif text-lg font-bold text-neutral-950 leading-tight">
                {juntada.nombre}
              </h1>
              <p className="text-xs text-neutral-500 font-medium lowercase">
                jugando · {jugadores.length} jugadores
              </p>
            </div>
            <div
              title={carton.jugadorNombre}
              className="w-10 h-10 rounded-full border-[1.5px] border-[#E52320] bg-red-50 flex items-center justify-center font-bold text-xs text-[#E52320] shadow-2xs"
            >
              {initials}
            </div>
          </div>

          {/* Pestañas de cartones (mi cartón / cartón de la abu) */}
          <div className="flex gap-1.5 p-1 bg-neutral-100 rounded-2xl mb-3 border border-neutral-200 overflow-x-auto">
            {misCartones.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCartonIdx(idx)}
                className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-xl transition-all truncate px-2.5 lowercase ${
                  activeCartonIdx === idx
                    ? 'bg-white text-neutral-950 shadow-2xs border border-neutral-300'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {idx === 0 ? 'mi cartón' : `cartón de ${c.jugadorNombre}`}
              </button>
            ))}
          </div>

          {/* Notificación de ganador en vivo (si alguien cantó línea o lleno) */}
          {notifVictoria && (
            <div className="w-full bg-[#E52320] text-white rounded-2xl p-3.5 flex items-center justify-between gap-2.5 mb-3 shadow-md animate-bounce">
              <div className="flex items-center gap-2.5 min-w-0">
                <PartyPopper className="w-5 h-5 text-yellow-300 shrink-0" />
                <div className="text-xs leading-tight truncate">
                  <span className="font-bold">{notifVictoria.nombre}</span> cantó{' '}
                  <span className="font-extrabold underline">{notifVictoria.tipo}</span> a las{' '}
                  {notifVictoria.hora}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/j/${juntada.slug}/victoria`)}
                className="shrink-0 bg-white text-[#E52320] text-[11px] font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
              >
                ver festejo
              </button>
            </div>
          )}

          {/* Alerta social interactiva con soporte para 'En los 2' */}
          {alertaSocial && (
            <SocialAlert
              mensaje={`${alertaSocial.personas} personas marcaron: ${alertaSocial.texto}`}
              botonTexto={alertaSocial.matches.length > 1 ? `en los ${alertaSocial.matches.length}` : 'marcar'}
              onAction={handleMarcarSocial}
            />
          )}

          {/* Si no hay alerta social natural, mostramos sutilmente el estado */}
          {!alertaSocial && !notifVictoria && (
            <div className="text-[11px] text-neutral-400 font-medium text-center mb-2 lowercase">
              {misCartones.length > 1
                ? `llevás ${misCartones.length} cartones en este celu. podés alternar en las pestañas arriba.`
                : 'tocá cualquier casillero cuando ocurra en la juntada'}
            </div>
          )}
        </div>

        {/* Grilla central de Bingo */}
        <div className="w-full my-auto py-2">
          <BingoGrid
            casilleros={cartonActual.casilleros}
            marcados={cartonActual.marcados}
            formato={juntada.formato}
            onToggleCell={(idx) => handleToggleCell(idx, cartonActual.id)}
          />
        </div>

        {/* Sección inferior con progreso y botón de victoria */}
        <div className="w-full mt-auto pt-3 flex flex-col gap-3">
          <ProgressBar
            current={cantidadMarcados}
            total={totalCasilleros}
            leftLabel={`${cantidadMarcados} de ${totalCasilleros} marcados`}
            rightLabel={
              tieneLleno
                ? '¡cartón completado!'
                : tieneLinea
                ? '¡línea conseguida!'
                : `te falta ${faltantesLinea} para línea`
            }
          />

          {tieneLleno ? (
            <Button
              size="lg"
              fullWidth
              className="bg-[#E52320] text-white shadow-lg animate-pulse"
              onClick={handleCantarLleno}
            >
              <Trophy className="w-5 h-5 mr-2 text-yellow-300" />
              ¡CARTÓN LLENO!
            </Button>
          ) : (
            <button
              type="button"
              disabled={!tieneLinea}
              onClick={handleCantarLinea}
              className={`w-full min-h-[50px] rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-xs flex items-center justify-center ${
                tieneLinea
                  ? 'bg-[#E52320] text-white animate-pulse shadow-md'
                  : 'bg-white border-2 border-[#E52320] text-[#E52320] hover:bg-red-50/50'
              }`}
            >
              {tieneLinea ? '🎉 ¡CANTAR LÍNEA!' : '¡LÍNEA!'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              alert(`En la mesa están jugando ${jugadores.length} personas: ${jugadores.map((j) => j.nombre).join(', ')}.`);
            }}
            className="text-center text-xs font-semibold text-neutral-600 underline underline-offset-4 py-1 hover:text-black lowercase"
          >
            ver ranking de la mesa
          </button>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function MiCartonEnVivoPage() {
  return (
    <Suspense
      fallback={
        <MobileContainer>
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-neutral-700">Cargando cartón...</p>
          </div>
        </MobileContainer>
      }
    >
      <MiCartonEnVivoContent />
    </Suspense>
  );
}

