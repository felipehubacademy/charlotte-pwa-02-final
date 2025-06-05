'use client';

import React, { useEffect, useState } from 'react';

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
  // 🎯 NOVO: Mapear estados para o novo sistema - SIMPLIFICADO
  const getVoiceState = () => {
    if (connectionStatus === 'connecting' || !isConnected) {
      return 'connecting';
    }
    // 🎵 NOVO: Sempre verde quando conectado, independente de quem está falando
    return 'speaking'; // Sempre verde quando conectado
  };

  const state = getVoiceState();
  
  // 🎯 NOVO: Calcular intensidade baseada nos audioLevels existentes
  const baseIntensity = audioLevels.length > 0 
    ? audioLevels.reduce((sum, level) => sum + level, 0) / audioLevels.length
    : (isConnected && (isListening || isSpeaking) ? 0.5 : 0.3);

  // 🔧 NOVO: Detectar se há áudio ativo (usuário ou Charlotte)
  const hasUserAudio = audioLevels.length > 0 && audioLevels.some(level => level > 0.1);
  const isActiveAudio = isSpeaking || hasUserAudio;

  const [waveIntensity, setWaveIntensity] = useState(0.3);

  // 🎵 NOVO: Animação contínua para todos os estados
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state === 'connecting') {
      interval = setInterval(() => {
        setWaveIntensity(0.3 + Math.random() * 0.4); // 🔧 Reduzido para ser mais sutil
      }, 400); // 🔧 Mais lento
    } else if (isSpeaking) {
      // 🎵 MELHORADO: Simulação mais sutil para Charlotte falando
      interval = setInterval(() => {
        const time = Date.now() * 0.0005; // 🔧 Muito mais lento
        // Simular respiração suave
        const breathPattern = Math.sin(time * 1.5) * 0.15 + Math.sin(time * 3) * 0.1;
        const subtleVariation = (Math.random() - 0.5) * 0.1; // 🔧 Muito mais sutil
        const organicIntensity = 0.4 + breathPattern + subtleVariation;
        setWaveIntensity(Math.max(0.2, Math.min(organicIntensity, 0.7))); // 🔧 Range menor
      }, 150); // 🔧 Mais lento
    } else if (isListening) {
      // 🎵 MELHORADO: Usar áudio real do usuário quando está ouvindo
      interval = setInterval(() => {
        // 🔧 MELHORADO: Detecção mais sensível de áudio do usuário
        const hasAudio = audioLevels.length > 0 && audioLevels.some(level => level > 0.02); // 🔧 Mais sensível
        const avgLevel = hasAudio ? baseIntensity : 0;
        
        const userIntensity = hasAudio 
          ? Math.min(avgLevel * 2.0 + 0.3, 1.0) // 🔧 Mais responsivo ao áudio do usuário
          : 0.15 + Math.sin(Date.now() * 0.001) * 0.05; // 🔧 Respiração muito sutil quando sem áudio
        setWaveIntensity(userIntensity);
      }, 50); // 🔧 Mais responsivo
    } else {
      // Estado idle - respiração muito sutil
      setWaveIntensity(0.15 + Math.sin(Date.now() * 0.0008) * 0.03);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, isSpeaking, isListening, baseIntensity, audioLevels]);

  // 🎨 NOVO: Esquemas de cores simplificados - apenas laranja (conectando) e verde (ativo)
  const colorSchemes = {
    connecting: {
      background: "#2e1a0a",
      wave: "#ff8c3a", // Laranja - conectando
      shadow: "rgba(255, 140, 58, 0.3)",
      // 🔧 NOVO: Cores mais intensas para partículas
      particleColor: "#ffaa5a", // Laranja mais vibrante
      particleShadow: "rgba(255, 170, 90, 0.6)",
    },
    speaking: {
      background: "#212121", 
      wave: "#a3ff3c", // Verde Charlotte - SEMPRE verde quando conectado
      shadow: "rgba(163, 255, 60, 0.3)",
      // 🔧 NOVO: Cores mais intensas para partículas
      particleColor: "#b8ff4a", // Verde mais vibrante e brilhante
      particleShadow: "rgba(184, 255, 74, 0.7)",
    }
  };

  const colors = colorSchemes[state as keyof typeof colorSchemes];

  // 📏 NOVO: Configurações de tamanho responsivas
  const sizeConfig = {
    normal: {
      container: 'w-36 h-36 md:w-36 md:h-36',
      orbSize: 144
    },
    compact: {
      container: 'w-16 h-16 md:w-20 md:h-20',
      orbSize: 64
    }
  };

  const config = sizeConfig[size];

  return (
    <div id="realtime-orb" className={`relative ${config.container}`}>
      <div className="relative w-full h-full">
        {/* Main orb */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-500 ease-in-out"
          style={{
            backgroundColor: colors.background,
            boxShadow: `0 0 30px ${colors.shadow}, 0 0 60px ${colors.shadow}, inset 0 0 20px rgba(255, 255, 255, 0.1)`,
          }}
        />

        {/* 🎵 MELHORADO: Sombra externa mais responsiva ao áudio */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-150 ease-out"
          style={{
            background: `radial-gradient(circle, transparent 50%, ${colors.wave}18 60%, transparent 80%)`,
            // 🔧 CORRIGIDO: Resposta direta ao áudio real, sem delay
            ...(isActiveAudio ? {
              animation: `orbPulse 2s ease-in-out infinite`,
              opacity: 0.4 + (baseIntensity * 0.4), // 🔧 Resposta direta ao áudio real
              transform: `scale(${1.1 + baseIntensity * 0.3})`, // 🔧 Escala responsiva ao áudio real
            } : {
              transform: `scale(1.1)`,
              opacity: 0.3,
            }),
            filter: `blur(${8 + baseIntensity * 8}px)`, // 🔧 Blur responsivo ao áudio real
            boxShadow: `0 0 ${40 + baseIntensity * 40}px ${colors.shadow}`, // 🔧 Sombra responsiva ao áudio real
          }}
        />

        {/* 🎵 MELHORADO: Anel de pulso médio mais sutil */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-200 ease-out"
          style={{
            background: `radial-gradient(circle, transparent 70%, ${colors.wave}25 80%, transparent 90%)`,
            // 🔧 CORRIGIDO: Resposta direta ao áudio real, sem delay
            ...(isActiveAudio ? {
              animation: `orbPulse 2s ease-in-out infinite 0.3s`,
              opacity: 0.5 + (baseIntensity * 0.3), // 🔧 Resposta direta ao áudio real
              transform: `scale(${1.05 + baseIntensity * 0.2})`, // 🔧 Escala responsiva ao áudio real
            } : {
              transform: `scale(1.05)`,
              opacity: 0.4,
            }),
            filter: `blur(${4 + baseIntensity * 4}px)`, // 🔧 Blur responsivo ao áudio real
          }}
        />

        {/* Outer glow ring - ainda mais sutil */}
        <div
          className="absolute inset-0 rounded-full opacity-60 transition-all duration-300"
          style={{
            background: `radial-gradient(circle, transparent 65%, ${colors.wave}20 75%, transparent 85%)`,
            // 🔧 CORRIGIDO: Resposta direta ao áudio real, sem delay
            ...(isActiveAudio ? {
              animation: `orbPulse 2s ease-in-out infinite 0.6s`,
              opacity: 0.5 + (baseIntensity * 0.2), // 🔧 Resposta direta ao áudio real
              transform: `scale(${1.0 + baseIntensity * 0.15})`, // 🔧 Escala responsiva ao áudio real
            } : {
              transform: `scale(1.0)`,
              opacity: 0.4,
            }),
          }}
        />

        {/* Rolling spheres inside the orb - SUTIS COMO ONDAS DO MAR */}
        <div className="absolute inset-3 rounded-full overflow-hidden" style={{ clipPath: 'circle(50% at 50% 50%)' }}>
          {[...Array(24)].map((_, i) => { // 🔧 Aumentado para 24 partículas para ocupar todo o orb
            // 🎵 MELHORADO: Tamanhos normais (revertido)
            const sizeVariation = Math.sin(i * 2.1) * Math.cos(i * 1.7) * 0.8;
            const size = Math.max(1.2, 2.0 + sizeVariation + (i % 3) * 0.4); // 🔧 Tamanho normal
            
            // 🎵 EXPANDIDO: Raios orbitais maiores para ocupar todo o orb
            const radiusBase = 8 + (i % 6) * 3; // 🔧 Base expandida: 8-23px
            const radiusVariation = Math.sin(i * 2.3) * 4 + Math.cos(i * 1.9) * 3; // 🔧 Variação maior
            const radius = Math.max(6, Math.min(26, radiusBase + radiusVariation)); // 🔧 MÁXIMO 26px para ocupar todo o orb
            
            // 🔧 NOVO: Velocidades MUITO mais lentas - como respiração
            const speedBase = 25 + (i % 5) * 5; // Base mais lenta
            const speedVariation = Math.sin(i * 1.7) * 8 + Math.cos(i * 1.3) * 5;
            const animationDuration = Math.max(20, speedBase + speedVariation); // 🔧 Mínimo 20s!
            
            // 🔧 NOVO: Delays mais espaçados e orgânicos
            const delayVariation = Math.sin(i * 2.1) * 3 + Math.cos(i * 1.8) * 2;
            const animationDelay = (i * 2.5) + delayVariation; // 🔧 Mais espaçado
            
            // 🔧 NOVO: Opacidade muito mais visível - FOCO na responsividade ao áudio
            const baseOpacity = 0.2 + (Math.sin(i * 1.5) * 0.15); // 🔧 Base aumentada
            const intensityOpacity = waveIntensity * 0.6; // 🔧 MUITO mais responsivo ao áudio
            const finalOpacity = (baseOpacity + intensityOpacity) * (0.8 + Math.sin(i * 1.8) * 0.2); // 🔧 Multiplicador aumentado
            
            return (
              <div
                key={`sphere-${i}`}
                className="absolute rounded-full transition-opacity duration-300" // 🔧 Transição mais rápida para áudio
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: colors.particleColor, // 🔧 Cor mais intensa para partículas
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%)`,
                  opacity: Math.max(0.15, Math.min(0.9, finalOpacity)), // 🔧 MUITO mais visível (0.15-0.9)
                  boxShadow: `0 0 ${size * (2.0 + waveIntensity * 1.5)}px ${colors.particleShadow}`, // 🔧 Sombra original (revertido)
                  // 🔧 Propriedades de animação separadas - MUITO mais lentas
                  animationName: `orbSphere${i % 8}`, // 🔧 Usar as 8 animações de forma cíclica
                  animationDuration: `${animationDuration}s`, // 🔧 20-40 segundos!
                  animationTimingFunction: 'ease-in-out', // 🔧 Sempre suave
                  animationIterationCount: 'infinite',
                  animationDelay: `${animationDelay}s`,
                  animationDirection: i % 8 === 0 ? 'reverse' : 'normal', // 🔧 Mais variação com 24 partículas
                  // 🔧 Transform origin mais centrado e sutil
                  transformOrigin: `${48 + Math.sin(i * 1.7) * 8}% ${48 + Math.cos(i * 1.4) * 8}%`,
                }}
              />
            );
          })}
        </div>

        {/* Reflection highlight */}
        <div
          className="absolute top-2 left-2 w-4 h-4 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), transparent 60%)",
          }}
        />
      </div>
    </div>
  );
};

export default RealtimeOrb; 