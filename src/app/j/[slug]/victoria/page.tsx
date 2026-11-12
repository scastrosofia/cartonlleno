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

  const ganadorInfo = esLleno
    ? juntada?.ganadorLleno
    : juntada?.ganadorLinea || juntada?.ganadorLleno;

  const nombreGanador = ganadorInfo?.nombre || 'Alguien de la mesa';
  const horaGanador = ganadorInfo?.hora || '00:47';
  const tituloFestejo = esLleno ? '¡CARTÓN LLENO!' : '¡LÍNEA!';

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
      <div className="flex flex-col flex-1 justify-between py-2 text-center">
        {/* Recuadro de animación de festejo */}
        <div className="w-full p-6 rounded-2xl border-[1.5px] border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center min-h-[220px] mb-6 relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-white border-[1.5px] border-neutral-900 flex items-center justify-center mb-3 shadow-md animate-bounce">
            <Trophy className="w-10 h-10 text-neutral-900" />
          </div>
          <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-neutral-700" />
            ¡Tenemos ganador en la mesa!
          </span>
          <span className="text-[11px] text-neutral-500 mt-1">
            {juntada.nombre}
          </span>
        </div>

        {/* Título gigante y datos de la victoria */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-4xl font-black text-neutral-950 tracking-tight leading-none mb-3">
            {tituloFestejo}
          </h1>

          <p className="text-base font-semibold text-neutral-800 mb-3">
            <strong>{nombreGanador}</strong> ganó a las {horaGanador}
          </p>

          <div className="inline-flex items-center px-4 py-1.5 rounded-full border-[1.5px] border-neutral-900 bg-white text-xs font-bold text-neutral-900 mb-4 shadow-2xs">
            Premio: {juntada.premio || 'No lavar los platos'}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <Smartphone className="w-4 h-4 stroke-[1.8]" />
            <span>Pantalla para mostrarle a la mesa</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 mt-auto pt-4">
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push(`/j/${juntada.slug}/acta`)}
          >
            Ver el acta de la noche
          </Button>

          <Button
            size="lg"
            variant="outline"
            fullWidth
            onClick={() => router.push(`/j/${juntada.slug}/acta`)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir en historias
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
