// components/chat/GrammarScoreDisplay.tsx - Componente para exibir análise de gramática

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, AlertCircle, TrendingUp, Star } from 'lucide-react';

interface GrammarScoreDisplayProps {
  grammarScore: number;
  grammarErrors: number;
  textComplexity: string;
  xpAwarded: number;
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
}

const GrammarScoreDisplay: React.FC<GrammarScoreDisplayProps> = ({
  grammarScore,
  grammarErrors,
  textComplexity,
  xpAwarded,
  userLevel
}) => {
  
  // 🎨 Determinar cor baseada na pontuação
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '🎉';
    if (score >= 70) return '👍';
    if (score >= 60) return '💪';
    return '🌱';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'advanced': return 'text-purple-400';
      case 'intermediate': return 'text-blue-400';
      case 'simple': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'advanced': return '🎯';
      case 'intermediate': return '📈';
      case 'simple': return '🌱';
      default: return '📝';
    }
  };

  // 🎯 Mensagem de encorajamento baseada no nível e pontuação
  const getEncouragementMessage = () => {
    if (userLevel === 'Novice') {
      if (grammarScore >= 80) return "Excellent grammar! You're mastering English! 🌟";
      if (grammarScore >= 70) return "Great grammar! Your English is really strong! 🎉";
      if (grammarScore >= 60) return "Very good! You're improving fast! 👏";
      return "Keep practicing! Every message helps you improve! 🌱";
    } else if (userLevel === 'Intermediate') {
      if (grammarScore >= 85) return "Outstanding grammar! Professional level! 🏆";
      if (grammarScore >= 75) return "Great work! Your skills are solid! ⭐";
      if (grammarScore >= 65) return "Good progress! Keep refining! 📈";
      return "Keep going! You're getting stronger! 💪";
    } else {
      if (grammarScore >= 90) return "Exceptional mastery! Native-like quality! 🎖️";
      if (grammarScore >= 80) return "Excellent command! Very impressive! 🌟";
      if (grammarScore >= 70) return "Strong performance! Well done! 👏";
      return "Good foundation! Continue challenging yourself! 🚀";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-charcoal/80 to-charcoal/60 backdrop-blur-sm rounded-xl p-4 border border-primary/20 mt-3"
    >
      {/* Header com score principal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BookOpen size={16} className="text-primary" />
          <span className="text-primary font-medium text-sm">Grammar Analysis</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/60">+{xpAwarded} XP</span>
          <Star size={12} className="text-yellow-400" />
        </div>
      </div>

      {/* Score principal */}
      <div className="flex items-center justify-center mb-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(grammarScore)}`}>
            {grammarScore}/100
          </div>
          <div className="text-xs text-white/60 mt-1">Grammar Score</div>
        </div>
        <div className="ml-3 text-2xl">
          {getScoreEmoji(grammarScore)}
        </div>
      </div>

      {/* Detalhes em grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Erros encontrados */}
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            {grammarErrors === 0 ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              <AlertCircle size={14} className="text-orange-400" />
            )}
          </div>
          <div className="text-sm font-medium text-white">
            {grammarErrors === 0 ? 'No errors!' : `${grammarErrors} error${grammarErrors > 1 ? 's' : ''}`}
          </div>
          <div className="text-xs text-white/60">Found</div>
        </div>

        {/* Complexidade do texto */}
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <span className="text-sm">{getComplexityIcon(textComplexity)}</span>
          </div>
          <div className={`text-sm font-medium capitalize ${getComplexityColor(textComplexity)}`}>
            {textComplexity}
          </div>
          <div className="text-xs text-white/60">Complexity</div>
        </div>
      </div>

      {/* Mensagem de encorajamento */}
      <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
        <div className="flex items-start space-x-2">
          <TrendingUp size={14} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white/90 leading-relaxed">
              {getEncouragementMessage()}
            </p>
            {grammarScore < 70 && (
              <p className="text-xs text-white/60 mt-1">
                💡 Tip: Try writing longer sentences and check your punctuation!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progresso visual */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>Progress</span>
          <span>{grammarScore}%</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${grammarScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              grammarScore >= 90 ? 'bg-green-400' :
              grammarScore >= 80 ? 'bg-blue-400' :
              grammarScore >= 70 ? 'bg-yellow-400' :
              grammarScore >= 60 ? 'bg-orange-400' : 'bg-red-400'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default GrammarScoreDisplay; 