import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

export function Chip({ active, children, className = '', ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] text-sm font-medium rounded-full border-[1.5px] transition-all select-none active:scale-95 ${
        active
          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
          : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
