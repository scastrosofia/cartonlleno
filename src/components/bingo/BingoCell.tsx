import React from 'react';
import { Check } from 'lucide-react';
import { Casillero } from '@/types';

interface BingoCellProps {
  casillero: Casillero;
  index: number;
  isMarked: boolean;
  isSocialHighlighted?: boolean;
  onToggle: (index: number) => void;
  formato: '3x3' | '4x4' | '5x5';
}

export function BingoCell({
  casillero,
  index,
  isMarked,
  isSocialHighlighted = false,
  onToggle,
  formato,
}: BingoCellProps) {
  const isFree = Boolean(casillero.esLibre);

  // Ajuste de tamaño de fuente según el formato para asegurar legibilidad en 390px
  let textSize = 'text-xs';
  if (formato === '3x3') {
    textSize = 'text-[13px] sm:text-sm font-medium';
  } else if (formato === '4x4') {
    textSize = 'text-[11px] sm:text-xs font-medium leading-tight';
  } else {
    textSize = 'text-[9px] sm:text-[10px] font-medium leading-snug';
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(index)}
      disabled={isFree}
      aria-pressed={isMarked}
      className={`relative flex flex-col items-center justify-center text-center p-2 rounded-xl transition-all select-none active:scale-95 aspect-square border-[1.5px] ${
        isMarked
          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
          : isSocialHighlighted
          ? 'bg-white text-neutral-900 border-dashed border-2 border-neutral-900 ring-2 ring-neutral-200'
          : 'bg-white text-neutral-900 border-neutral-300 hover:border-neutral-500'
      } ${isFree ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {isMarked && (
        <span className="mb-0.5 text-white flex items-center justify-center">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      )}
      <span className={`${textSize} line-clamp-3 select-none`}>
        {casillero.texto}
      </span>
      {isSocialHighlighted && !isMarked && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-900 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-900"></span>
        </span>
      )}
    </button>
  );
}
