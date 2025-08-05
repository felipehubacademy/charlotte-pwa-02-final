'use client';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, Chrome, Apple, Zap, MessageCircle, Mic, Camera, Sparkles } from 'lucide-react';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import QRCodeGenerator from './QRCodeGenerator';

export default function MobileOnlyPage() {
  return (
    <div className="h-screen bg-secondary overflow-hidden select-none">
      {/* Background Elements - Same as install page */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl"></div>
      </div>

      {/* Grid Pattern - Same as install page */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pt-safe py-2"></div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-4"
          >
            {/* Avatar with Mobile Badge */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CharlotteAvatar 
                  size="lg"
                  showStatus={true}
                  isOnline={true}
                  animate={true}
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <Smartphone className="w-3 h-3 text-secondary" />
                </div>
              </div>
            </div>

            {/* Hero Text - Compact */}
            <div className="space-y-1 mb-6">
              <div className="space-y-0">
                <h1 className="text-3xl font-bold text-white">
                  <span className="text-primary">Charlotte</span> Mobile
                </h1>
                
                <p className="text-white/50 text-xs font-medium -mt-1">
                  by Hub Academy
                </p>
              </div>
              
              <div className="pt-2 space-y-1">
                <p className="text-base text-white/90 font-medium leading-relaxed">
                  Experiência otimizada para celular
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  com conversas por voz e feedback em tempo real
                </p>
              </div>
            </div>

            {/* QR Code - Smaller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-3"
            >
              <div className="bg-charcoal/50 rounded-xl p-3 border border-primary/20 max-w-xs mx-auto">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-white text-sm font-medium">Escaneie o QR Code</span>
                </div>
                <div className="flex justify-center">
                  <div className="p-2 bg-white rounded-lg">
                    <QRCodeGenerator 
                      url="https://charlotte.hubacademybr.com/install"
                      size={120}
                      className="rounded-md"
                    />
                  </div>
                </div>
                <p className="text-xs text-white/70 mt-2 text-center">
                  Aponte a câmera do celular para este código
                </p>
              </div>
            </motion.div>

            {/* Link alternativo - Smaller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-charcoal/50 rounded-xl p-3 border border-primary/20 max-w-xs mx-auto"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Monitor className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-white text-sm font-medium">Ou acesse diretamente no celular</span>
              </div>
              <div className="text-xs text-white/70">
                <p className="font-mono text-primary break-all">
                  charlotte.hubacademybr.com
                </p>
              </div>
            </motion.div>

            {/* Feature Icons - Smaller */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex justify-center space-x-6 pt-3"
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-white/60">Chat</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Mic className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-white/60">Voz</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-white/60">Offline</span>
              </div>
            </motion.div>

            {/* Hub Academy Logo - Smaller */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="flex justify-center pt-3"
            >
              <img 
                src="/logos/hub-white.png" 
                alt="Hub Academy" 
                className="h-6 w-auto opacity-40"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pb-safe py-3"></div>
      </div>
    </div>
  );
} 