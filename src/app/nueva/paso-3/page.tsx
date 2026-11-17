'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Share2, Plus, Users } from 'lucide-react';
import {
  createJuntada,
  addClasico,
  addJugador,
  subscribeToJuntada,
  subscribeToJugadores,
  subscribeToClasicos,
  repartirCartones,
} from '@/lib/firebase/service';
import { getDeviceId, saveLocalPlayerSession } from '@/lib/firebase/auth';
import { Juntada, Jugador, Clasico, TipoJugador } from '@/types';
import { getTotalCasilleros } from '@/lib/bingo/rules';
import { AgregarJugadorSinCeluModal } from '@/components/modals/AgregarJugadorSinCeluModal';

export default function InvitarPaso3Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [juntada, setJuntada] = useState<Juntada | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [clasicos, setClasicos] = useState<Clasico[]>([]);
  const [copied, setCopied] = useState(false);
  const [repartiendo, setRepartiendo] = useState(false);
  const [originUrl, setOriginUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }

    async function initJuntada() {
      // Si ya hay una juntada activa creada en esta sesión
      const activeJuntadaId = localStorage.getItem('carton_lleno_active_id');
      const draftRaw = localStorage.getItem('carton_lleno_draft');
      const clasicosRaw = localStorage.getItem('carton_lleno_draft_clasicos');

      if (!draftRaw && !activeJuntadaId) {
        router.replace('/nueva/paso-1');
        return;
      }

      const hostUid = await getDeviceId();

      if (activeJuntadaId) {
        // Ya fue creada
        setLoading(false);
        return;
      }

      // Crear la juntada por primera vez
      if (draftRaw) {
        try {
          const draft = JSON.parse(draftRaw);
          const nueva = await createJuntada({
            nombre: draft.nombre,
            tipo: draft.tipo,
            fecha: draft.fecha,
            formato: draft.formato,
            modo: draft.modo,
            premio: draft.premio,
            hostUid,
          });

          // Cargar los clásicos iniciales
          if (clasicosRaw) {
            const list = JSON.parse(clasicosRaw);
            for (const item of list) {
              await addClasico(nueva.id, item.texto);
            }
          }

          // Agregar al Host como jugador
          const hostJugador = await addJugador(nueva.id, 'Organizador', hostUid, 'celu');
          saveLocalPlayerSession(nueva.id, hostJugador.id, hostJugador.nombre);

          localStorage.setItem('carton_lleno_active_id', nueva.id);
          localStorage.setItem('carton_lleno_active_slug', nueva.slug);
          setJuntada(nueva);
        } catch (err) {
          console.error('Error al crear juntada:', err);
        } finally {
          setLoading(false);
        }
      }
    }

    initJuntada();
  }, [router]);

  // Suscripciones en tiempo real
  useEffect(() => {
    const activeId = juntada?.id || localStorage.getItem('carton_lleno_active_id');
    if (!activeId) return;

    const unsubJ = subscribeToJuntada(activeId, (data) => {
      if (data) {
        setJuntada(data);
        if (data.estado === 'jugando') {
          // Si ya se repartieron los cartones, dirigir al cartón
          router.push(`/j/${data.slug}/carton`);
        }
      }
    });

    const unsubJug = subscribeToJugadores(activeId, (list) => {
      setJugadores(list);
    });

    const unsubClas = subscribeToClasicos(activeId, (list) => {
      setClasicos(list);
    });

    return () => {
      unsubJ();
      unsubJug();
      unsubClas();
    };
  }, [juntada?.id, router]);

  const shareUrl = juntada
    ? `${originUrl || 'https://cartonlleno.app'}/j/${juntada.slug}`
    : '';

  const displayShortUrl = juntada ? `cartonlleno.app/j/${juntada.slug}` : 'cartonlleno.app/...';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleShareWhatsApp = () => {
    if (!juntada) return;
    const msg = `¡Armamos el bingo para la juntada de ${juntada.nombre}! 🎄🎉\nEntrá a sumar tus clásicos y pedir tu cartón acá: ${shareUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleRepartir = async () => {
    if (!juntada || repartiendo) return;
    setRepartiendo(true);
    try {
      await repartirCartones(juntada.id);
      if (juntada.modo === 'tradicional') {
        router.push(`/j/${juntada.slug}/descargar`);
      } else {
        router.push(`/j/${juntada.slug}/carton`);
      }
    } catch (err) {
      console.error('Error al repartir cartones:', err);
      setRepartiendo(false);
    }
  };

  const handleAddJugadorSinCelu = async (nombre: string, tipo: TipoJugador, padrinoUid?: string | null) => {
    if (!juntada) return;
    await addJugador(juntada.id, nombre, null, tipo, padrinoUid);
  };

  const totalRequerido = juntada ? getTotalCasilleros(juntada.formato) : 16;

  if (loading || !juntada) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-neutral-700">
            Creando tu juntada...
          </p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 pb-4">
        <StepHeader title="invitar" step={3} />

        <div className="flex flex-col flex-1">
          {/* Título */}
          <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight leading-tight mb-4 lowercase">
            sumá a los tuyos
          </h2>

          {/* Tarjeta de preview (OG preview style) */}
          <div className="w-full rounded-2xl border-[1.5px] border-neutral-300 bg-white overflow-hidden shadow-2xs mb-4">
            <div className="w-full p-6 border-b-[1.5px] border-dashed border-neutral-200 bg-red-50/40 flex flex-col items-center justify-center min-h-[130px] text-center">
              <span className="text-[11px] font-bold text-[#E52320] uppercase tracking-widest mb-1.5">
                cartón lleno, corazón contento
              </span>
              <p className="font-serif text-lg font-bold text-neutral-900 max-w-[260px] leading-snug">
                ¡fuiste invitado al bingo de {juntada.nombre}!
              </p>
              <span className="text-[11px] text-neutral-500 mt-1 lowercase">
                formato {juntada.formato} · {juntada.fecha}
              </span>
            </div>
            <div className="p-4 bg-white">
              <h3 className="text-xs font-bold text-neutral-950 leading-snug lowercase">
                sumá tus clásicos antes del {juntada.fecha}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 lowercase">
                código: <span className="font-bold text-neutral-900">{juntada.codigo}</span> · {displayShortUrl}
              </p>
            </div>
          </div>

          {/* Botón WhatsApp (Rojo) */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full min-h-[48px] bg-[#E52320] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm mb-3 hover:bg-[#d01e1b]"
          >
            <Share2 className="w-4 h-4" />
            <span>compartir por WhatsApp</span>
          </button>

          {/* Caja de link corto */}
          <div className="w-full min-h-[46px] px-4 py-2 rounded-2xl border-[1.5px] border-neutral-200 bg-white flex items-center justify-between gap-2 mb-4">
            <span className="text-xs font-medium text-neutral-700 truncate">
              {displayShortUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Copiar link"
              className="p-1.5 text-neutral-700 hover:text-black rounded-lg active:bg-neutral-100 flex items-center gap-1 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span className="text-[11px] font-bold text-emerald-600">¡copiado!</span>
                </>
              ) : (
                <Copy className="w-4 h-4 stroke-[2]" />
              )}
            </button>
          </div>

          {/* Jugadores que se sumaron y clásicos */}
          <div className="p-3.5 rounded-2xl border-[1.5px] border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3 mb-4">
            <div className="flex -space-x-2 overflow-hidden">
              {jugadores.slice(0, 4).map((j, idx) => {
                const initials = j.nombre
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div
                    key={j.id || idx}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-red-100 text-[#E52320] text-[10px] font-bold"
                  >
                    {initials || 'JG'}
                  </div>
                );
              })}
              {jugadores.length > 4 && (
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-[#E52320] text-white text-[10px] font-bold">
                  +{jugadores.length - 4}
                </div>
              )}
              {jugadores.length === 0 && (
                <Users className="w-5 h-5 text-neutral-400" />
              )}
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-neutral-900 block lowercase">
                {jugadores.length} {jugadores.length === 1 ? 'se sumó' : 'se sumaron'}
              </span>
              <span className="text-[10px] text-neutral-500 lowercase">
                {clasicos.length} clásicos cargados
              </span>
            </div>
          </div>

          {/* Botón de jugador sin celu */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full min-h-[46px] rounded-2xl border-[1.5px] border-neutral-300 bg-white text-xs font-bold text-neutral-800 flex items-center justify-center gap-2 hover:border-neutral-500 active:bg-neutral-50 mb-3"
          >
            <Plus className="w-4 h-4 text-[#E52320] stroke-[2.5]" />
            <span>+ agregar jugador sin celu</span>
          </button>
        </div>

        {/* Botón Repartir cartones (Rojo) */}
        <div className="mt-auto pt-2 flex flex-col items-center">
          <Button
            size="lg"
            fullWidth
            onClick={handleRepartir}
            disabled={repartiendo}
          >
            {repartiendo ? 'repartiendo...' : 'repartir cartones'}
          </Button>
          <span className="text-[11px] text-neutral-500 mt-2 text-center lowercase">
            cada jugador recibe un cartón distinto
          </span>
        </div>
      </div>

      {/* Modal 4b: Agregar jugador sin celu */}
      <AgregarJugadorSinCeluModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jugadoresExistentes={jugadores}
        onAddJugador={handleAddJugadorSinCelu}
      />
    </MobileContainer>
  );
}
