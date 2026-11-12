'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface StepHeaderProps {
  title: string;
  step: 1 | 2 | 3;
  onBack?: () => void;
}

export function StepHeader({ title, step, onBack }: StepHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="w-full mb-6">
      <div className="flex items-center justify-between min-h-[44px] mb-3">
        <button
          onClick={handleBack}
          aria-label="Volver atrás"
          className="p-1 -ml-1 text-neutral-900 hover:text-black flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg active:bg-neutral-100"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        <h1 className="text-lg font-bold text-neutral-900 tracking-tight flex-1 ml-2">
          {title}
        </h1>
        <span className="text-xs font-medium text-neutral-500">
          Paso {step} de 3
        </span>
      </div>

      {/* Barra de progreso de 3 segmentos */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <div
          className={`h-1.5 rounded-full transition-colors duration-200 ${
            step >= 1 ? 'bg-neutral-900' : 'bg-neutral-200'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-colors duration-200 ${
            step >= 2 ? 'bg-neutral-900' : 'bg-neutral-200'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-colors duration-200 ${
            step >= 3 ? 'bg-neutral-900' : 'bg-neutral-200'
          }`}
        />
      </div>
    </header>
  );
}
