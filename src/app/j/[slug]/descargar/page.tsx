'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Download, Share2, Printer, Check } from 'lucide-react';
import {
  getJuntadaBySlug,
  subscribeToJuntada,
  subscribeToJugadores,
  subscribeToClasicos,
  subscribeToAllCartones,
} from '@/lib/firebase/service';
import { generarPdfCartones, OpcionesPdf } from '@/lib/pdf/generadorPdf';
import { Juntada, Jugador, Clasico, Carton } from '@/types';

function DescargarCartonesContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [juntada, setJuntada] = useState<Juntada | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [clasicos, setClasicos] = useState<Clasico[]>([]);
  const [cartones, setCartones] = useState<Carton[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [descargado, setDescargado] = useState(false);

  // Opciones de impresión
  const [modoImpresion, setModoImpresion] = useState<'1_por_hoja' | '4_por_hoja'>('1_por_hoja');
  const [incluirHojaCantor, setIncluirHojaCantor] = useState(true);
  const [sumarExtras, setSumarExtras] = useState(true);

  useEffect(() => {
    async function init() {
      if (!slug) return;
      const found = await getJuntadaBySlug(slug);
      setJuntada(found);
      setLoading(false);
    }
    init();
  }, [slug]);

  useEffect(() => {
    if (!juntada?.id) return;
    const unsubJ = subscribeToJuntada(juntada.id, (data) => {
      if (data) setJuntada(data);
    });
    const unsubJug = subscribeToJugadores(juntada.id, (list) => {
      setJugadores(list);
    });
    const unsubClas = subscribeToClasicos(juntada.id, (list) => {
      setClasicos(list);
    });
    const unsubCart = subscribeToAllCartones(juntada.id, (list) => {
      setCartones(list);
    });

    return () => {
      unsubJ();
      unsubJug();
      unsubClas();
      unsubCart();
    };
  }, [juntada?.id]);

  const totalCartones = (cartones.length || jugadores.length || 6) + (sumarExtras ? 2 : 0);

  const handleDescargarPdf = async () => {
    if (!juntada || generando) return;
    setGenerando(true);
    try {
      const opciones: OpcionesPdf = {
        modoImpresion,
        incluirHojaCantor,
        sumarExtras,
      };

      const blob = await generarPdfCartones(juntada, cartones, clasicos, opciones);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cartones-${juntada.slug}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setDescargado(true);
      setTimeout(() => setDescargado(false), 2500);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setGenerando(false);
    }
  };

  const handleCompartirWhatsApp = async () => {
    if (!juntada) return;
    const msg = `¡Acá están los cartones para imprimir del bingo de ${juntada.nombre}! 🖨️📄\nDescargalos directamente acá: ${window.location.href}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  if (loading || !juntada) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-neutral-700">Cargando cartones...</p>
        </div>
      </MobileContainer>
    );
  }

  // Lista de nombres para las miniaturas
  const nombresMiniaturas = cartones.length > 0
    ? cartones.map((c) => c.jugadorNombre)
    : jugadores.length > 0
    ? jugadores.map((j) => j.nombre)
    : ['Tía Marta', 'Tío Rubén', 'Lucía', 'Pato', 'Abuela Nelly', 'Extra'];

  if (sumarExtras && !nombresMiniaturas.includes('Extra')) {
    nombresMiniaturas.push('Extra 1', 'Extra 2');
  }

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 pb-4">
        {/* Header con botón volver */}
        <header className="flex items-center min-h-[44px] mb-3">
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="p-1 -ml-1 text-neutral-900 hover:text-black flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg active:bg-neutral-100"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <h1 className="text-lg font-bold text-neutral-900 tracking-tight ml-2">
            Cartones para imprimir
          </h1>
        </header>

        {/* Badge y subtítulo */}
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Modo tradicional
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            {jugadores.length || cartones.length || 6} jugadores · {juntada.formato}
          </span>
        </div>

        {/* Título de la pantalla */}
        <h2 className="text-xl font-extrabold text-neutral-950 tracking-tight leading-tight mb-4">
          Sin celus en la mesa: cada uno con su cartón y una birome
        </h2>

        {/* Miniaturas de los cartones */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 max-h-[190px] overflow-y-auto pr-0.5">
          {nombresMiniaturas.slice(0, 9).map((nombre, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-full aspect-[4/3] rounded-xl border-[1.5px] border-neutral-300 bg-white p-1 flex items-center justify-center shadow-2xs">
                {/* Mini grilla ilustrativa */}
                <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5 opacity-60">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="border border-neutral-400 rounded-2xs" />
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-bold text-neutral-800 mt-1 truncate max-w-full text-center">
                {nombre}
              </span>
            </div>
          ))}
        </div>

        {/* ¿Cómo los imprimís? */}
        <div className="mb-4">
          <label className="text-xs font-bold text-neutral-900 block mb-2">
            ¿Cómo los imprimís?
          </label>
          <div className="flex flex-col gap-2">
            {/* Opción 1 por hoja */}
            <button
              type="button"
              onClick={() => setModoImpresion('1_por_hoja')}
              className={`p-3 rounded-xl border-[1.5px] text-left flex items-start gap-3 transition-all ${
                modoImpresion === '1_por_hoja'
                  ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="mt-0.5 w-4 h-4 rounded-full border-[1.5px] border-neutral-900 flex items-center justify-center shrink-0">
                {modoImpresion === '1_por_hoja' && (
                  <div className="w-2 h-2 rounded-full bg-neutral-900" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 block">
                  1 cartón por hoja
                </span>
                <span className="text-[11px] text-neutral-500">
                  A4, para que se lea desde lejos
                </span>
              </div>
            </button>

            {/* Opción 4 por hoja */}
            <button
              type="button"
              onClick={() => setModoImpresion('4_por_hoja')}
              className={`p-3 rounded-xl border-[1.5px] text-left flex items-start gap-3 transition-all ${
                modoImpresion === '4_por_hoja'
                  ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="mt-0.5 w-4 h-4 rounded-full border-[1.5px] border-neutral-900 flex items-center justify-center shrink-0">
                {modoImpresion === '4_por_hoja' && (
                  <div className="w-2 h-2 rounded-full bg-neutral-900" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 block">
                  4 cartones por hoja
                </span>
                <span className="text-[11px] text-neutral-500">
                  Ahorrás papel (con líneas de corte)
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Checkboxes de opciones adicionales */}
        <div className="flex flex-col gap-2.5 mb-6">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={incluirHojaCantor}
              onChange={(e) => setIncluirHojaCantor(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-neutral-900"
            />
            <span className="text-xs text-neutral-800 leading-tight">
              Incluir hoja del cantor (todos los clásicos para ir tachando)
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sumarExtras}
              onChange={(e) => setSumarExtras(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-neutral-900"
            />
            <span className="text-xs text-neutral-800 leading-tight">
              Sumar 2 cartones extra para los que caen sin avisar
            </span>
          </label>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-2.5 mt-auto pt-2">
          <Button
            size="lg"
            fullWidth
            onClick={handleDescargarPdf}
            disabled={generando}
          >
            {descargado ? (
              <>
                <Check className="w-4 h-4 mr-2 text-white stroke-[2.5]" />
                ¡PDF descargado!
              </>
            ) : generando ? (
              'Generando PDF...'
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF · {totalCartones} cartones
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            fullWidth
            onClick={handleCompartirWhatsApp}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Mandar el PDF por WhatsApp
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function DescargarCartonesPage() {
  return (
    <Suspense
      fallback={
        <MobileContainer>
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-neutral-700">Preparando cartones...</p>
          </div>
        </MobileContainer>
      }
    >
      <DescargarCartonesContent />
    </Suspense>
  );
}
