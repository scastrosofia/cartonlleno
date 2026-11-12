'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft } from 'lucide-react';
import { getJuntadaByCodigo } from '@/lib/firebase/service';

export default function UnirsePorCodigoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codigo.trim().toUpperCase();
    if (!clean) {
      setError('Ingresá el código de la juntada');
      return;
    }

    setBuscando(true);
    setError('');

    try {
      const juntada = await getJuntadaByCodigo(clean);
      if (!juntada) {
        setError('No encontramos ninguna juntada con ese código. Revisá y volvé a intentar.');
        setBuscando(false);
        return;
      }

      router.push(`/j/${juntada.slug}`);
    } catch (err) {
      console.error('Error al buscar juntada por código:', err);
      setError('Ocurrió un error. Volvé a intentar.');
      setBuscando(false);
    }
  };

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 pb-4">
        {/* Header con botón atrás */}
        <header className="flex items-center min-h-[44px] mb-6">
          <button
            onClick={() => router.push('/')}
            aria-label="Volver al inicio"
            className="p-1 -ml-1 text-neutral-900 hover:text-black flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg active:bg-neutral-100"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-lg font-bold text-neutral-900 tracking-tight ml-2">
            Sumate a una juntada
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight leading-tight mb-2">
              Ingresá el código
            </h2>
            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              Pedile el código corto de 6 caracteres al organizador de la juntada (ej: TIA24).
            </p>

            <Input
              label="Código de la juntada"
              placeholder="Ej: TIA24"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              error={error}
              className="text-center font-mono text-xl tracking-widest font-black uppercase"
              maxLength={8}
              autoFocus
            />
          </div>

          <div className="mt-auto pt-4">
            <Button size="lg" fullWidth type="submit" disabled={buscando || !codigo.trim()}>
              {buscando ? 'Buscando juntada...' : 'Entrar a la juntada'}
            </Button>
          </div>
        </form>
      </div>
    </MobileContainer>
  );
}
