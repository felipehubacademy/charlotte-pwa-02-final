'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mic, Camera, ArrowRight, Sparkles, CheckCircle, Star, Users, Clock, Zap } from 'lucide-react';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import Head from 'next/head';

interface LeadFormData {
  nome: string;
  email: string;
  telefone: string;
  nivel: 'Novice' | 'Inter' | 'Advanced' | '';
  senha: string;
  confirmarSenha: string;
}

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    nome: '',
    email: '',
    telefone: '',
    nivel: '',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormData, string>> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone)) {
      newErrors.telefone = 'Formato: (11) 99999-9999';
    }

    if (!formData.nivel) {
      newErrors.nivel = 'Nível é obrigatório';
    }

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    if (field === 'telefone') {
      value = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Redirecionar para página de instalação
        window.location.href = '/install';
      } else {
        throw new Error('Erro ao processar cadastro');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!isMounted) {
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
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        </Head>
        <div className="min-h-screen bg-secondary overflow-hidden overflow-x-hidden select-none">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl"></div>
          </div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(rgba(163,255,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,60,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

          <div className="relative z-10 min-h-screen flex flex-col">
            {/* Mobile Header - Empty */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0 pt-safe py-4"
            >
            </motion.div>

            {/* Mobile Main Content */}
            <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-full">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center space-y-6 max-w-full"
              >
                {/* Hero Text */}
                <div className="flex justify-center">
                  <div className="space-y-1">
                    <div className="space-y-0">
                      {/* Avatar + Nome */}
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="relative">
                          <CharlotteAvatar 
                            size="lg"
                            showStatus={true}
                            isOnline={true}
                            animate={true}
                          />
                          {/* Efeito de brilho ao redor do avatar */}
                          <div className="absolute inset-0 -m-2 bg-primary/10 rounded-full blur-lg animate-pulse"></div>
                        </div>
                        <div>
                          <h1 className="text-5xl font-bold text-white">
                            <span className="text-primary">Charlotte</span>
                          </h1>
                          <p className="text-white/50 text-sm font-medium -mt-1">
                            by Hub Academy
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>7 Dias Grátis - Sem Cartão</span>
                </div>
                
                <div className="pt-4 space-y-1">
                  <p className="text-lg text-white/90 font-medium leading-relaxed">
                    Pratique inglês com IA e feedback em tempo real
                  </p>
                </div>

                {/* Formulário */}
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  onSubmit={handleSubmit}
                  className="w-full max-w-full space-y-4 bg-charcoal/30 rounded-2xl p-6 border border-primary/20"
                >
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        className="w-full box-border bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                      />
                      {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
                    </div>

                    <div>
                      <input
                        type="email"
                        placeholder="Seu melhor email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full box-border bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                      />
                      {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        className="w-full box-border bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                      />
                      {errors.telefone && <p className="text-red-400 text-sm mt-1">{errors.telefone}</p>}
                    </div>

                    <div>
                      <select
                        value={formData.nivel}
                        onChange={(e) => handleInputChange('nivel', e.target.value as LeadFormData['nivel'])}
                        className="w-full box-border bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                      >
                        <option value="" disabled className="bg-charcoal text-white/50">Selecione seu nível</option>
                        <option value="Novice" className="bg-charcoal">Iniciante (Novice)</option>
                        <option value="Inter" className="bg-charcoal">Intermediário (Inter)</option>
                        <option value="Advanced" className="bg-charcoal">Avançado (Advanced)</option>
                      </select>
                      {errors.nivel && <p className="text-red-400 text-sm mt-1">{errors.nivel}</p>}
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="Defina uma senha para seu trial"
                        value={formData.senha}
                        onChange={(e) => handleInputChange('senha', e.target.value)}
                        className="w-full box-border bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                      />
                      {errors.senha && <p className="text-red-400 text-sm mt-1">{errors.senha}</p>}
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="Confirme sua senha"
                        value={formData.confirmarSenha}
                        onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                        className="w-full box-border bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                      />
                      {errors.confirmarSenha && <p className="text-red-400 text-sm mt-1">{errors.confirmarSenha}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full box-border bg-primary hover:bg-primary-dark text-secondary font-medium text-base py-3.5 px-6 rounded-xl border border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <span>Começar Teste Grátis</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex justify-center space-x-8 pt-4 max-w-full overflow-hidden"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs text-white/60">Chat IA</span>
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

              </motion.div>
            </div>

            {/* Mobile Footer - Hub Logo */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex-shrink-0 py-4 mb-20 flex justify-center max-w-full overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 80px)' }}
            >
              <img 
                src="/logos/hub-white.png" 
                alt="Hub Academy" 
                className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            </motion.div>
          </div>
        </div>
      </>
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
        {/* Desktop Header - Empty */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 pt-safe"
        >
          <div className="px-6 py-4"></div>
        </motion.header>

        {/* Desktop Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="space-y-0">
                    {/* Avatar + Nome */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="relative">
                        <CharlotteAvatar 
                          size="lg"
                          showStatus={true}
                          isOnline={true}
                          animate={true}
                        />
                        {/* Efeito de brilho ao redor do avatar */}
                        <div className="absolute inset-0 -m-2 bg-primary/10 rounded-full blur-lg animate-pulse"></div>
                      </div>
                      <div>
                        <h1 className="text-7xl font-bold text-white leading-tight">
                          <span className="text-primary">Charlotte</span>
                        </h1>
                        <p className="text-white/50 text-lg font-medium -mt-2 ml-0">
                          by Hub Academy
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>7 Dias Grátis - Sem Cartão</span>
                </div>

                <div className="pt-2 space-y-2">
                  <p className="text-xl text-white/90 font-medium leading-relaxed">
                    Pratique Inglês com IA
                  </p>
                  <p className="text-lg text-white/60 leading-relaxed">
                    Conversas inteligentes, feedback em tempo real e progresso personalizado
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>Feedback instantâneo de pronúncia</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>Conversas adaptadas ao seu nível</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>Sistema de gamificação e conquistas</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-charcoal/30 rounded-2xl p-8 border border-primary/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Comece Seu Teste Grátis
                  </h2>
                  <p className="text-white/60">
                    Preencha os dados e acesse por 7 dias
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="w-full bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                    />
                    {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      className="w-full bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                    />
                    {errors.telefone && <p className="text-red-400 text-sm mt-1">{errors.telefone}</p>}
                  </div>

                  <div>
                    <select
                      value={formData.nivel}
                      onChange={(e) => handleInputChange('nivel', e.target.value as LeadFormData['nivel'])}
                      className="w-full bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="" disabled className="bg-charcoal text-white/50">Selecione seu nível</option>
                      <option value="Novice" className="bg-charcoal">Iniciante (Novice)</option>
                      <option value="Inter" className="bg-charcoal">Intermediário (Inter)</option>
                      <option value="Advanced" className="bg-charcoal">Avançado (Advanced)</option>
                    </select>
                    {errors.nivel && <p className="text-red-400 text-sm mt-1">{errors.nivel}</p>}
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="Defina uma senha para seu trial"
                      value={formData.senha}
                      onChange={(e) => handleInputChange('senha', e.target.value)}
                      className="w-full bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                    />
                    {errors.senha && <p className="text-red-400 text-sm mt-1">{errors.senha}</p>}
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="Confirme sua senha"
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                      className="w-full bg-charcoal/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                    />
                    {errors.confirmarSenha && <p className="text-red-400 text-sm mt-1">{errors.confirmarSenha}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary-dark text-secondary font-medium text-base py-3.5 px-6 rounded-xl border border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <span>Começar Teste Grátis</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-xs text-white/40">
                    Ao continuar, você concorda com nossos termos de uso
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center space-x-6 text-white/40">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">+1000 usuários</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">4.9/5 avaliação</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">7 dias grátis</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Desktop Footer - Hub Logo */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex-shrink-0 py-8 px-6 flex justify-center"
        >
          <img 
            src="/logos/hub-white.png" 
            alt="Hub Academy" 
            className="h-16 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </motion.footer>
      </div>
    </div>
  );
}
