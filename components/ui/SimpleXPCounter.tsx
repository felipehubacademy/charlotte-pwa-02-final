'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleXPCounterProps {
  totalXP: number;
  sessionXP?: number;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function SimpleXPCounter({ 
  totalXP, 
  sessionXP = 0, 
  size = 40,
  className = '',
  onClick
}: SimpleXPCounterProps) {
  const [progress, setProgress] = useState(0);
  const [displaySessionXP, setDisplaySessionXP] = useState(sessionXP || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingXP, setFloatingXP] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(progressPercentage);
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  // XP gained animation
  useEffect(() => {
    if ((sessionXP || 0) > displaySessionXP) {
      setIsAnimating(true);
      const difference = (sessionXP || 0) - displaySessionXP;
      
      setFloatingXP(difference);
      
      const duration = 1000;
      const startTime = Date.now();
      const startValue = displaySessionXP;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (difference * easeOut));
        
        setDisplaySessionXP(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setFloatingXP(null);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [sessionXP]);

  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        className="relative"
        animate={isAnimating ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 0px rgba(163, 255, 60, 0)",
            "0 0 20px rgba(163, 255, 60, 0.5)",
            "0 0 0px rgba(163, 255, 60, 0)"
          ]
        } : {}}
        transition={{ duration: 0.6 }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#374151"
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-30"
          />
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
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className="text-white font-bold text-sm"
            animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {currentLevel}
          </motion.span>
        </div>

        {/* Floating XP Animation */}
        <AnimatePresence>
          {floatingXP && (
            <motion.div
              className="absolute left-1/2 top-0 pointer-events-none z-10"
              initial={{ opacity: 1, y: 0, x: "-50%", scale: 0.8 }}
              animate={{ opacity: 0, y: -30, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <div className="bg-primary text-black px-2 py-1 rounded-full text-xs font-bold shadow-lg border border-primary/50">
                +{floatingXP} XP
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particle Effects */}
        <AnimatePresence>
          {isAnimating && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`particle-${Date.now()}-${i}-${Math.random()}`}
                  className="absolute w-1 h-1 bg-primary rounded-full pointer-events-none"
                  style={{
                    left: `${50 + (Math.random() - 0.5) * 40}%`,
                    top: `${50 + (Math.random() - 0.5) * 40}%`,
                  }}
                  initial={{ opacity: 1, scale: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: 1,
                    y: -20 + Math.random() * -20,
                    x: (Math.random() - 0.5) * 30
                  }}
                  transition={{ 
                    duration: 1 + Math.random() * 0.5,
                    delay: i * 0.1 
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 