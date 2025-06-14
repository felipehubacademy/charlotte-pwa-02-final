'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface CharlotteAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  showStatus?: boolean;
  isOnline?: boolean;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

const CharlotteAvatar: React.FC<CharlotteAvatarProps> = React.memo(({
  size = 'md',
  showStatus = false,
  isOnline = false,
  className = '',
  animate = false,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);

  // Definir tamanhos
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    xxl: 'w-24 h-24'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    xxl: 'w-5 h-5'
  };

  const statusPositions = {
    xs: '-bottom-0.5 -right-0.5',
    sm: '-bottom-0.5 -right-0.5',
    md: '-bottom-0.5 -right-0.5',
    lg: '-bottom-1 -right-1',
    xl: '-bottom-1 -right-1',
    xxl: '-bottom-1.5 -right-1.5'
  };

  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 96
  };

  const AvatarContent = () => (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      {/* Container do Avatar */}
      <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary-dark/10 shadow-lg border-2 border-white/20">
        {/* SEMPRE mostrar a imagem - fallback apenas se erro */}
        {!imageError ? (
          <Image
            src="/images/charlotte-avatar.png"
            alt="Charlotte Avatar"
            width={pixelSizes[size]}
            height={pixelSizes[size]}
            className="w-full h-full object-cover"
            onError={() => {
              console.error('❌ Charlotte avatar failed to load');
              setImageError(true);
            }}
            onLoad={() => {
              // Reduzir logs desnecessários - só logar se houve erro antes
              if (imageError) {
                console.log('✅ Charlotte avatar recovered after error');
              }
            }}
            priority={true}
            unoptimized={true}
          />
        ) : (
          /* Fallback apenas se a imagem falhar */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
            <span 
              className="text-black font-bold"
              style={{ fontSize: `${pixelSizes[size] * 0.4}px` }}
            >
              C
            </span>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className={`absolute ${statusPositions[size]} ${statusSizes[size]} rounded-full border-2 border-white ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={onClick ? 'cursor-pointer' : ''}
        onClick={onClick}
      >
        <AvatarContent />
      </motion.div>
    );
  }

  return (
    <div 
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <AvatarContent />
    </div>
  );
});

CharlotteAvatar.displayName = 'CharlotteAvatar';

export default CharlotteAvatar; 