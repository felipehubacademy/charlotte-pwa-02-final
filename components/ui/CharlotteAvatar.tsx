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

const CharlotteAvatar: React.FC<CharlotteAvatarProps> = ({
  size = 'md',
  showStatus = false,
  isOnline = false,
  className = '',
  animate = false,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
      <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary-dark/20 shadow-lg border-2 border-white/20">
        {/* Sempre mostrar a imagem, fallback apenas se houver erro */}
        <Image
          src="/images/charlotte-avatar.png"
          alt="Charlotte Avatar"
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setImageLoaded(true);
            console.log('✅ Charlotte avatar loaded successfully');
          }}
          onError={() => {
            setImageError(true);
            console.error('❌ Failed to load Charlotte avatar');
          }}
          priority={size === 'lg' || size === 'xl' || size === 'xxl'}
        />
        
        {/* Fallback apenas se a imagem falhar completamente */}
        {imageError && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
            <span 
              className="text-black font-bold"
              style={{ fontSize: `${pixelSizes[size] * 0.4}px` }}
            >
              C
            </span>
          </div>
        )}
        
        {/* Loading state */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary-dark/30">
            <div className="animate-spin rounded-full h-1/2 w-1/2 border-2 border-primary border-t-transparent"></div>
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
};

export default CharlotteAvatar; 