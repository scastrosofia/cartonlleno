import React, { useState } from 'react';
import { X, UserPlus, Trash2, Printer, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Jugador, TipoJugador } from '@/types';

interface AgregarJugadorSinCeluModalProps {
  isOpen: boolean;
  onClose: () => void;
  jugadoresExistentes: Jugador[];
  onAddJugador: (nombre: string, tipo: TipoJugador, padrinoUid?: string | null) => Promise<void>;
  onRemoveJugador?: (jugadorId: string) => Promise<void>;
}

export function AgregarJugadorSinCeluModal({
  isOpen,
  onClose,
  jugadoresExistentes,
  onAddJugador,
  onRemoveJugador,
}: AgregarJugadorSinCeluModalProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'impreso' | 'apadrinado'>('impreso');
  const [padrinoUid, setPadrinoUid] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Jugadores que tienen celu y pueden apadrinar
  const posiblesPadrinos = jugadoresExistentes.filter((j) => j.tipo === 'celu' && j.uid);

  // Jugadores que ya fueron agregados sin celu (impreso o apadrinado)
  const jugadoresSinCelu = jugadoresExistentes.filter(
    (j) => j.tipo === 'impreso' || j.tipo === 'apadrinado'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setError('Escribí el nombre del jugador');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      await onAddJugador(cleanNombre, tipo, tipo === 'apadrinado' ? padrinoUid : null);
      setNombre('');
      setPadrinoUid(null);
    } catch (err: any) {
      setError(err?.message || 'Error al agregar jugador');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto flex flex-col justify-between shadow-2xl border-[1.5px] border-neutral-300">
        <div>
          {/* Header del modal */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
            <h2 className="text-base font-extrabold text-neutral-950 lowercase">
              agregar jugador sin celu
            </h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1.5 text-neutral-500 hover:text-black rounded-full active:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Apodo */}
            <div>
              <label className="text-xs font-bold text-neutral-900 block mb-1.5 lowercase">
                apodo
              </label>
              <Input
                placeholder="abu rosa"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (error) setError('');
                }}
                error={error}
                autoFocus
              />
            </div>

            {/* ¿Cómo juega? */}
            <div>
              <label className="text-xs font-bold text-neutral-900 block mb-2 lowercase">
                ¿cómo juega?
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('impreso')}
                  className={`p-3.5 rounded-2xl border-[1.5px] text-left flex items-center gap-3 transition-all ${
                    tipo === 'impreso'
                      ? 'border-neutral-950 bg-neutral-50/50 ring-1 ring-neutral-950'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                    tipo === 'impreso' ? 'border-[#E52320]' : 'border-neutral-400'
                  }`}>
                    {tipo === 'impreso' && (
                      <div className="w-2 h-2 rounded-full bg-[#E52320]" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-neutral-900 lowercase">
                    con cartón impreso
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('apadrinado')}
                  className={`p-3.5 rounded-2xl border-[1.5px] text-left flex items-center gap-3 transition-all ${
                    tipo === 'apadrinado'
                      ? 'border-neutral-950 bg-neutral-50/50 ring-1 ring-neutral-950'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                    tipo === 'apadrinado' ? 'border-[#E52320]' : 'border-neutral-400'
                  }`}>
                    {tipo === 'apadrinado' && (
                      <div className="w-2 h-2 rounded-full bg-[#E52320]" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-neutral-900 lowercase">
                    con el celu de alguien de la mesa
                  </span>
                </button>
              </div>
            </div>

            {/* Selector de quién lo lleva */}
            {tipo === 'apadrinado' && (
              <div className="p-4 rounded-2xl border-[1.5px] border-neutral-200 bg-neutral-50">
                <label className="text-xs font-bold text-neutral-900 block mb-2 lowercase">
                  ¿quién lo lleva?
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {posiblesPadrinos.length > 0 ? (
                    posiblesPadrinos.map((padrino) => {
                      const isActive = padrinoUid === padrino.uid;
                      return (
                        <button
                          key={padrino.id}
                          type="button"
                          onClick={() => setPadrinoUid(padrino.uid)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-full border-[1.5px] transition-all lowercase ${
                            isActive
                              ? 'bg-[#E52320] text-white border-[#E52320]'
                              : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400'
                          }`}
                        >
                          {padrino.nombre}
                        </button>
                      );
                    })
                  ) : (
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#E52320] text-white border-[1.5px] border-[#E52320]"
                    >
                      organizador
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 block lowercase">
                  hasta 3 cartones por celu
                </span>
              </div>
            )}

            <Button size="md" fullWidth type="submit" disabled={guardando || !nombre.trim()}>
              {guardando ? 'agregando...' : 'agregar'}
            </Button>
          </form>

          {/* Ya agregados */}
          {jugadoresSinCelu.length > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-200">
              <span className="text-xs font-bold text-neutral-900 block mb-2 lowercase">
                ya agregados:
              </span>
              <div className="flex flex-wrap gap-2">
                {jugadoresSinCelu.map((item) => (
                  <div
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-50 text-xs text-neutral-800 font-medium"
                  >
                    <span>{item.nombre}</span>
                    {onRemoveJugador && (
                      <button
                        type="button"
                        onClick={() => onRemoveJugador(item.id)}
                        className="p-0.5 text-neutral-400 hover:text-red-600 rounded-full"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-2">
          <Button variant="ghost" fullWidth onClick={onClose}>
            cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
