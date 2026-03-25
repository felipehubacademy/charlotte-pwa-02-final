'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mic, Camera, Sparkles } from 'lucide-react';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import BannerManager from '@/components/BannerManager';
import PWAInstaller from '@/components/PWAInstaller';
import TrialLoginForm from '@/components/auth/TrialLoginForm';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      const isMobileDevice =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);
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

  const handleLoginError = (error: string) => {
    toast.error(error);
  };

  const handleLoginSuccess = () => {
    router.push('/chat');
  };

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

  // Mobile Layout
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

        <div className="relative z-10 h-screen flex flex-col overflow-y-auto">
          <div className="flex-shrink-0 pt-safe py-2"></div>

          <div className="flex-1 flex flex-col justify-center px-6 py-6">
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

                <div className="pt-2 space-y-1">
                  <p className="text-lg text-white/90 font-medium leading-relaxed">
                    Pratique Inglês
                  </p>
                  <p className="text-base text-white/60 leading-relaxed">
                    com conversas inteligentes e feedback em tempo real
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <TrialLoginForm
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                />
              </motion.div>

              {/* PWA Installer */}
              <div className="mt-4">
                <PWAInstaller />
              </div>

              {/* Feature Icons */}
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
                  <span className="text-xs text-white/60">Voz</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-white/60">Fotos</span>
                </div>
              </motion.div>

              {/* Hub Academy Logo */}
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

          <div className="flex-shrink-0 pb-safe py-4"></div>
        </div>
      </div>
    );
  }

  // Desktop Layout
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
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 pt-safe"
        >
          <div className="px-6 py-4">
            <div className="text-sm text-white/40 text-center">
              Assistente de Inglês com IA
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 items-center">
            {/* Left Column - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 md:col-span-1"
            >
              <div className="space-y-4">
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
                    Pratique Inglês
                  </p>
                  <p className="text-lg text-white/60 leading-relaxed">
                    com conversas inteligentes e feedback em tempo real
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <TrialLoginForm
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
              />
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

        {/* Footer */}
        <div className="flex-shrink-0 p-6"></div>

        {/* Banner Manager */}
        <BannerManager />
      </div>
    </div>
  );
}
