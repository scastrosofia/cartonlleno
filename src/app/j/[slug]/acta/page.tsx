'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Share2, Download, ArrowRight, Check } from 'lucide-react';
import { getJuntadaBySlug, subscribeToJuntada, subscribeToAllCartones } from '@/lib/firebase/service';
import { calcularEstadisticasActa, EstadisticasActa } from '@/lib/bingo/acta';
import { Juntada, Carton } from '@/types';
import { toPng } from 'html-to-image';

function ActaContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [juntada, setJuntada] = useState<Juntada | null>(null);
  const [cartones, setCartones] = useState<Carton[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const storyCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      if (!slug) return;
      const found = await getJuntadaBySlug(slug);
      setJuntada(found);
      setLoading(false);
    }
    init();
  }, [slug]);

  useEffect(() => {
    if (!juntada?.id) return;
    const unsubJ = subscribeToJuntada(juntada.id, (data) => {
      if (data) setJuntada(data);
    });
    const unsubC = subscribeToAllCartones(juntada.id, (list) => {
      setCartones(list);
    });
    return () => {
      unsubJ();
      unsubC();
    };
  }, [juntada?.id]);

  const stats: EstadisticasActa = juntada
    ? calcularEstadisticasActa(juntada, cartones)
    : {
        totalClasicosPool: 16,
        clasicosCumplidosCount: 11,
        porcentajeCumplimiento: 69,
        ganadorNombre: 'Tío Rubén',
        ganadorHora: '00:47',
        tipoVictoria: 'Cartón Lleno',
        premio: 'No lavar los platos',
        clasicoNoPasoTexto: 'Nadie habló de política',
        remateNoPaso: 'Milagro navideño histórico.',
      };

  // Generador de imagen en alta resolución para compartir o descargar
  const generatePngBlob = async (): Promise<Blob | null> => {
    if (!storyCardRef.current) return null;
    try {
      const dataUrl = await toPng(storyCardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Alta resolución para que se vea impecable en historias
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (err) {
      console.error('Error al generar imagen de acta:', err);
      return null;
    }
  };

  const handleDownload = async () => {
    if (!storyCardRef.current || generatingImage) return;
    setGeneratingImage(true);
    try {
      const dataUrl = await toPng(storyCardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const link = document.createElement('a');
      link.download = `acta-${juntada?.slug || 'juntada'}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Error al descargar:', err);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    if (!storyCardRef.current || generatingImage) return;
    setGeneratingImage(true);
    try {
      const blob = await generatePngBlob();
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], `acta-${juntada?.slug || 'juntada'}.png`, {
          type: 'image/png',
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Acta de la noche: ${juntada?.nombre}`,
            text: `¡Así terminó el bingo en ${juntada?.nombre}! Ganó ${stats.ganadorNombre}.`,
          });
          setGeneratingImage(false);
          return;
        }
      }

      // Si no soporta compartir archivo directamente, usar fallback de descarga
      await handleDownload();
    } catch (err) {
      console.warn('Share falló o cancelado, usando fallback de descarga:', err);
      await handleDownload();
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleNuevaJuntada = () => {
    localStorage.removeItem('carton_lleno_active_id');
    localStorage.removeItem('carton_lleno_active_slug');
    localStorage.removeItem('carton_lleno_draft');
    localStorage.removeItem('carton_lleno_draft_clasicos');
    router.push('/nueva/paso-1');
  };

  if (loading || !juntada) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-neutral-700">Generando el acta...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 pb-4">
        {/* Header con botón volver */}
        <header className="flex items-center min-h-[44px] mb-3">
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="p-1 -ml-1 text-neutral-900 hover:text-black flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg active:bg-neutral-100"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-lg font-bold text-neutral-900 tracking-tight ml-2">
            El acta de la noche
          </h1>
        </header>

        <span className="text-[11px] font-semibold text-neutral-400 text-center block mb-2">
          Preview historia 9:16
        </span>

        {/* Tarjeta de Historia 9:16 (lista para captura y descarga) */}
        <div className="flex justify-center mb-5">
          <div
            ref={storyCardRef}
            className="w-full max-w-[270px] aspect-[9/16] bg-neutral-100 border-[1.5px] border-neutral-900 rounded-3xl p-5 flex flex-col justify-between text-neutral-900 shadow-sm"
          >
            <div>
              <span className="text-[9px] font-extrabold tracking-widest text-neutral-500 uppercase block mb-1">
                El acta de la noche
              </span>
              <h2 className="text-lg font-black leading-tight text-neutral-950 mb-4">
                {juntada.nombre}
              </h2>

              <div className="mb-4">
                <span className="text-3xl font-black text-neutral-950 block leading-none">
                  {stats.clasicosCumplidosCount}/{stats.totalClasicosPool}
                </span>
                <span className="text-[11px] text-neutral-600 font-medium">
                  clásicos se cumplieron
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="leading-snug">
                  <strong className="font-bold text-neutral-950">Ganó:</strong>{' '}
                  <span className="font-semibold text-neutral-800">{stats.ganadorNombre}</span>
                </p>
                <p className="leading-snug">
                  <strong className="font-bold text-neutral-950">No pasó:</strong>{' '}
                  <span className="text-neutral-700">
                    {stats.clasicoNoPasoTexto}. {stats.remateNoPaso}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-300 text-center">
              <span className="text-[10px] font-bold text-neutral-700 tracking-tight">
                Armá el tuyo en cartonlleno.app
              </span>
            </div>
          </div>
        </div>

        {/* Botones Compartir y Descargar */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            type="button"
            onClick={handleShare}
            disabled={generatingImage}
            className="min-h-[48px] bg-neutral-950 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={generatingImage}
            className="min-h-[48px] bg-white text-neutral-900 border-[1.5px] border-neutral-900 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-50 active:scale-98 transition-transform disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-700">¡Guardado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar
              </>
            )}
          </button>
        </div>

        {/* Recuadro CTA de próxima juntada */}
        <div className="p-4 rounded-2xl border-[1.5px] border-dashed border-neutral-300 bg-neutral-50/80 mt-auto">
          <h3 className="text-xs font-extrabold text-neutral-900 mb-0.5">
            ¿Tenés otra juntada?
          </h3>
          <p className="text-[11px] text-neutral-500 mb-2.5">
            Año Nuevo, amigos, la oficina...
          </p>
          <button
            type="button"
            onClick={handleNuevaJuntada}
            className="text-xs font-bold text-neutral-950 underline underline-offset-4 flex items-center gap-1 hover:text-black"
          >
            Armá el bingo de tu próxima juntada
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function ActaPage() {
  return (
    <Suspense
      fallback={
        <MobileContainer>
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-neutral-700">Cargando acta...</p>
          </div>
        </MobileContainer>
      }
    >
      <ActaContent />
    </Suspense>
  );
}
