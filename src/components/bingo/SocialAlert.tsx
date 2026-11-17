import React from 'react';
import { Bell } from 'lucide-react';

interface SocialAlertProps {
  mensaje: string;
  botonTexto?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export function SocialAlert({
  mensaje,
  botonTexto = 'marcar',
  onAction,
}: SocialAlertProps) {
  return (
    <aside
      aria-label="Alerta de la mesa"
      className="w-full bg-neutral-100/90 border border-neutral-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs mb-3"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Bell className="w-4 h-4 text-neutral-800 shrink-0" />
        <p className="text-xs font-semibold text-neutral-900 truncate lowercase">
          {mensaje}
        </p>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 bg-[#E52320] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl active:scale-95 transition-transform lowercase hover:bg-[#CC1E1B]"
        >
          {botonTexto}
        </button>
      )}
    </aside>
  );
}
