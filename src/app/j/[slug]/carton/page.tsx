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
  const [activeTab, setActiveTab] = useState<'mio' | 'apadrinado'>('mio');
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
        // No tiene jugador aún, enviar a unirse
        router.replace(`/j/${found.slug}`);
        return;
      }

      setLoading(false);
    }
    init();
  }, [slug, router]);

  // Suscripción en tiempo real a la juntada, jugadores y cartón
  useEffect(() => {
    if (!juntada?.id) return;
    const session = getLocalPlayerSession(juntada.id);
    if (!session) return;

    const unsubJ = subscribeToJuntada(juntada.id, (updated) => {
      if (updated) {
        setJuntada(updated);
        // Si alguien cantó victoria, mostrar aviso
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

  // Marcado y desmarcado de casillero
  const handleToggleCell = async (index: number) => {
    if (!juntada || !carton) return;
    // Efecto háptico sutil si el navegador lo soporta
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(35); } catch {}
    }

    try {
      const nuevosMarcados = await toggleMarcarCasillero(juntada.id, carton.id, index);
      setCarton((prev) => (prev ? { ...prev, marcados: nuevosMarcados } : null));
    } catch (err) {
      console.error('Error al marcar casillero:', err);
    }
  };

  // Cálculo de reglas
  const tieneLinea = useMemo(() => {
    if (!carton || !juntada) return false;
    return checkLinea(carton.marcados, juntada.formato);
  }, [carton, juntada]);

  const tieneLleno = useMemo(() => {
    if (!carton || !juntada) return false;
    return checkCartonLleno(carton.marcados, juntada.formato);
  }, [carton, juntada]);

  const faltantesLinea = useMemo(() => {
    if (!carton || !juntada) return 0;
    return calcularFaltantesParaLinea(carton.marcados, juntada.formato);
  }, [carton, juntada]);

  const totalCasilleros = juntada ? getTotalCasilleros(juntada.formato) : 16;
  const cantidadMarcados = carton ? carton.marcados.length : 0;

  // Lógica de alerta social: si 2 o más jugadores marcaron un clásico que nosotros no tenemos marcado
  const alertaSocial = useMemo(() => {
    if (!carton || allCartones.length < 2) return null;

    const marcadosMios = new Set(carton.marcados);
    const conteoPorClasico: Record<string, { texto: string; count: number }> = {};

    allCartones.forEach((c) => {
      if (c.id === carton.id) return;
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

    // Buscar si tenemos en nuestro cartón algún clásico que otros marcaron (>= 2 veces) y nosotros no
    for (let i = 0; i < carton.casilleros.length; i++) {
      const miCasillero = carton.casilleros[i];
      if (!marcadosMios.has(i) && !miCasillero.esLibre) {
        const match = conteoPorClasico[miCasillero.texto];
        if (match && match.count >= 2) {
          return {
            index: i,
            id: miCasillero.id,
            texto: miCasillero.texto,
            personas: match.count + 1,
          };
        }
      }
    }

    return null;
  }, [carton, allCartones]);

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
              <h1 className="text-base font-extrabold text-neutral-950 leading-tight">
                {juntada.nombre}
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                Jugando · {jugadores.length} jugadores
              </p>
            </div>
            <div
              title={carton.jugadorNombre}
              className="w-10 h-10 rounded-full border-[1.5px] border-neutral-900 bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-900 shadow-2xs"
            >
              {initials}
            </div>
          </div>

          {/* Pestañas de cartones (Mi cartón / Cartón apadrinado) */}
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl mb-3 border border-neutral-200">
            <button
              type="button"
              onClick={() => setActiveTab('mio')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'mio'
                  ? 'bg-white text-neutral-950 shadow-2xs border border-neutral-300'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Mi cartón
            </button>
            <button
              type="button"
              onClick={() => {
                alert('La gestión de cartones de invitados sin celu (ej: La Abu) se habilita en la Fase 3.');
              }}
              className="flex-1 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-600 rounded-lg"
            >
              + Agregar otro
            </button>
          </div>

          {/* Notificación de ganador en vivo (si alguien cantó línea o lleno) */}
          {notifVictoria && (
            <div className="w-full bg-neutral-900 text-white rounded-xl p-3 flex items-center justify-between gap-2.5 mb-3 animate-bounce">
              <div className="flex items-center gap-2.5 min-w-0">
                <PartyPopper className="w-5 h-5 text-yellow-400 shrink-0" />
                <div className="text-xs leading-tight truncate">
                  <span className="font-bold">{notifVictoria.nombre}</span> cantó{' '}
                  <span className="font-extrabold underline">{notifVictoria.tipo}</span> a las{' '}
                  {notifVictoria.hora}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/j/${juntada.slug}/victoria`)}
                className="shrink-0 bg-white text-neutral-900 text-[11px] font-bold px-2.5 py-1 rounded-lg active:scale-95 transition-transform"
              >
                Ver festejo
              </button>
            </div>
          )}

          {/* Alerta social interactiva */}
          {alertaSocial && (
            <SocialAlert
              mensaje={`${alertaSocial.personas} personas marcaron: ${alertaSocial.texto}`}
              botonTexto="Marcar"
              onAction={() => handleToggleCell(alertaSocial.index)}
            />
          )}

          {/* Si no hay alerta social natural, mostramos sutilmente el estado */}
          {!alertaSocial && !notifVictoria && (
            <div className="text-[11px] text-neutral-400 font-medium text-center mb-2">
              Tocá cualquier casillero cuando ocurra en la juntada
            </div>
          )}
        </div>

        {/* Grilla central de Bingo */}
        <div className="w-full my-auto py-2">
          <BingoGrid
            casilleros={carton.casilleros}
            marcados={carton.marcados}
            formato={juntada.formato}
            highlightedClasicoId={alertaSocial?.id}
            onToggleCell={handleToggleCell}
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
                ? '¡Cartón completado!'
                : tieneLinea
                ? '¡Línea conseguida!'
                : `Te falta ${faltantesLinea} para línea`
            }
          />

          {tieneLleno ? (
            <Button
              size="lg"
              fullWidth
              className="bg-neutral-950 text-white shadow-lg animate-pulse"
              onClick={handleCantarLleno}
            >
              <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
              ¡CARTÓN LLENO!
            </Button>
          ) : (
            <Button
              size="lg"
              variant={tieneLinea ? 'primary' : 'outline'}
              fullWidth
              disabled={!tieneLinea}
              onClick={handleCantarLinea}
            >
              {tieneLinea ? '🎉 ¡CANTAR LÍNEA!' : '¡LÍNEA!'}
            </Button>
          )}

          <button
            type="button"
            onClick={() => {
              alert(`En la mesa están jugando ${jugadores.length} personas: ${jugadores.map((j) => j.nombre).join(', ')}.`);
            }}
            className="text-center text-xs font-bold text-neutral-800 underline underline-offset-4 py-1 hover:text-black"
          >
            Ver ranking de la mesa
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

