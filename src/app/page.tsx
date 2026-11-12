'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

export default function HomePage() {
  // Animación del mini cartón interactivo de presentación
  const [markedCells, setMarkedCells] = useState<number[]>([0, 3]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMarkedCells((prev) => {
        if (prev.length >= 4) return [0];
        const next = [0, 1, 2, 3].find((i) => !prev.includes(i));
        return next !== undefined ? [...prev, next] : [0];
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const miniCasilleros = [
    'Se corta la luz',
    'Sobra vitel toné',
    '¿Y el novio?',
    'La abuela durmió',
  ];

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 justify-between">
        {/* Encabezado de marca */}
        <div>
          <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
            Human Friendly presenta
          </span>

          {/* Ilustración interactiva / mini cartón */}
          <div className="w-full mt-3 mb-6 p-4 rounded-2xl border-[1.5px] border-dashed border-neutral-300 bg-neutral-50/70 flex flex-col items-center justify-center min-h-[190px]">
            <div className="grid grid-cols-2 gap-2 w-full max-w-[240px]">
              {miniCasilleros.map((texto, idx) => {
                const isMarked = markedCells.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border-[1.5px] text-center flex flex-col items-center justify-center min-h-[64px] transition-all duration-300 ${
                      isMarked
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs scale-102'
                        : 'bg-white text-neutral-800 border-neutral-300'
                    }`}
                  >
                    {isMarked && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3] mb-0.5" />
                    )}
                    <span className="text-[11px] font-semibold leading-tight">
                      {texto}
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] text-neutral-400 mt-2.5 font-medium">
              El bingo de tu propia gente
            </span>
          </div>

          {/* Título principal */}
          <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight leading-[1.1] mb-2.5">
            Cartón lleno,<br />corazón contento
          </h1>

          <p className="text-neutral-600 text-sm leading-relaxed mb-6">
            Armá el bingo de las cosas que pasan siempre en tus juntadas de fin de año.
          </p>

          {/* 3 pasos */}
          <div className="grid grid-cols-3 gap-2.5 mb-8">
            <div className="p-3 rounded-xl border-[1.5px] border-neutral-200 bg-white flex flex-col justify-between min-h-[90px]">
              <span className="text-lg font-black text-neutral-950">1</span>
              <span className="text-[11px] font-semibold text-neutral-700 leading-tight">
                Cargá los clásicos
              </span>
            </div>
            <div className="p-3 rounded-xl border-[1.5px] border-neutral-200 bg-white flex flex-col justify-between min-h-[90px]">
              <span className="text-lg font-black text-neutral-950">2</span>
              <span className="text-[11px] font-semibold text-neutral-700 leading-tight">
                Compartí el link
              </span>
            </div>
            <div className="p-3 rounded-xl border-[1.5px] border-neutral-200 bg-white flex flex-col justify-between min-h-[90px]">
              <span className="text-lg font-black text-neutral-950">3</span>
              <span className="text-[11px] font-semibold text-neutral-700 leading-tight">
                Marcá en la juntada
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3.5 mt-auto pt-4">
          <Link href="/nueva/paso-1" className="w-full">
            <Button size="lg" fullWidth>
              Armar mi bingo
            </Button>
          </Link>
          <Link
            href="/unirse"
            className="text-center text-sm font-bold text-neutral-900 underline underline-offset-4 py-2 hover:text-black"
          >
            Me invitaron a una juntada
          </Link>
        </div>
      </div>
    </MobileContainer>
  );
}
