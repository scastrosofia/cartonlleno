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
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base font-extrabold text-neutral-950">
                Agregar jugador sin celu
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1 text-neutral-500 hover:text-black rounded-lg active:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nombre */}
            <div>
              <label className="text-xs font-bold text-neutral-900 block mb-1">
                Nombre o apodo
              </label>
              <Input
                placeholder="Ej: La Abuela Nelly"
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
              <label className="text-xs font-bold text-neutral-900 block mb-2">
                ¿Cómo juega?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('impreso')}
                  className={`p-3 rounded-xl border-[1.5px] text-left flex flex-col justify-between min-h-[76px] transition-all ${
                    tipo === 'impreso'
                      ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <Printer className="w-4 h-4 text-neutral-800 mb-1" />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block leading-tight">
                      Con cartón impreso
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Se suma al PDF A4
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('apadrinado')}
                  className={`p-3 rounded-xl border-[1.5px] text-left flex flex-col justify-between min-h-[76px] transition-all ${
                    tipo === 'apadrinado'
                      ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-neutral-800 mb-1" />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block leading-tight">
                      Con el celu de alguien
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Lleva 2 cartones
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Selector de padrino (si eligió apadrinado) */}
            {tipo === 'apadrinado' && (
              <div className="p-3 rounded-xl border-[1.5px] border-neutral-200 bg-neutral-50">
                <label className="text-xs font-bold text-neutral-900 block mb-1.5">
                  ¿Quién lo lleva en su celu?
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Chip
                    active={padrinoUid === null}
                    onClick={() => setPadrinoUid(null)}
                    className="text-xs py-1"
                  >
                    Que lo adopte cualquiera
                  </Chip>
                  {posiblesPadrinos.map((padrino) => (
                    <Chip
                      key={padrino.id}
                      active={padrinoUid === padrino.uid}
                      onClick={() => setPadrinoUid(padrino.uid)}
                      className="text-xs py-1"
                    >
                      {padrino.nombre}
                    </Chip>
                  ))}
                </div>
                <span className="text-[10px] text-neutral-500 block">
                  Máximo 3 cartones por dispositivo.
                </span>
              </div>
            )}

            <Button size="md" fullWidth type="submit" disabled={guardando || !nombre.trim()}>
              {guardando ? 'Guardando...' : 'Sumar a la mesa'}
            </Button>
          </form>

          {/* Lista de ya agregados sin celu */}
          {jugadoresSinCelu.length > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-200">
              <span className="text-xs font-bold text-neutral-900 block mb-2">
                Jugadores agregados sin celu ({jugadoresSinCelu.length}):
              </span>
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                {jugadoresSinCelu.map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">{item.nombre}</span>
                      <span className="text-[10px] text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                        {item.tipo === 'impreso' ? 'Impreso' : 'Apadrinado'}
                      </span>
                    </div>
                    {onRemoveJugador && (
                      <button
                        type="button"
                        onClick={() => onRemoveJugador(item.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
}
