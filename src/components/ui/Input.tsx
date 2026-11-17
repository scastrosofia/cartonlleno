import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-neutral-900 select-none lowercase"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[50px] px-4 py-2.5 text-[15px] bg-white text-neutral-900 border-[1.5px] rounded-2xl outline-none placeholder:text-neutral-400 transition-colors ${
          error
            ? 'border-red-500 focus:border-red-600'
            : 'border-neutral-200 focus:border-neutral-900'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      {helperText && !error && (
        <span className="text-xs text-neutral-500">{helperText}</span>
      )}
    </div>
  );
}
