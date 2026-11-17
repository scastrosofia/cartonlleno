'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Button } from '@/components/ui/Button';
import { getJuntadaBySlug, subscribeToJuntada } from '@/lib/firebase/service';
import { Juntada } from '@/types';
import confetti from 'canvas-confetti';
import { Smartphone, Sparkles, Trophy, Share2 } from 'lucide-react';

function VictoriaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const tipoParam = searchParams.get('tipo'); // 'linea' o 'lleno'

  const [juntada, setJuntada] = useState<Juntada | null>(null);
  const [loading, setLoading] = useState(true);

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
    const unsub = subscribeToJuntada(juntada.id, (data) => {
      if (data) setJuntada(data);
    });
    return () => unsub();
  }, [juntada?.id]);

  // Disparo de confeti al cargar y repetido
  useEffect(() => {
    const end = Date.now() + 2.5 * 1000;
    const interval: any = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 350);

    return () => clearInterval(interval);
  }, []);

  const esLleno = tipoParam === 'lleno' || Boolean(juntada?.ganadorLleno);
  const numParam = searchParams.get('num');

  const ganadorInfo = esLleno
    ? juntada?.ganadorLleno
    : (juntada?.ganadoresLinea && juntada.ganadoresLinea.length > 0
        ? (numParam ? juntada.ganadoresLinea.find(g => g.numeroLinea === Number(numParam)) : null) || juntada.ganadoresLinea[juntada.ganadoresLinea.length - 1]
        : juntada?.ganadorLinea || juntada?.ganadorLleno);

  const nombreGanador = ganadorInfo?.nombre || 'Alguien de la mesa';
  const horaGanador = ganadorInfo?.hora || '00:47';
  const numeroLinea = ganadorInfo?.numeroLinea || (numParam ? Number(numParam) : 1);
  const ordLinea = numeroLinea === 1 ? '1ª' : numeroLinea === 2 ? '2ª' : '3ª';
  const tituloFestejo = esLleno ? '¡CARTÓN LLENO!' : `¡${ordLinea} LÍNEA!`;

  if (loading || !juntada) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-neutral-700">Cargando festejo...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 justify-between py-4 text-center">
        {/* Banner de animación de festejo con Logo Gif */}
        <div className="w-full p-4 rounded-3xl border-2 border-dashed border-[#E52320]/30 bg-red-50/30 flex flex-col items-center justify-center min-h-[190px] mb-6 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-carton.gif"
            alt="Cartón lleno, corazón contento"
            className="w-48 h-auto max-h-24 object-contain mb-2"
          />
          <span className="text-xs font-bold text-[#E52320] flex items-center gap-1.5 lowercase">
            <Sparkles className="w-4 h-4 text-[#E52320]" />
            ¡tenemos ganador en la mesa!
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 font-serif">
            {juntada.nombre}
          </span>
        </div>

        {/* Título gigante y datos de la victoria */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#E52320] tracking-tight leading-none mb-3">
            {tituloFestejo}
          </h1>

          <p className="text-sm font-medium text-neutral-700 mb-3 lowercase">
            <strong className="font-bold text-neutral-900">{nombreGanador}</strong> ganó a las {horaGanador}
          </p>

          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-medium text-neutral-800 mb-4 shadow-2xs lowercase">
            premio: {juntada.premio || 'se lleva las sobras del vitel toné'}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium lowercase">
            <Smartphone className="w-4 h-4 stroke-[1.8]" />
            <span>pantalla para mostrarle a la mesa</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 mt-auto pt-4">
          {!esLleno && (
            <Button
              size="lg"
              fullWidth
              onClick={() => router.push(`/j/${juntada.slug}/carton`)}
              className="bg-[#E52320] text-white shadow-md animate-pulse"
            >
              seguir jugando por el cartón lleno
            </Button>
          )}

          <Button
            size="lg"
            variant={esLleno ? 'primary' : 'outline'}
            fullWidth
            onClick={() => router.push(`/j/${juntada.slug}/acta`)}
          >
            ver el resumen de la noche
          </Button>

          <Button
            size="lg"
            variant="outline"
            fullWidth
            onClick={() => router.push(`/j/${juntada.slug}/acta`)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            compartir en historias
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function VictoriaPage() {
  return (
    <Suspense
      fallback={
        <MobileContainer>
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-neutral-700">Cargando...</p>
          </div>
        </MobileContainer>
      }
    >
      <VictoriaContent />
    </Suspense>
  );
}
