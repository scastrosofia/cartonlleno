import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Carton, Juntada, Clasico } from '@/types';
import { getGridDimension } from '../bingo/rules';

export interface OpcionesPdf {
  modoImpresion: '1_por_hoja' | '4_por_hoja';
  incluirHojaCantor: boolean;
  sumarExtras: boolean;
}

export async function generarPdfCartones(
  juntada: Juntada,
  cartonesOriginales: Carton[],
  todosLosClasicos: Clasico[],
  opciones: OpcionesPdf
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const qrDataUrl = await QRCode.toDataURL(
    typeof window !== 'undefined' ? `${window.location.origin}` : 'https://cartonlleno.app',
    { margin: 1, width: 120 }
  );

  let cartones = [...cartonesOriginales];

  // Si se seleccionó sumar 2 cartones extra
  if (opciones.sumarExtras) {
    const ultimoNumero = cartones.length > 0 ? cartones[cartones.length - 1].numero : 0;
    const base = cartones[0] || { casilleros: [], juntadaId: juntada.id };
    cartones.push({
      id: `extra_1`,
      juntadaId: juntada.id,
      jugadorId: 'extra_1',
      jugadorNombre: 'Extra (Invitado sorpresa 1)',
      numero: ultimoNumero + 1,
      casilleros: base.casilleros,
      marcados: [],
    });
    cartones.push({
      id: `extra_2`,
      juntadaId: juntada.id,
      jugadorId: 'extra_2',
      jugadorNombre: 'Extra (Invitado sorpresa 2)',
      numero: ultimoNumero + 2,
      casilleros: [...base.casilleros].reverse(),
      marcados: [],
    });
  }

  const pageWidth = 210;
  const pageHeight = 297;

  if (opciones.modoImpresion === '1_por_hoja') {
    // 1 CARTÓN POR HOJA (A4 Completa, según Wireframe 10)
    cartones.forEach((carton, idx) => {
      if (idx > 0) doc.addPage();
      renderCartonA4Completo(doc, juntada, carton, qrDataUrl, pageWidth, pageHeight);
    });
  } else {
    // 4 CARTONES POR HOJA (2x2 en A4)
    const cartonesPorPagina = 4;
    const paginas = Math.ceil(cartones.length / cartonesPorPagina);

    for (let p = 0; p < paginas; p++) {
      if (p > 0) doc.addPage();
      const lote = cartones.slice(p * 4, p * 4 + 4);

      lote.forEach((carton, pos) => {
        const col = pos % 2;
        const row = Math.floor(pos / 2);
        const offsetX = col * 105;
        const offsetY = row * 148.5;
        renderCartonMini(doc, juntada, carton, offsetX, offsetY, 105, 148.5);
      });

      // Líneas de corte punteadas
      doc.setLineDashPattern([2, 2], 0);
      doc.setDrawColor(180, 180, 180);
      doc.line(105, 0, 105, 297);
      doc.line(0, 148.5, 210, 148.5);
      doc.setLineDashPattern([], 0);
    }
  }

  // Hoja del cantor (si está marcada)
  if (opciones.incluirHojaCantor) {
    doc.addPage();
    renderHojaCantor(doc, juntada, todosLosClasicos, qrDataUrl, pageWidth, pageHeight);
  }

  return doc.output('blob');
}

/**
 * Dibuja un cartón grande ocupando la hoja A4 completa (Wireframe 10)
 */
function renderCartonA4Completo(
  doc: jsPDF,
  juntada: Juntada,
  carton: Carton,
  qrDataUrl: string,
  width: number,
  height: number
) {
  const marginX = 16;
  let cursorY = 18;

  // Encabezado superior
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('CARTÓN LLENO, CORAZÓN CONTENTO', marginX, cursorY);

  const numStr = `CARTÓN N° ${String(carton.numero).padStart(2, '0')}`;
  doc.text(numStr, width - marginX, cursorY, { align: 'right' });

  cursorY += 12;

  // Título de la juntada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(10, 10, 10);
  doc.text(juntada.nombre, marginX, cursorY);

  cursorY += 7;

  // Fecha y premio
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const infoTxt = `${juntada.fecha} · Premio: ${juntada.premio || 'No lavar los platos'}`;
  doc.text(infoTxt, marginX, cursorY);

  cursorY += 10;

  // "Cartón de: [Nombre]" con línea subrayada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(10, 10, 10);
  doc.text(`Cartón de:  ${carton.jugadorNombre}`, marginX, cursorY);
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.line(marginX, cursorY + 2, width - marginX, cursorY + 2);

  cursorY += 8;

  // Grilla grande de casilleros
  const dim = getGridDimension(juntada.formato);
  const gridWidth = width - marginX * 2;
  const cellSize = gridWidth / dim;

  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 15, 15);

  carton.casilleros.forEach((cas, i) => {
    const r = Math.floor(i / dim);
    const c = i % dim;
    const x = marginX + c * cellSize;
    const y = cursorY + r * cellSize;

    // Cuadrado del casillero con esquinas suaves
    doc.roundedRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 2, 2, 'S');

    // Texto del clásico
    doc.setFont('helvetica', cas.esLibre ? 'bold' : 'normal');
    doc.setFontSize(dim === 5 ? 7.5 : dim === 4 ? 8.5 : 10);
    doc.setTextColor(10, 10, 10);

    const txt = cas.esLibre ? '¡LIBRE!' : cas.texto;
    const splitText = doc.splitTextToSize(txt, cellSize - 6);
    const textHeight = splitText.length * (dim === 5 ? 3.2 : 3.8);
    const textY = y + (cellSize / 2) - (textHeight / 2) + 3;

    doc.text(splitText, x + (cellSize / 2), textY, {
      align: 'center',
    });
  });

  cursorY += dim * cellSize + 6;

  // Instrucciones de tachado
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(
    'Tachá con birome cada cosa que pase. Línea completa: gritá ¡LÍNEA! · Todo el cartón: ¡CARTÓN LLENO!',
    marginX,
    cursorY
  );

  // Pie de página con QR
  const footerY = height - 26;
  doc.setDrawColor(200, 200, 200);
  doc.line(marginX, footerY - 5, width - marginX, footerY - 5);

  try {
    doc.addImage(qrDataUrl, 'PNG', marginX, footerY - 2, 18, 18);
  } catch {
    // fallback
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text('¿Tenés otra juntada? Armá tu bingo', marginX + 22, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('cartonlleno.app', marginX + 22, footerY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('HUMAN FRIENDLY', width - marginX, footerY + 8, { align: 'right' });
}

/**
 * Dibuja un cartón tamaño mini (para 4 por hoja A4)
 */
function renderCartonMini(
  doc: jsPDF,
  juntada: Juntada,
  carton: Carton,
  ox: number,
  oy: number,
  w: number,
  h: number
) {
  const pad = 8;
  let cy = oy + pad + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text(`CARTÓN N° ${String(carton.numero).padStart(2, '0')}`, ox + pad, cy);
  doc.text(juntada.nombre.slice(0, 22), ox + w - pad, cy, { align: 'right' });

  cy += 6;
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text(`Cartón de: ${carton.jugadorNombre.slice(0, 20)}`, ox + pad, cy);

  cy += 4;
  const dim = getGridDimension(juntada.formato);
  const gridW = w - pad * 2;
  const cellSize = gridW / dim;

  doc.setLineWidth(0.2);
  doc.setDrawColor(30, 30, 30);

  carton.casilleros.forEach((cas, i) => {
    const r = Math.floor(i / dim);
    const c = i % dim;
    const x = ox + pad + c * cellSize;
    const y = cy + r * cellSize;

    doc.rect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, 'S');

    doc.setFont('helvetica', cas.esLibre ? 'bold' : 'normal');
    doc.setFontSize(dim === 5 ? 4.5 : dim === 4 ? 5.5 : 7);
    doc.setTextColor(10, 10, 10);

    const txt = cas.esLibre ? 'LIBRE' : cas.texto;
    const splitText = doc.splitTextToSize(txt, cellSize - 2);
    const textHeight = splitText.length * 2.2;
    const textY = y + (cellSize / 2) - (textHeight / 2) + 1.8;

    doc.text(splitText, x + (cellSize / 2), textY, { align: 'center' });
  });

  cy += dim * cellSize + 5;
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('Tachá con birome · ¡LÍNEA! o ¡CARTÓN LLENO! · cartonlleno.app', ox + pad, cy);
}

/**
 * Hoja del cantor (lista de todos los clásicos con checkbox para el host)
 */
function renderHojaCantor(
  doc: jsPDF,
  juntada: Juntada,
  clasicos: Clasico[],
  qrDataUrl: string,
  width: number,
  height: number
) {
  const marginX = 18;
  let cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text('CARTÓN LLENO, CORAZÓN CONTENTO', marginX, cursorY);
  doc.text('HOJA DEL CANTOR', width - marginX, cursorY, { align: 'right' });

  cursorY += 12;
  doc.setFontSize(22);
  doc.setTextColor(10, 10, 10);
  doc.text(juntada.nombre, marginX, cursorY);

  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Lista de todos los clásicos de la juntada para ir tachando a medida que ocurren en la mesa.', marginX, cursorY);

  cursorY += 12;
  doc.setLineWidth(0.3);
  doc.setDrawColor(20, 20, 20);

  const colWidth = (width - marginX * 2 - 10) / 2;
  const mitad = Math.ceil(clasicos.length / 2);

  clasicos.forEach((clas, idx) => {
    const isCol2 = idx >= mitad;
    const localIdx = isCol2 ? idx - mitad : idx;
    const x = isCol2 ? marginX + colWidth + 10 : marginX;
    const y = cursorY + localIdx * 9.5;

    if (y < height - 30) {
      // Checkbox cuadrado
      doc.rect(x, y - 3.5, 4.5, 4.5, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(10, 10, 10);
      const text = `${idx + 1}. ${clas.texto}`;
      doc.text(text.slice(0, 38), x + 7, y);
    }
  });

  const footerY = height - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(marginX, footerY - 5, width - marginX, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('CARTÓN LLENO (by Human Friendly) · cartonlleno.app', marginX, footerY);
}
