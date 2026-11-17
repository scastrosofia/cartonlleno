'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { StepHeader } from '@/components/layout/StepHeader';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { TipoJuntada, FormatoCarton, ModoJuego } from '@/types';

export default function CrearJuntadaPaso1Page() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoJuntada>('familia');
  const [fecha, setFecha] = useState('24/12 · Nochebuena');
  const [formato, setFormato] = useState<FormatoCarton>('4x4');
  const [modo, setModo] = useState<ModoJuego>('vivo');
  const [premio, setPremio] = useState('');
  const [errorNombre, setErrorNombre] = useState('');

  // Cargar borrador previo si existe
  useEffect(() => {
    const draft = localStorage.getItem('carton_lleno_draft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.nombre) setNombre(data.nombre);
        if (data.tipo) setTipo(data.tipo);
        if (data.fecha) setFecha(data.fecha);
        if (data.formato) setFormato(data.formato);
        if (data.modo) setModo(data.modo);
        if (data.premio) setPremio(data.premio);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleNext = () => {
    if (!nombre.trim()) {
      setErrorNombre('escribí un nombre para tu juntada');
      return;
    }

    const draft = {
      nombre: nombre.trim(),
      tipo,
      fecha: fecha.trim() || '24/12 · nochebuena',
      formato,
      modo,
      premio: premio.trim() || 'el que gana se lleva las sobras de vitel toné',
    };

    localStorage.setItem('carton_lleno_draft', JSON.stringify(draft));
    router.push('/nueva/paso-2');
  };

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 pb-4">
        <StepHeader title="nueva juntada" step={1} />

        <div className="flex flex-col gap-5 flex-1">
          {/* Nombre */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-1.5 lowercase">
              ¿cómo se llama la juntada?
            </label>
            <Input
              placeholder="navidad en lo de la tía marta"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errorNombre) setErrorNombre('');
              }}
              error={errorNombre}
              autoFocus
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-1.5 lowercase">
              ¿cuándo?
            </label>
            <Input
              placeholder="24/12 · nochebuena"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {/* Formato del cartón */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-2 lowercase">
              formato del cartón
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* 3x3 */}
              <button
                type="button"
                onClick={() => setFormato('3x3')}
                className={`py-3.5 px-2 rounded-2xl border-[1.5px] flex flex-col items-center justify-center text-center transition-all ${
                  formato === '3x3'
                    ? 'border-neutral-950 bg-white ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="grid grid-cols-3 gap-0.5 w-6 h-6 mb-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-[2px] ${
                        formato === '3x3' ? 'bg-[#E52320]' : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-900 lowercase">
                  3x3 · rápido
                </span>
              </button>

              {/* 4x4 */}
              <button
                type="button"
                onClick={() => setFormato('4x4')}
                className={`py-3.5 px-2 rounded-2xl border-[1.5px] flex flex-col items-center justify-center text-center transition-all ${
                  formato === '4x4'
                    ? 'border-neutral-950 bg-white ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="grid grid-cols-4 gap-0.5 w-6 h-6 mb-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-[2px] ${
                        formato === '4x4' ? 'bg-[#E52320]' : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-900 lowercase">
                  4x4 · clásico
                </span>
              </button>

              {/* 5x5 */}
              <button
                type="button"
                onClick={() => setFormato('5x5')}
                className={`py-3.5 px-2 rounded-2xl border-[1.5px] flex flex-col items-center justify-center text-center transition-all ${
                  formato === '5x5'
                    ? 'border-neutral-950 bg-white ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="grid grid-cols-5 gap-0.5 w-6 h-6 mb-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-[2px] ${
                        formato === '5x5'
                          ? i === 12
                            ? 'bg-neutral-400'
                            : 'bg-[#E52320]'
                          : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-900 lowercase">
                  5x5 · largo
                </span>
              </button>
            </div>
          </div>

          {/* ¿Cómo se juega? */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-2 lowercase">
              ¿cómo se juega?
            </label>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setModo('vivo')}
                className={`p-4 rounded-2xl border-[1.5px] text-left flex items-start gap-3 transition-all ${
                  modo === 'vivo'
                    ? 'border-neutral-950 bg-neutral-50/50 ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                  modo === 'vivo' ? 'border-[#E52320]' : 'border-neutral-400'
                }`}>
                  {modo === 'vivo' && (
                    <div className="w-2 h-2 rounded-full bg-[#E52320]" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-neutral-900 block lowercase">
                    en vivo
                  </span>
                  <span className="text-xs text-neutral-500 lowercase">
                    cada uno marca en su celu
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModo('tradicional')}
                className={`p-4 rounded-2xl border-[1.5px] text-left flex items-start gap-3 transition-all ${
                  modo === 'tradicional'
                    ? 'border-neutral-950 bg-neutral-50/50 ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                  modo === 'tradicional' ? 'border-[#E52320]' : 'border-neutral-400'
                }`}>
                  {modo === 'tradicional' && (
                    <div className="w-2 h-2 rounded-full bg-[#E52320]" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-neutral-900 block lowercase">
                    tradicional: sin celus en la mesa
                  </span>
                  <span className="text-xs text-neutral-500 lowercase">
                    descargás los cartones en PDF y se juega con birome
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Premio */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-1.5 lowercase">
              premio (opcional)
            </label>
            <Input
              placeholder="el que gana se lleva las sobras de vitel toné"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
            />
          </div>
        </div>

        {/* Botón Siguiente */}
        <div className="mt-6 pt-2">
          <Button size="lg" fullWidth onClick={handleNext}>
            siguiente
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
