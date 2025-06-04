'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface RealtimeOrbProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevels?: number[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  size?: 'normal' | 'compact';
}

const RealtimeOrb: React.FC<RealtimeOrbProps> = ({
  isConnected,
  isListening,
  isSpeaking,
  audioLevels = [],
  connectionStatus,
  size = 'normal'
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const frameRef = useRef<number>();

  const sizeConfig = {
    normal: {
      container: 'w-80 h-80',
      orb: 'w-64 h-64',
      baseRadius: 45,
      waveSpacing: 8,
      maxRadius: 95
    },
    compact: {
      container: 'w-48 h-48',
      orb: 'w-40 h-40',
      baseRadius: 28,
      waveSpacing: 5,
      maxRadius: 60
    }
  };

  const config = sizeConfig[size];

  // Animação contínua de fase
  useEffect(() => {
    const animate = () => {
      setAnimationPhase(prev => (prev + 1) % 360);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Cores baseadas no estado
  const getColors = () => {
    if (!isConnected) {
      return {
        primary: '#FBB928', // Amarelo - conectando
        secondary: '#F59E0B',
        accent: '#D97706',
        glow: 'rgba(251, 185, 40, 0.6)'
      };
    }
    
    if (isSpeaking) {
      return {
        primary: '#A3FF3C', // Verde Charlotte - falando
        secondary: '#8FE61A',
        accent: '#65A30D',
        glow: 'rgba(163, 255, 60, 0.8)'
      };
    }
    
    if (isListening) {
      return {
        primary: '#3B82F6', // Azul - ouvindo
        secondary: '#2563EB',
        accent: '#1D4ED8',
        glow: 'rgba(59, 130, 246, 0.7)'
      };
    }
    
    return {
      primary: '#FFFFFF', // Branco - idle
      secondary: '#F3F4F6',
      accent: '#E5E7EB',
      glow: 'rgba(255, 255, 255, 0.4)'
    };
  };

  const colors = getColors();
  const isActive = isConnected && (isListening || isSpeaking);

  // Calcular intensidade do áudio
  const audioIntensity = audioLevels.length > 0 
    ? audioLevels.reduce((sum, level) => sum + level, 0) / audioLevels.length
    : (isActive ? 0.5 : 0.1);

  // Gerar dados de onda baseados no áudio
  const generateWaveData = (waveIndex: number) => {
    const points = [];
    const segments = 60;
    const baseRadius = config.baseRadius + (waveIndex * config.waveSpacing);
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const time = animationPhase * 0.02;
      
      // Múltiplas ondas senoidais para complexidade
      const wave1 = Math.sin(angle * 3 + time * 2) * 3;
      const wave2 = Math.sin(angle * 5 + time * 1.5) * 2;
      const wave3 = Math.sin(angle * 7 + time * 3) * 1;
      
      // Intensidade baseada no áudio
      const audioWave = audioLevels[i % audioLevels.length] || audioIntensity;
      const audioEffect = audioWave * (isSpeaking ? 8 : isListening ? 4 : 1);
      
      const radius = baseRadius + wave1 + wave2 + wave3 + audioEffect;
      const x = 100 + Math.cos(angle) * radius;
      const y = 100 + Math.sin(angle) * radius;
      
      points.push(`${x},${y}`);
    }
    
    return `M ${points.join(' L ')} Z`;
  };

  return (
    <motion.div 
      className={`relative ${config.container} flex items-center justify-center`}
      animate={{
        scale: size === 'compact' ? 0.6 : 1
      }}
      transition={{
        duration: 0.5,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className={`relative ${config.orb}`}
        animate={isActive ? {
          scale: [1, 1.02 + audioIntensity * 0.05, 1],
        } : {
          scale: 1
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {/* Gradiente principal dinâmico */}
            <radialGradient id="mainGradient" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
              <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.7" />
              <stop offset="100%" stopColor={colors.accent} stopOpacity="0.3" />
            </radialGradient>

            {/* Gradiente de glow */}
            <radialGradient id="glowGradient" cx="50%" cy="50%" r="90%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="70%" stopColor={colors.glow.replace(')', ', 0.3)')} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Filtro de blur para glow */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Halo externo pulsante */}
          <motion.circle
            cx="100"
            cy="100"
            r={config.maxRadius}
            fill="url(#glowGradient)"
            animate={isActive ? {
              r: [config.maxRadius - 5, config.maxRadius + audioIntensity * 10, config.maxRadius - 5],
              opacity: [0.3, 0.6 + audioIntensity * 0.3, 0.3],
            } : {
              r: config.maxRadius - 10,
              opacity: 0.2
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Ondas senoidais internas */}
          {Array.from({ length: 4 }).map((_, waveIndex) => (
            <motion.path
              key={`wave-${waveIndex}`}
              d={generateWaveData(waveIndex)}
              fill="none"
              stroke={colors.primary}
              strokeWidth={1.5 - waveIndex * 0.2}
              opacity={0.4 + waveIndex * 0.1}
              filter="url(#glow)"
              animate={isActive ? {
                opacity: [0.3, 0.7 + audioIntensity * 0.3, 0.3],
                strokeWidth: [1.5 - waveIndex * 0.2, 2 - waveIndex * 0.2, 1.5 - waveIndex * 0.2],
              } : {
                opacity: 0.2,
                strokeWidth: 1 - waveIndex * 0.1
              }}
              transition={{
                duration: 2 + waveIndex * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: waveIndex * 0.2
              }}
            />
          ))}

          {/* Orb principal */}
          <motion.circle
            cx="100"
            cy="100"
            r={config.baseRadius + 5}
            fill="url(#mainGradient)"
            filter="url(#glow)"
            animate={isActive ? {
              r: [config.baseRadius + 3, config.baseRadius + 5 + audioIntensity * 3, config.baseRadius + 3],
            } : {
              r: config.baseRadius
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Núcleo central brilhante */}
          <motion.circle
            cx="100"
            cy="100"
            r={config.baseRadius * 0.33}
            fill={colors.primary}
            opacity="0.9"
            animate={isActive ? {
              r: [config.baseRadius * 0.27, config.baseRadius * 0.33 + audioIntensity * 2, config.baseRadius * 0.27],
              opacity: [0.7, 0.9 + audioIntensity * 0.1, 0.7],
            } : {
              r: config.baseRadius * 0.22,
              opacity: 0.6
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Partículas flutuantes */}
          {Array.from({ length: 12 }).map((_, particleIndex) => {
            const angle = (particleIndex / 12) * 360;
            const radius = (config.baseRadius + 20) + Math.sin(animationPhase * 0.03 + particleIndex) * 10;
            const x = 100 + Math.cos(angle * Math.PI / 180) * radius;
            const y = 100 + Math.sin(angle * Math.PI / 180) * radius;
            
            return (
              <motion.circle
                key={`particle-${particleIndex}`}
                cx={x}
                cy={y}
                r="1.5"
                fill={colors.primary}
                opacity="0.6"
                animate={isActive ? {
                  r: [1, 2 + audioIntensity, 1],
                  opacity: [0.4, 0.8, 0.4],
                } : {
                  r: 0.8,
                  opacity: 0.3
                }}
                transition={{
                  duration: 2 + particleIndex * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: particleIndex * 0.1
                }}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Glow externo adicional */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={isActive ? {
          scale: [1, 1.1 + audioIntensity * 0.2, 1],
          opacity: [0.3, 0.6 + audioIntensity * 0.4, 0.3],
        } : {
          scale: 0.8,
          opacity: 0.1
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default RealtimeOrb; 