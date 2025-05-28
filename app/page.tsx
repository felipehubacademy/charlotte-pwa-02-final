'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-white/70">Loading Charlotte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary-light to-secondary opacity-50"></div>
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div className="relative w-48 h-24 mx-auto mb-8">
            <div className="w-full h-full bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">Hub Academy</span>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">
                <span className="text-primary">Charlotte</span>
              </h1>
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            
            <p className="text-xl text-white/90 font-medium">
              Your AI English Learning Assistant
            </p>
            
            <p className="text-white/70 max-w-sm mx-auto">
              Practice business English with real-time voice conversations, 
              personalized lessons, and intelligent feedback.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 my-8"
          >
            <div className="card p-4">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-primary text-lg">🎙️</span>
              </div>
              <p className="text-sm text-white/80">Voice Chat</p>
            </div>
            <div className="card p-4">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-primary text-lg">📸</span>
              </div>
              <p className="text-sm text-white/80">Object ID</p>
            </div>
            <div className="card p-4">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-primary text-lg">💼</span>
              </div>
              <p className="text-sm text-white/80">Business Focus</p>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={login}
            disabled={isLoading}
            className="btn-primary w-full text-lg py-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5" />
            <span>Continue with Microsoft</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-sm text-white/60 space-y-2"
          >
            <p>Your learning level is automatically detected from your Hub Academy group</p>
            <div className="flex justify-center space-x-4 text-xs">
              <span className="px-2 py-1 bg-primary/20 text-primary rounded">Novice</span>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded">Intermediate</span>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded">Advanced</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-10 p-6 text-center">
        <p className="text-white/40 text-sm">
          Powered by OpenAI • Hub Academy © 2024
        </p>
      </div>
    </div>
  );
}