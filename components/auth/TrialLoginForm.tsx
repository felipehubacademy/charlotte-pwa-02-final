'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { HybridAuthService } from '@/lib/hybrid-auth-service';

interface TrialLoginFormProps {
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
}

export default function TrialLoginForm({ onSuccess, onError }: TrialLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      onError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      const result = await HybridAuthService.loginTrialUser(email, password);
      
      if (result.success) {
        onSuccess(result.user);
      } else {
        onError(result.error || 'Erro no login');
      }
    } catch (error) {
      onError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div className="text-center mb-6">
          <p className="text-white/70 text-sm">
            Entre com os seus dados
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
              placeholder="Seu email"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                placeholder="Sua senha"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-secondary font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </motion.button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <p className="text-white/60 text-xs">
            <a 
              href="/forgot-password" 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Esqueceu sua senha?
            </a>
          </p>
          
          <p className="text-white/60 text-xs">
            Não tem acesso trial?{' '}
            <a 
              href="/landing" 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Cadastre-se aqui
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
