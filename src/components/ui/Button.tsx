import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'subtle';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  let baseStyle = 'inline-flex items-center justify-center font-bold transition-all duration-150 rounded-xl select-none active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ';
  
  const sizeStyle = size === 'lg' ? 'min-h-[52px] text-base px-6' : 'min-h-[48px] text-[15px] px-5';
  const widthStyle = fullWidth ? 'w-full' : '';

  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-neutral-900 text-white hover:bg-black active:bg-neutral-800';
      break;
    case 'outline':
      variantStyle = 'bg-white text-neutral-900 border-[1.5px] border-neutral-900 hover:bg-neutral-50 active:bg-neutral-100';
      break;
    case 'subtle':
      variantStyle = 'bg-neutral-100 text-neutral-900 border-[1.5px] border-neutral-200 hover:bg-neutral-200';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent text-neutral-900 hover:bg-neutral-100 underline';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${sizeStyle} ${widthStyle} ${variantStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
