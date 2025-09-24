'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    
    // Verificar se há token de recuperação
    if (searchParams) {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        setIsValidToken(true);
      }
    }
    
    setIsCheckingToken(false);
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!password.trim()) {
      newErrors.push('Senha é obrigatória');
    } else if (password.length < 6) {
      newErrors.push('Senha deve ter pelo menos 6 caracteres');
    }

    if (!confirmPassword.trim()) {
      newErrors.push('Confirmação de senha é obrigatória');
    } else if (password !== confirmPassword) {
      newErrors.push('Senhas não coincidem');
    }

    if (newErrors.length > 0) {
      setError(newErrors[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password, 
          confirmPassword,
          access_token: searchParams?.get('access_token') || '',
          refresh_token: searchParams?.get('refresh_token') || ''
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(data.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted || isCheckingToken) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto mb-4"></div>
          <p className="text-white/70">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="relative z-10 w-full max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Link Inválido
            </h1>
            
            <p className="text-white/70 mb-6">
              Este link de recuperação é inválido ou expirou.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="block w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                Solicitar Novo Link
              </Link>
              
              <Link
                href="/"
                className="block text-white/60 hover:text-white transition-colors"
              >
                Voltar ao Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Redefinir Senha - Charlotte</title>
        <meta name="description" content="Redefina sua senha do trial da Charlotte" />
      </Head>

      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <Link 
              href="/"
              className="inline-flex items-center text-white/60 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao login
            </Link>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">
                Redefinir Senha
              </h1>
              <p className="text-white/70">
                Digite sua nova senha para continuar
              </p>
            </div>
          </motion.div>

          {/* Form */}
          {!isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Redefinindo...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Redefinir Senha</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">
                    Senha Redefinida!
                  </h2>
                  <p className="text-white/70">
                    Sua senha foi alterada com sucesso
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-white/60 mb-4">
                    Redirecionando para o login...
                  </p>
                  
                  <Link
                    href="/"
                    className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    Ir para Login
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
