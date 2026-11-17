'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { BingoGrid } from '@/components/bingo/BingoGrid';
import { SocialAlert } from '@/components/bingo/SocialAlert';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  getJuntadaBySlug,
  subscribeToJuntada,
  subscribeToJugadores,
  subscribeToCarton,
  subscribeToAllCartones,
  toggleMarcarCasillero,
  cantarVictoria,
  obtenerOGenerarCarton,
  addJugador,
} from '@/lib/firebase/service';
import { getDeviceId, getLocalPlayerSession, saveLocalPlayerSession } from '@/lib/firebase/auth';
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

  // Estados para ingreso directo si abrió el link del cartón sin sesión previa
  const [sinSesion, setSinSesion] = useState(false);
  const [nombreIngreso, setNombreIngreso] = useState('');
  const [ingresando, setIngresando] = useState(false);

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
        setSinSesion(true);
        setLoading(false);
        return;
      }

      // Si el juego todavía no se inició (está en cargando), ir a la sala de espera
      if (found.estado !== 'jugando') {
        router.replace(`/j/${found.slug}`);
        return;
      }

      // Intentar obtener o generar el cartón inmediatamente
      try {
        const c = await obtenerOGenerarCarton(found, session.jugadorId, session.nombre);
        if (c) setCarton(c);
      } catch (err) {
        console.warn('Error al obtener o generar cartón inicial:', err);
      }

      setLoading(false);
    }
    init();
  }, [slug, router]);

  // Cargar UID de dispositivo para identificar cartones apadrinados
  useEffect(() => {
    getDeviceId().then(setDeviceUid);
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
        } else if (updated.ganadoresLinea && updated.ganadoresLinea.length > 0) {
          const ultimo = updated.ganadoresLinea[updated.ganadoresLinea.length - 1];
          const ord = ultimo.numeroLinea === 1 ? '1ª' : ultimo.numeroLinea === 2 ? '2ª' : '3ª';
          setNotifVictoria({
            nombre: ultimo.nombre,
            tipo: `¡${ord} LÍNEA!`,
            hora: ultimo.hora,
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

    const unsubCarton = subscribeToCarton(juntada.id, session.jugadorId, async (c) => {
      if (c) {
        setCarton(c);
      } else if (juntada.estado === 'jugando') {
        // Si no vino en el snapshot pero la juntada está jugando, generarlo al vuelo
        const nuevo = await obtenerOGenerarCarton(juntada, session.jugadorId, session.nombre);
        if (nuevo) setCarton(nuevo);
      }
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

  const ganadoresLinea = useMemo(() => {
    return juntada?.ganadoresLinea || (juntada?.ganadorLinea ? [juntada.ganadorLinea] : []);
  }, [juntada]);

  const yaGanoLineaEsteCarton = Boolean(cartonActual?.ganoLineaAt);
  const quedanLineas = ganadoresLinea.length < 3;

  const handleCantarLinea = async () => {
    if (!juntada || !carton || !tieneLinea || !quedanLineas) return;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const res = await cantarVictoria(juntada.id, carton.id, carton.jugadorId, carton.jugadorNombre, 'linea');
    const num = res?.numeroLinea || (ganadoresLinea.length + 1);
    router.push(`/j/${juntada.slug}/victoria?tipo=linea&num=${num}`);
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

  const handleIngresoDirecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreIngreso.trim() || !juntada) return;
    setIngresando(true);
    try {
      const uid = await getDeviceId();
      const nuevoJugador = await addJugador(juntada.id, nombreIngreso.trim(), uid, 'celu');
      saveLocalPlayerSession(juntada.id, nuevoJugador.id, nuevoJugador.nombre);
      const c = await obtenerOGenerarCarton(juntada, nuevoJugador.id, nuevoJugador.nombre);
      if (c) setCarton(c);
      setSinSesion(false);
    } catch (err) {
      console.error('Error al ingresar directamente al cartón:', err);
    } finally {
      setIngresando(false);
    }
  };

  const handleForzarRecarga = async () => {
    if (!juntada) return;
    const session = getLocalPlayerSession(juntada.id);
    if (session) {
      const c = await obtenerOGenerarCarton(juntada, session.jugadorId, session.nombre);
      if (c) setCarton(c);
    } else {
      setSinSesion(true);
    }
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

  if (!loading && !juntada) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-4">
          <p className="font-serif text-lg font-bold text-neutral-900 mb-2 lowercase">
            juntada no encontrada
          </p>
          <p className="text-xs text-neutral-500 mb-6 lowercase">
            revisá el enlace o pedile el link al organizador.
          </p>
          <Button fullWidth onClick={() => router.push('/')}>
            ir al inicio
          </Button>
        </div>
      </MobileContainer>
    );
  }

  if (sinSesion && juntada) {
    return (
      <MobileContainer>
        <div className="flex flex-col flex-1 justify-center py-8">
          <div className="text-center mb-6">
            <span className="text-xs font-medium text-neutral-500 lowercase block mb-1">
              partida en vivo de
            </span>
            <h1 className="font-serif text-2xl font-bold text-neutral-900">
              {juntada.nombre}
            </h1>
            <p className="text-xs text-neutral-500 mt-1 lowercase">
              ingresá tu nombre para recibir tu cartón
            </p>
          </div>
          <form onSubmit={handleIngresoDirecto} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-900 block mb-1.5 lowercase">
                tu nombre o apodo
              </label>
              <Input
                placeholder="ej: federico"
                value={nombreIngreso}
                onChange={(e) => setNombreIngreso(e.target.value)}
                autoFocus
              />
            </div>
            <Button size="lg" fullWidth type="submit" disabled={!nombreIngreso.trim() || ingresando}>
              {ingresando ? 'entrando...' : 'ver mi cartón'}
            </Button>
          </form>
        </div>
      </MobileContainer>
    );
  }

  if (loading || !juntada || !carton) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-4">
          <div className="w-8 h-8 border-2 border-[#E52320] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-neutral-700 lowercase mb-2">
            preparando tu cartón...
          </p>
          <button
            type="button"
            onClick={handleForzarRecarga}
            className="text-xs text-[#E52320] font-semibold underline underline-offset-4 mt-3 hover:text-[#b51816] lowercase"
          >
            ¿tarda en cargar? tocá acá para generar tu cartón
          </button>
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
                : yaGanoLineaEsteCarton
                ? '¡línea conseguida! a por el bingo'
                : tieneLinea && quedanLineas
                ? '¡línea conseguida! tocala para cantar'
                : quedanLineas
                ? `te falta ${faltantesLinea} para línea (${ganadoresLinea.length}/3)`
                : `te faltan ${totalCasilleros - cantidadMarcados} para bingo`
            }
          />

          {tieneLleno ? (
            <Button
              size="lg"
              fullWidth
              className="bg-[#E52320] text-white shadow-lg animate-pulse font-extrabold tracking-wide"
              onClick={handleCantarLleno}
            >
              <Trophy className="w-5 h-5 mr-2 text-yellow-300" />
              ¡CARTÓN LLENO! (BINGO)
            </Button>
          ) : yaGanoLineaEsteCarton ? (
            <div className="w-full min-h-[50px] rounded-2xl font-bold text-xs bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-center text-center px-3 shadow-2xs">
              🎉 ¡Línea conseguida! Seguí jugando por el Cartón Lleno
            </div>
          ) : !quedanLineas ? (
            <div className="w-full min-h-[50px] rounded-2xl font-bold text-xs bg-neutral-100 border border-neutral-300 text-neutral-600 flex items-center justify-center text-center px-3 shadow-2xs">
              3 líneas cantadas · ¡a por el cartón lleno (bingo)!
            </div>
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
              {tieneLinea
                ? `🎉 ¡CANTAR ${ganadoresLinea.length === 0 ? '1ª' : ganadoresLinea.length === 1 ? '2ª' : '3ª'} LÍNEA!`
                : `¡LÍNEA! (${ganadoresLinea.length}/3)`}
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

