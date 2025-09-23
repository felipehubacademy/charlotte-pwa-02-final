// components/TrialStatusBanner.tsx
// Banner para exibir status do trial

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useTrialAccess } from '@/hooks/useTrialAccess';

interface TrialStatusBannerProps {
  userId?: string;
  onClose?: () => void;
}

export default function TrialStatusBanner({ userId, onClose }: TrialStatusBannerProps) {
  const { trialStatus, hasAccess, isExpired, daysRemaining, isLoading } = useTrialAccess(userId);

  // Não mostrar se não tem trial ou se está carregando
  if (isLoading || !trialStatus.hasTrial) {
    return null;
  }

  // Se trial expirou
  if (isExpired) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-red-500 text-white px-4 py-3 relative"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Seu teste grátis expirou</p>
                <p className="text-sm opacity-90">
                  Entre em contato conosco para continuar usando o Charlotte
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/configuracoes"
                className="bg-white text-red-500 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Ver Planos
              </a>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Se trial está ativo
  if (hasAccess) {
    // Mostrar apenas se restam 3 dias ou menos
    if (daysRemaining > 3) {
      return null;
    }

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`${
            daysRemaining <= 1 
              ? 'bg-orange-500' 
              : daysRemaining <= 2 
                ? 'bg-yellow-500' 
                : 'bg-blue-500'
          } text-white px-4 py-3 relative`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  {daysRemaining === 1 
                    ? 'Último dia do seu teste grátis!' 
                    : `${daysRemaining} dias restantes no seu teste grátis`
                  }
                </p>
                <p className="text-sm opacity-90">
                  Aproveite para praticar inglês e conhecer todos os recursos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/configuracoes"
                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Ver Planos
              </a>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
