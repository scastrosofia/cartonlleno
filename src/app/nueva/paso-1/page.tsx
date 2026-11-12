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
      setErrorNombre('Escribí un nombre para tu juntada');
      return;
    }

    const draft = {
      nombre: nombre.trim(),
      tipo,
      fecha: fecha.trim() || '24/12 · Nochebuena',
      formato,
      modo,
      premio: premio.trim() || 'El que gana no lava los platos',
    };

    localStorage.setItem('carton_lleno_draft', JSON.stringify(draft));
    router.push('/nueva/paso-2');
  };

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 pb-4">
        <StepHeader title="Nueva juntada" step={1} />

        <div className="flex flex-col gap-5 flex-1">
          {/* Nombre */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-1.5">
              ¿Cómo se llama la juntada?
            </label>
            <Input
              placeholder="Navidad en lo de la Tía Marta"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errorNombre) setErrorNombre('');
              }}
              error={errorNombre}
              autoFocus
            />
          </div>

          {/* Tipo de juntada */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-2">
              ¿Qué juntada es?
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'familia', label: 'Familia' },
                  { id: 'amigos', label: 'Amigos' },
                  { id: 'oficina', label: 'Oficina' },
                  { id: 'otra', label: 'Otra' },
                ] as const
              ).map((item) => (
                <Chip
                  key={item.id}
                  active={tipo === item.id}
                  onClick={() => setTipo(item.id)}
                >
                  {item.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-1.5">
              ¿Cuándo?
            </label>
            <Input
              placeholder="24/12 · Nochebuena"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {/* Formato del cartón */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-2">
              Formato del cartón
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* 3x3 */}
              <button
                type="button"
                onClick={() => setFormato('3x3')}
                className={`p-3 rounded-xl border-[1.5px] flex flex-col items-center text-center transition-all ${
                  formato === '3x3'
                    ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {/* Mini icono grilla 3x3 */}
                <div className="grid grid-cols-3 gap-0.5 w-6 h-6 mb-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        formato === '3x3' ? 'bg-neutral-900' : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-900">
                  3×3 · Rápido
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">
                  9 casilleros
                </span>
              </button>

              {/* 4x4 */}
              <button
                type="button"
                onClick={() => setFormato('4x4')}
                className={`p-3 rounded-xl border-[1.5px] flex flex-col items-center text-center transition-all ${
                  formato === '4x4'
                    ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {/* Mini icono grilla 4x4 */}
                <div className="grid grid-cols-4 gap-0.5 w-6 h-6 mb-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        formato === '4x4' ? 'bg-neutral-900' : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-900">
                  4×4 · Clásico
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">
                  16 casilleros
                </span>
              </button>

              {/* 5x5 */}
              <button
                type="button"
                onClick={() => setFormato('5x5')}
                className={`p-3 rounded-xl border-[1.5px] flex flex-col items-center text-center transition-all ${
                  formato === '5x5'
                    ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {/* Mini icono grilla 5x5 */}
                <div className="grid grid-cols-5 gap-0.5 w-6 h-6 mb-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        formato === '5x5'
                          ? i === 12
                            ? 'bg-neutral-400'
                            : 'bg-neutral-900'
                          : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-900">
                  5×5 · Largo
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                  25 + centro libre
                </span>
              </button>
            </div>
          </div>

          {/* ¿Cómo se juega? */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-2">
              ¿Cómo se juega?
            </label>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setModo('vivo')}
                className={`p-3.5 rounded-xl border-[1.5px] text-left flex items-start gap-3 transition-all ${
                  modo === 'vivo'
                    ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="mt-0.5 w-4 h-4 rounded-full border-[1.5px] border-neutral-900 flex items-center justify-center shrink-0">
                  {modo === 'vivo' && (
                    <div className="w-2 h-2 rounded-full bg-neutral-900" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-neutral-900 block">
                    En vivo
                  </span>
                  <span className="text-xs text-neutral-500">
                    Cada uno marca en su celu
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModo('tradicional')}
                className={`p-3.5 rounded-xl border-[1.5px] text-left flex items-start gap-3 transition-all ${
                  modo === 'tradicional'
                    ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="mt-0.5 w-4 h-4 rounded-full border-[1.5px] border-neutral-900 flex items-center justify-center shrink-0">
                  {modo === 'tradicional' && (
                    <div className="w-2 h-2 rounded-full bg-neutral-900" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold text-neutral-900 block">
                    Tradicional: sin celus en la mesa
                  </span>
                  <span className="text-xs text-neutral-500">
                    Descargás los cartones en PDF y se juega con birome
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Premio */}
          <div>
            <label className="text-sm font-bold text-neutral-900 block mb-1.5">
              Premio (opcional)
            </label>
            <Input
              placeholder="El que gana no lava los platos"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
            />
          </div>
        </div>

        {/* Botón Siguiente */}
        <div className="mt-6 pt-2">
          <Button size="lg" fullWidth onClick={handleNext}>
            Siguiente
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
