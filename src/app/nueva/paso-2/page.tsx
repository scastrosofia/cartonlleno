'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { StepHeader } from '@/components/layout/StepHeader';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Plus, X } from 'lucide-react';
import { getBancoCompletoParaTipo } from '@/data/bancoClasicos';
import { TipoJuntada, FormatoCarton } from '@/types';
import { getTotalCasilleros } from '@/lib/bingo/rules';

interface ClassicItem {
  id: string;
  texto: string;
}

export default function CargarClasicosPaso2Page() {
  const router = useRouter();

  const [tipo, setTipo] = useState<TipoJuntada>('familia');
  const [formato, setFormato] = useState<FormatoCarton>('4x4');
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [clasicos, setClasicos] = useState<ClassicItem[]>([]);

  // Cargar borrador de paso 1
  useEffect(() => {
    const draft = localStorage.getItem('carton_lleno_draft');
    if (!draft) {
      router.replace('/nueva/paso-1');
      return;
    }

    try {
      const parsed = JSON.parse(draft);
      if (parsed.tipo) setTipo(parsed.tipo);
      if (parsed.formato) setFormato(parsed.formato);

      const savedClasicos = localStorage.getItem('carton_lleno_draft_clasicos');
      if (savedClasicos) {
        setClasicos(JSON.parse(savedClasicos));
      } else {
        // Precargar 4 sugerencias según el wireframe
        const banco = getBancoCompletoParaTipo(parsed.tipo || 'familia');
        const iniciales = banco.slice(0, 4).map((b) => ({
          id: `init_${b.id}`,
          texto: b.texto,
        }));
        setClasicos(iniciales);
      }
    } catch {
      router.replace('/nueva/paso-1');
    }
  }, [router]);

  const totalRequerido = formato === '5x5' ? 24 : getTotalCasilleros(formato);

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nuevoTexto.trim();
    if (!clean) return;

    if (clasicos.some((c) => c.texto.toLowerCase() === clean.toLowerCase())) {
      setNuevoTexto('');
      return;
    }

    const updated = [
      ...clasicos,
      { id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, texto: clean },
    ];
    setClasicos(updated);
    setNuevoTexto('');
    localStorage.setItem('carton_lleno_draft_clasicos', JSON.stringify(updated));
  };

  const handleAddFromBanco = (texto: string) => {
    if (clasicos.some((c) => c.texto.toLowerCase() === texto.toLowerCase())) return;
    const updated = [
      ...clasicos,
      { id: `banco_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, texto },
    ];
    setClasicos(updated);
    localStorage.setItem('carton_lleno_draft_clasicos', JSON.stringify(updated));
  };

  const handleRemove = (id: string) => {
    const updated = clasicos.filter((c) => c.id !== id);
    setClasicos(updated);
    localStorage.setItem('carton_lleno_draft_clasicos', JSON.stringify(updated));
  };

  const handleNext = () => {
    localStorage.setItem('carton_lleno_draft_clasicos', JSON.stringify(clasicos));
    router.push('/nueva/paso-3');
  };

  // Sugerencias del banco no agregadas todavía
  const banco = getBancoCompletoParaTipo(tipo);
  const agregadosSet = new Set(clasicos.map((c) => c.texto.toLowerCase()));
  const sugerenciasDisponibles = banco
    .filter((b) => !agregadosSet.has(b.texto.toLowerCase()))
    .slice(0, 8);

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 pb-4">
        <StepHeader title="Los clásicos" step={2} />

        <div className="flex flex-col flex-1">
          {/* Título */}
          <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight leading-tight mb-3">
            ¿Qué pasa SIEMPRE en esta juntada?
          </h2>

          {/* Formulario de carga rápida */}
          <form onSubmit={handleAddCustom} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Ej: el tío cuenta el mismo chiste"
              value={nuevoTexto}
              onChange={(e) => setNuevoTexto(e.target.value)}
              className="flex-1 min-h-[48px] px-3.5 py-2.5 text-sm bg-white text-neutral-900 border-[1.5px] border-neutral-300 rounded-xl outline-none focus:border-neutral-900 placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={!nuevoTexto.trim()}
              aria-label="Agregar clásico"
              className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-40 transition-transform"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>

          {/* Contador y barra de progreso */}
          <ProgressBar
            current={clasicos.length}
            total={totalRequerido}
            leftLabel={`${clasicos.length} de ${totalRequerido}`}
            rightLabel="Los invitados pueden sumar el resto"
            className="mb-4"
          />

          {/* Lista de clásicos cargados */}
          <div className="flex flex-col gap-2 mb-6 max-h-[220px] overflow-y-auto pr-0.5">
            {clasicos.length === 0 ? (
              <div className="p-4 rounded-xl border-[1.5px] border-dashed border-neutral-300 text-center text-xs text-neutral-500">
                Todavía no cargaste ningún clásico. ¡Agregá uno o elegí del banco abajo!
              </div>
            ) : (
              clasicos.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2.5 rounded-xl border-[1.5px] border-neutral-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
                >
                  <span className="text-xs font-semibold text-neutral-900 leading-snug line-clamp-2">
                    {item.texto}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    aria-label="Eliminar clásico"
                    className="p-1 text-neutral-400 hover:text-neutral-800 rounded-md active:bg-neutral-100 shrink-0"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Banco de clásicos */}
          <div className="mt-auto">
            <span className="text-xs font-bold text-neutral-900 block mb-2.5">
              ¿Sin ideas? Banco de clásicos
            </span>
            <div className="flex flex-wrap gap-2">
              {sugerenciasDisponibles.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => handleAddFromBanco(sug.texto)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border-[1.5px] border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500 active:scale-95 transition-all text-left"
                >
                  <Plus className="w-3 h-3 text-neutral-600 stroke-[2.5]" />
                  <span>{sug.texto}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botón Siguiente */}
        <div className="mt-6 pt-2">
          <Button size="lg" fullWidth onClick={handleNext}>
            Siguiente: invitar
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}
