import React from 'react';
import { Casillero, FormatoCarton } from '@/types';
import { BingoCell } from './BingoCell';

interface BingoGridProps {
  casilleros: Casillero[];
  marcados: number[];
  formato: FormatoCarton;
  highlightedClasicoId?: string | null;
  onToggleCell: (index: number) => void;
}

export function BingoGrid({
  casilleros,
  marcados,
  formato,
  highlightedClasicoId,
  onToggleCell,
}: BingoGridProps) {
  let gridCols = 'grid-cols-4';
  if (formato === '3x3') gridCols = 'grid-cols-3';
  if (formato === '5x5') gridCols = 'grid-cols-5';

  const marcadosSet = new Set(marcados);

  return (
    <div className={`grid ${gridCols} gap-2 w-full my-auto`}>
      {casilleros.map((casillero, index) => {
        const isMarked = marcadosSet.has(index);
        const isSocialHighlighted = Boolean(
          highlightedClasicoId &&
          casillero.id === highlightedClasicoId &&
          !isMarked
        );

        return (
          <BingoCell
            key={`${casillero.id}-${index}`}
            casillero={casillero}
            index={index}
            isMarked={isMarked}
            isSocialHighlighted={isSocialHighlighted}
            onToggle={onToggleCell}
            formato={formato}
          />
        );
      })}
    </div>
  );
}
