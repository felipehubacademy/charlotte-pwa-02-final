'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, Chrome, Apple, Zap, MessageCircle, Mic, Camera, Sparkles } from 'lucide-react';
import { usePWA } from '@/components/PWAInstaller';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import Head from 'next/head';

export default function InstallPage() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [browser, setBrowser] = useState<'chrome' | 'safari' | 'firefox' | 'edge' | 'other'>('other');
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
    // Detectar plataforma e browser
    const userAgent = navigator.userAgent;
    
    // Detectar plataforma
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/Android/.test(userAgent)) {
      setPlatform('android');
    } else if (/Windows|Mac|Linux/.test(userAgent)) {
      setPlatform('desktop');
    }

    // Detectar browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      setBrowser('chrome');
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      setBrowser('safari');
    } else if (userAgent.includes('Firefox')) {
      setBrowser('firefox');
    } else if (userAgent.includes('Edg')) {
      setBrowser('edge');
    }
  }, []);

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      // Redirecionar para o app após instalação
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1000);
    }
  };

  // Loading state OR not mounted yet
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isInstalled) {
    return (
      <div className="h-screen bg-secondary overflow-hidden select-none">
        {/* Background Elements - Same as home */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl"></div>
        </div>

        {/* Grid Pattern - Same as home */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        <div className="relative z-10 h-screen flex flex-col">
          <div className="flex-shrink-0 pt-safe py-2"></div>
          
          <div className="flex-1 flex flex-col justify-center px-6 py-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center space-y-6"
            >
              {/* Avatar with Install Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <CharlotteAvatar 
                    size="xl"
                    showStatus={true}
                    isOnline={true}
                    animate={true}
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
                    <Download className="w-4 h-4 text-secondary" />
                  </div>
                </div>
              </div>

              {/* Hero Text - Same style as home */}
              <div className="space-y-1">
                <div className="space-y-0">
                  <h1 className="text-4xl font-bold text-white">
                    <span className="text-primary">Charlotte</span> Instalada!
                  </h1>
                  
                  <p className="text-white/50 text-sm font-medium -mt-1">
                    by Hub Academy
                  </p>
                </div>
                
                <div className="pt-4 space-y-1">
                  <p className="text-lg text-white/90 font-medium leading-relaxed">
                    App pronto para usar
                  </p>
                  <p className="text-base text-white/60 leading-relaxed">
                    Acesso offline e experiência nativa disponíveis
                  </p>
                </div>
              </div>

              {/* CTA Button - Same style as home */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                onClick={() => window.location.href = '/chat'}
                className="w-full bg-primary hover:bg-primary-dark text-secondary font-medium text-base py-3.5 px-6 rounded-xl border border-primary transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Abrir Charlotte</span>
              </motion.button>
            </motion.div>
          </div>

          <div className="flex-shrink-0 pb-safe py-4"></div>
        </div>
      </div>
    );
  }

  // Mobile Layout (Primary)
  if (isMobile) {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        </Head>
        <div className="h-screen bg-secondary overflow-hidden select-none">
        {/* Background Elements - Same as home */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl"></div>
        </div>

        {/* Grid Pattern - Same as home */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        <div className="relative z-10 h-screen flex flex-col overflow-hidden">
          {/* Mobile Header - Same as home */}
          <div className="flex-shrink-0 pt-safe py-2"></div>

          {/* Mobile Main Content */}
          <div className="flex-1 flex flex-col justify-center px-4 py-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center space-y-4"
            >
              {/* Avatar with Install Badge */}
              <div className="flex justify-center">
                <div className="relative">
                  <CharlotteAvatar 
                    size="xl"
                    showStatus={true}
                    isOnline={true}
                    animate={true}
                  />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
                    <Download className="w-4 h-4 text-secondary" />
                  </div>
                </div>
              </div>

              {/* Hero Text - Same style as home */}
              <div className="space-y-1">
                <div className="space-y-0">
                  <h1 className="text-4xl font-bold text-white">
                    Instalar <span className="text-primary">Charlotte</span>
                  </h1>
                  
                  <p className="text-white/50 text-sm font-medium -mt-1">
                    by Hub Academy
                  </p>
                </div>
                
                <div className="pt-4 space-y-1">
                  <p className="text-lg text-white/90 font-medium leading-relaxed">
                    Experiência completa offline
                  </p>
                  <p className="text-base text-white/60 leading-relaxed">
                    com conversas por voz e feedback em tempo real
                  </p>
                </div>
              </div>

              {/* Install Button if available */}
              {isInstallable && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  onClick={handleInstallClick}
                  className="w-full bg-primary hover:bg-primary-dark text-secondary font-medium text-base py-3.5 px-6 rounded-xl border border-primary transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar Agora</span>
                </motion.button>
              )}

              {/* Platform Instructions - Compact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="space-y-3"
              >
                {platform === 'ios' && (
                  <div className="bg-charcoal/50 rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Apple className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-white font-medium">iOS Safari</span>
                    </div>
                                         <div className="text-sm text-white/70 space-y-1">
                       <p>1. Toque em <strong className="text-white">Compartilhar</strong> (⬆️)</p>
                       <p>2. Selecione <strong className="text-white">"Adicionar à Tela de Início"</strong></p>
                     </div>
                  </div>
                )}

                {platform === 'android' && (
                  <div className="bg-charcoal/50 rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Chrome className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-white font-medium">Android Chrome</span>
                    </div>
                    <div className="text-sm text-white/70 space-y-1">
                      <p>1. Procure pelo banner <strong className="text-white">"Instalar"</strong></p>
                      <p>2. Ou menu (⋮) → <strong className="text-white">"Instalar app"</strong></p>
                    </div>
                  </div>
                )}

                {platform === 'desktop' && (
                  <div className="bg-charcoal/50 rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-white font-medium">Desktop</span>
                    </div>
                    <div className="text-sm text-white/70 space-y-1">
                      <p>1. Procure pelo <strong className="text-white">ícone de instalação</strong> na URL</p>
                      <p>2. Ou menu → <strong className="text-white">"Instalar Charlotte"</strong></p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Feature Icons - Same as home */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="flex justify-center space-x-6 pt-3"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
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
                     <Zap className="w-6 h-6 text-primary" />
                   </div>
                   <span className="text-xs text-white/60">Offline</span>
                </div>
              </motion.div>



              {/* Hub Academy Logo - Same as home */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="flex justify-center pt-3"
              >
                <img 
                  src="/logos/hub-white.png" 
                  alt="Hub Academy" 
                  className="h-8 w-auto opacity-40"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Mobile Footer - Same as home */}
          <div className="flex-shrink-0 pb-safe py-2"></div>
        </div>
      </div>
      </>
    );
  }

  // Desktop Layout (Secondary) - Same structure as home
  return (
    <div className="h-screen bg-secondary overflow-hidden">
      {/* Background Elements - Same as home */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl"></div>
      </div>

      {/* Grid Pattern - Same as home */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Desktop Header - Same as home */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 pt-safe"
        >
                     <div className="px-6 py-4">
             <div className="text-sm text-white/40 text-center">
               Instalar App Charlotte
             </div>
           </div>
        </motion.header>

        {/* Desktop Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8 md:col-span-1"
            >
              <div className="space-y-6">
                                 <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary">
                   <Download className="w-4 h-4" />
                   <span>Instale para uma Experiência Melhor</span>
                 </div>

                                 <div className="space-y-0">
                   <h1 className="text-5xl font-bold text-white leading-tight">
                     Instalar <span className="text-primary">Charlotte</span>
                   </h1>

                   <p className="text-white/50 text-lg font-medium -mt-2">
                     by Hub Academy
                   </p>
                 </div>

                 <div className="pt-2 space-y-2">
                   <p className="text-xl text-white/90 font-medium leading-relaxed">
                     Experiência Completa Offline
                   </p>
                   <p className="text-lg text-white/60 leading-relaxed">
                     com performance nativa e acesso instantâneo
                   </p>
                 </div>
              </div>

              {/* Install CTA */}
              {isInstallable && (
                                 <button
                   onClick={handleInstallClick}
                   className="bg-primary hover:bg-primary-dark text-secondary font-medium text-base py-3.5 px-8 rounded-xl border border-primary transition-all duration-200 shadow-sm flex items-center justify-center space-x-2"
                 >
                   <Download className="w-5 h-5" />
                   <span>Instalar Charlotte Agora</span>
                 </button>
              )}

              {/* Platform Instructions */}
              <div className="space-y-3">
                                 {platform === 'ios' && (
                   <div className="flex items-center space-x-3 text-sm text-white/70">
                     <Apple className="w-4 h-4 text-blue-400" />
                     <span>Safari → Compartilhar → Adicionar à Tela de Início</span>
                   </div>
                 )}
                 {platform === 'android' && (
                   <div className="flex items-center space-x-3 text-sm text-white/70">
                     <Chrome className="w-4 h-4 text-green-400" />
                     <span>Chrome → Menu → Adicionar à tela inicial</span>
                   </div>
                 )}
                 {platform === 'desktop' && (
                   <div className="flex items-center space-x-3 text-sm text-white/70">
                     <Monitor className="w-4 h-4 text-purple-400" />
                     <span>Procure pelo ícone de instalação na barra de endereços</span>
                   </div>
                 )}
              </div>


            </motion.div>

            {/* Center Column - Avatar with Install Elements */}
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
                
                {/* Floating elements - Install themed */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse delay-1000">
                  <Zap className="w-8 h-8 text-primary" />
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

        {/* Desktop Footer - Same as home */}
        <div className="flex-shrink-0 p-6"></div>
      </div>
    </div>
  );
} 