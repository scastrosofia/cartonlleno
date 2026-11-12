import { FormatoCarton } from '@/types';

export function getGridDimension(formato: FormatoCarton): number {
  switch (formato) {
    case '3x3': return 3;
    case '4x4': return 4;
    case '5x5': return 5;
    default: return 4;
  }
}

export function getTotalCasilleros(formato: FormatoCarton): number {
  const dim = getGridDimension(formato);
  return dim * dim;
}

export function getAllWinningLines(formato: FormatoCarton): number[][] {
  const dim = getGridDimension(formato);
  const lines: number[][] = [];

  // Filas
  for (let r = 0; r < dim; r++) {
    const row: number[] = [];
    for (let c = 0; c < dim; c++) {
      row.push(r * dim + c);
    }
    lines.push(row);
  }

  // Columnas
  for (let c = 0; c < dim; c++) {
    const col: number[] = [];
    for (let r = 0; r < dim; r++) {
      col.push(r * dim + c);
    }
    lines.push(col);
  }

  // Diagonal principal
  const diag1: number[] = [];
  for (let i = 0; i < dim; i++) {
    diag1.push(i * dim + i);
  }
  lines.push(diag1);

  // Diagonal secundaria
  const diag2: number[] = [];
  for (let i = 0; i < dim; i++) {
    diag2.push(i * dim + (dim - 1 - i));
  }
  lines.push(diag2);

  return lines;
}

/**
 * Revisa si los índices marcados completan al menos una fila, columna o diagonal.
 */
export function checkLinea(marcados: number[], formato: FormatoCarton): boolean {
  const winningLines = getAllWinningLines(formato);
  const marcadosSet = new Set(marcados);

  return winningLines.some(line => line.every(idx => marcadosSet.has(idx)));
}

/**
 * Revisa si todos los casilleros del cartón están marcados.
 */
export function checkCartonLleno(marcados: number[], formato: FormatoCarton): boolean {
  const total = getTotalCasilleros(formato);
  const marcadosSet = new Set(marcados);

  for (let i = 0; i < total; i++) {
    if (!marcadosSet.has(i)) return false;
  }
  return true;
}

/**
 * Calcula cuántos casilleros faltan para la línea más cercana.
 * Útil para el indicador "Te falta X para línea".
 */
export function calcularFaltantesParaLinea(marcados: number[], formato: FormatoCarton): number {
  const winningLines = getAllWinningLines(formato);
  const marcadosSet = new Set(marcados);
  const dim = getGridDimension(formato);

  let minFaltantes = dim;
  for (const line of winningLines) {
    const faltan = line.filter(idx => !marcadosSet.has(idx)).length;
    if (faltan < minFaltantes) {
      minFaltantes = faltan;
    }
  }

  return minFaltantes;
}
