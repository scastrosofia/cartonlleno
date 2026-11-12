import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileContainer({ children, className = '' }: MobileContainerProps) {
  return (
    <div className="min-h-screen w-full bg-neutral-100 flex justify-center py-0 sm:py-6">
      <main className={`w-full max-w-[420px] min-h-screen sm:min-h-[844px] bg-white sm:rounded-3xl sm:shadow-lg sm:border sm:border-neutral-200 px-5 py-6 flex flex-col justify-between overflow-x-hidden ${className}`}>
        {children}
      </main>
    </div>
  );
}
