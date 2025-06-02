'use client';

import { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  children?: ReactNode;
  className?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Header({ 
  title = "Charlotte", 
  children, 
  className = "",
  showBackButton = false,
  onBackClick 
}: HeaderProps) {
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-white/10 ${className}`}
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left side - Back button or empty space */}
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Voltar"
            >
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-semibold text-white truncate">
            {title}
          </h1>
        </div>

        {/* Right side - Custom content or empty space */}
        <div className="flex items-center">
          {children}
        </div>
      </div>
    </header>
  );
} 