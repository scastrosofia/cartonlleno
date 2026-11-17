'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <MobileContainer className="p-2 sm:p-3 bg-neutral-100">
      {/* Marco de doble línea roja exterior e interior idéntico al wireframe */}
      <div className="w-full h-full border-[2.5px] border-[#E52320] rounded-3xl p-1.5 flex flex-col flex-1">
        <div className="w-full h-full border-[1.5px] border-[#E52320] rounded-2xl p-4 sm:p-5 flex flex-col justify-between flex-1 bg-white">
          
          {/* Parte Superior: Gif animado / Logo ilustrado */}
          <div className="flex flex-col items-center pt-2">
            <div className="w-full max-w-[310px] aspect-[4/3] relative flex items-center justify-center mb-3">
              <Image
                src="/logo-carton.gif"
                alt="Cartón lleno, corazón contento"
                width={360}
                height={270}
                className="w-full h-auto object-contain select-none"
                priority
                unoptimized
              />
            </div>

            {/* Pregunta principal */}
            <h1 className="text-xl sm:text-[22px] font-extrabold text-neutral-950 tracking-tight text-center leading-tight mb-8">
              ¿qué tanto conocés a los tuyos?
            </h1>

            {/* Los 3 pasos con corazones rojos */}
            <div className="grid grid-cols-3 gap-2 w-full mb-8">
              {/* Paso 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-11 h-11 flex items-center justify-center mb-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="#E52320"
                    className="w-11 h-11 drop-shadow-2xs"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-sm pb-1">
                    1
                  </span>
                </div>
                <span className="text-[12px] font-bold text-neutral-950 leading-tight">
                  cargá lo que pasa siempre
                </span>
              </div>

              {/* Paso 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-11 h-11 flex items-center justify-center mb-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="#E52320"
                    className="w-11 h-11 drop-shadow-2xs"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-sm pb-1">
                    2
                  </span>
                </div>
                <span className="text-[12px] font-bold text-neutral-950 leading-tight">
                  compartí el link
                </span>
              </div>

              {/* Paso 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-11 h-11 flex items-center justify-center mb-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="#E52320"
                    className="w-11 h-11 drop-shadow-2xs"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-sm pb-1">
                    3
                  </span>
                </div>
                <span className="text-[12px] font-bold text-neutral-950 leading-tight">
                  jugá con los tuyos
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción y pie */}
          <div className="flex flex-col gap-4 mt-auto">
            <Link href="/nueva/paso-1" className="w-full">
              <button
                type="button"
                className="w-full min-h-[52px] bg-[#E52320] text-white hover:bg-[#CC1E1B] active:scale-98 font-bold text-[15px] rounded-full transition-all shadow-xs flex items-center justify-center select-none"
              >
                quiero armar mi bingo
              </button>
            </Link>

            <Link
              href="/unirse"
              className="text-center text-sm font-bold text-neutral-950 pb-0.5 border-b-[1.5px] border-[#E52320] w-fit mx-auto hover:text-black transition-colors"
            >
              me invitaron a una juntada
            </Link>

            {/* Footer con logo Human Friendly */}
            <div className="pt-6 pb-1 flex flex-col items-start gap-1">
              <span className="text-[13px] sm:text-[14px] font-bold text-neutral-950 leading-none">
                by
              </span>
              <Image
                src="/logo-human-friendly.png"
                alt="Human Friendly"
                width={180}
                height={40}
                className="h-[32px] sm:h-[36px] w-auto object-contain"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </MobileContainer>
  );
}
