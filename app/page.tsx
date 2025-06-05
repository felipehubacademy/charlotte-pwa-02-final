'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, MessageSquare, Mic, Camera, ArrowRight, Sparkles } from 'lucide-react';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  // Loading state OR not mounted yet
  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  // Mobile Layout (Primary)
  if (isMobile) {
    return (
      <div className="h-screen bg-secondary overflow-hidden select-none">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        <div className="relative z-10 h-screen flex flex-col">
          {/* Mobile Header - Empty for clean look */}
          <div className="flex-shrink-0 pt-safe py-2"></div>

          {/* Mobile Main Content */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center space-y-6"
            >
              {/* Avatar */}
              <div className="flex justify-center">
                <CharlotteAvatar 
                  size="xl"
                  showStatus={true}
                  isOnline={true}
                  animate={true}
                />
              </div>

              {/* Hero Text */}
              <div className="space-y-1">
                <div className="space-y-0">
                  <h1 className="text-4xl font-bold text-white">
                    <span className="text-primary">Charlotte</span>
                  </h1>
                  
                  <p className="text-white/50 text-sm font-medium -mt-1">
                    by Hub Academy
                  </p>
                </div>
                
                <div className="pt-4 space-y-1">
                  <p className="text-lg text-white/90 font-medium leading-relaxed">
                    Practice Business English
                  </p>
                  <p className="text-base text-white/60 leading-relaxed">
                    with intelligent conversations & real-time feedback
                  </p>
                </div>
              </div>

              {/* CTA Button - Microsoft Style */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                onClick={login}
                disabled={isLoading}
                className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-base py-3.5 px-6 rounded-xl border border-[#0078d4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="currentColor">
                  <rect x="1" y="1" width="9" height="9" fill="currentColor"/>
                  <rect x="1" y="11" width="9" height="9" fill="currentColor"/>
                  <rect x="11" y="1" width="9" height="9" fill="currentColor"/>
                  <rect x="11" y="11" width="9" height="9" fill="currentColor"/>
                </svg>
                <span>Sign in with Microsoft</span>
              </motion.button>

              {/* Feature Icons - Below Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex justify-center space-x-8 pt-4"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-white/60">Chat</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-white/60">Voice</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-white/60">Photos</span>
                </div>
              </motion.div>

              {/* Hub Academy Logo - Mobile */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="flex justify-center pt-4"
              >
                <img 
                  src="/logos/hub-white.png" 
                  alt="Hub Academy" 
                  className="h-8 w-auto opacity-40"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Mobile Footer - Clean */}
          <div className="flex-shrink-0 pb-safe py-4"></div>
        </div>
      </div>
    );
  }

  // Desktop Layout (Secondary)
  return (
    <div className="h-screen bg-secondary overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Desktop Header - Minimal */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 pt-safe"
        >
          <div className="px-6 py-4">
            <div className="text-sm text-white/40 text-center">
              AI English Assistant
            </div>
          </div>
        </motion.header>

        {/* Desktop Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8 md:col-span-1"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by Advanced AI</span>
                </div>

                <div className="space-y-0">
                  <h1 className="text-5xl font-bold text-white leading-tight">
                    <span className="text-primary">Charlotte</span>
                  </h1>

                  <p className="text-white/50 text-lg font-medium -mt-2">
                    by Hub Academy
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <p className="text-xl text-white/90 font-medium leading-relaxed">
                    Practice Business English
                  </p>
                  <p className="text-lg text-white/60 leading-relaxed">
                    with intelligent conversations & real-time feedback
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={login}
                disabled={isLoading}
                className="bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-base py-3.5 px-8 rounded-xl border border-[#0078d4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="currentColor">
                  <rect x="1" y="1" width="9" height="9" fill="currentColor"/>
                  <rect x="1" y="11" width="9" height="9" fill="currentColor"/>
                  <rect x="11" y="1" width="9" height="9" fill="currentColor"/>
                  <rect x="11" y="11" width="9" height="9" fill="currentColor"/>
                </svg>
                <span>Sign in with Microsoft</span>
              </button>
            </motion.div>

            {/* Center Column - Avatar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center md:col-span-1"
            >
              <div className="relative">
                <div className="w-80 h-80 bg-primary/10 rounded-full flex items-center justify-center">
                  <CharlotteAvatar 
                    size="xl"
                    showStatus={true}
                    isOnline={true}
                    animate={true}
                  />
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse delay-1000">
                  <Mic className="w-8 h-8 text-primary" />
                </div>
              </div>
            </motion.div>

            {/* Right Column - Hub Logo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex justify-center items-center md:col-span-1"
            >
              <img 
                src="/logos/hub-white.png" 
                alt="Hub Academy" 
                className="h-16 w-auto opacity-50"
              />
            </motion.div>
          </div>
        </div>

        {/* Desktop Footer - Clean */}
        <div className="flex-shrink-0 p-6"></div>
      </div>
    </div>
  );
}