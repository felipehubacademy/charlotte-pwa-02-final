'use client';

import { useEffect, useState } from 'react';

interface SimpleXPCounterProps {
  totalXP: number;
  sessionXP?: number;
  size?: number;
  className?: string;
}

export default function SimpleXPCounter({ 
  totalXP, 
  sessionXP = 0, 
  size = 40,
  className = ''
}: SimpleXPCounterProps) {
  const [progress, setProgress] = useState(0);

  // Calcular nível atual e progresso
  const calculateLevelAndProgress = (xp: number) => {
    const currentLevel = Math.floor(Math.sqrt(xp / 50)) + 1;
    const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 50;
    const xpForNextLevel = Math.pow(currentLevel, 2) * 50;
    const progressInLevel = xp - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = (progressInLevel / xpNeededForNextLevel) * 100;
    
    return {
      currentLevel,
      progressPercentage: Math.min(progressPercentage, 100)
    };
  };

  const { currentLevel, progressPercentage } = calculateLevelAndProgress(totalXP);

  // Animação do progresso
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(progressPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Círculo de fundo (cinza) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-30"
        />
        
        {/* Círculo de progresso (verde florescente da app) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#A3FF3C"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
          style={{
            strokeLinecap: 'round'
          }}
        />
      </svg>
      
      {/* Número do nível centralizado */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">
          {currentLevel}
        </span>
      </div>
    </div>
  );
} 