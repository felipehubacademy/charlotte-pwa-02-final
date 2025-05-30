// lib/audio-xp-service.ts - COM LÓGICA DE RETRY PARA ÁUDIO RUIM

export interface AudioAssessmentResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  feedback: string[];
}

export interface AudioXPResult {
  xpAwarded: number;
  bonusXP: number; 
  totalXP: number;
  scoreBreakdown: {
    baseXP: number;
    lengthBonus: number;
    effortBonus: number;
    completenessBonus: number;
    accuracyBonus: number;
    levelBonus: number;
  };
  feedback: string;
  shouldRetry: boolean; // ✅ NOVO: Indica se deve pedir retry
  retryReason: string;  // ✅ NOVO: Motivo do retry
}

/**
 * 🔍 FUNÇÃO: Verificar se o áudio é válido ou precisa repetir
 */
function shouldRequestRetry(
  assessmentResult: AudioAssessmentResult,
  audioDuration: number
): { shouldRetry: boolean; reason: string } {
  
  const { text, pronunciationScore, accuracyScore } = assessmentResult;
  
  // ❌ CASOS QUE PRECISAM REPETIR:
  
  // 1. Texto não foi reconhecido ou é "Unknown"
  if (!text || text.toLowerCase().includes('unknown') || text.trim().length < 3) {
    return {
      shouldRetry: true,
      reason: 'not_understood'
    };
  }
  
  // 2. Áudio muito curto (menos de 2 segundos)
  if (audioDuration < 2) {
    return {
      shouldRetry: true,
      reason: 'too_short'
    };
  }
  
  // 3. Scores extremamente baixos (indica áudio ruim/inaudível)
  if (pronunciationScore < 15 && accuracyScore < 20) {
    return {
      shouldRetry: true,
      reason: 'poor_quality'
    };
  }
  
  // 4. Texto contém muito gibberish ou caracteres estranhos
  const gibberishPatterns = /[^a-zA-Z0-9\s.,!?'-]/g;
  const gibberishCount = (text.match(gibberishPatterns) || []).length;
  if (gibberishCount > text.length * 0.3) {
    return {
      shouldRetry: true,
      reason: 'gibberish'
    };
  }
  
  // ✅ Áudio está OK
  return {
    shouldRetry: false,
    reason: ''
  };
}

/**
 * 🎯 FUNÇÃO PRINCIPAL: Calcular XP com lógica de retry
 */
export function calculateAudioXP(
  assessmentResult: AudioAssessmentResult,
  audioDuration: number,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
): AudioXPResult {
  
  const {
    accuracyScore,
    fluencyScore,
    completenessScore,
    pronunciationScore,
    text
  } = assessmentResult;

  console.log('🎯 Calculating XP with retry logic:', {
    pronunciationScore,
    accuracyScore,
    text: text.substring(0, 50) + '...',
    duration: audioDuration,
    userLevel
  });

  // 🔍 VERIFICAR SE PRECISA REPETIR
  const retryCheck = shouldRequestRetry(assessmentResult, audioDuration);
  
  if (retryCheck.shouldRetry) {
    console.log('❌ Audio needs retry:', retryCheck.reason);
    
    return {
      xpAwarded: 0, // Sem XP para áudio ruim
      bonusXP: 0,
      totalXP: 0,
      scoreBreakdown: {
        baseXP: 0,
        lengthBonus: 0,
        effortBonus: 0,
        completenessBonus: 0,
        accuracyBonus: 0,
        levelBonus: 0
      },
      feedback: generateRetryFeedback(retryCheck.reason, userLevel),
      shouldRetry: true,
      retryReason: retryCheck.reason
    };
  }

  // ✅ ÁUDIO VÁLIDO - CALCULAR XP NORMALMENTE
  console.log('✅ Audio is valid, calculating XP...');

  // 🏆 BASE XP - Sempre generoso para motivar
  let baseXP = 35; // Mínimo motivador

  // 📏 BÔNUS POR COMPRIMENTO DA TRANSCRIÇÃO
  const textLength = text.trim().length;
  let lengthBonus = 0;
  
  if (textLength >= 120) lengthBonus = 45;      // Frase muito longa
  else if (textLength >= 100) lengthBonus = 40; // Frase longa
  else if (textLength >= 80) lengthBonus = 35;  // Frase média-longa
  else if (textLength >= 60) lengthBonus = 30;  // Frase média
  else if (textLength >= 40) lengthBonus = 25;  // Frase curta
  else if (textLength >= 25) lengthBonus = 20;  // Frase muito curta
  else lengthBonus = 15; // Pelo menos tentou

  // ⏱️ BÔNUS POR DURAÇÃO (tempo falando)
  let effortBonus = 0;
  if (audioDuration >= 25) effortBonus = 30;      // Falou muito tempo
  else if (audioDuration >= 20) effortBonus = 25; // Falou bastante tempo
  else if (audioDuration >= 15) effortBonus = 20; // Falou bastante
  else if (audioDuration >= 10) effortBonus = 15; // Falou um tempo ok
  else if (audioDuration >= 5) effortBonus = 10;  // Falou pouco tempo
  else effortBonus = 5; // Pelo menos falou algo

  // 📝 BÔNUS POR COMPLETUDE
  let completenessBonus = 0;
  if (completenessScore >= 80) completenessBonus = 20;
  else if (completenessScore >= 60) completenessBonus = 15;
  else if (completenessScore >= 40) completenessBonus = 10;
  else if (completenessScore >= 20) completenessBonus = 5;
  else completenessBonus = 2;

  // 🎯 BÔNUS POR PRECISÃO
  let accuracyBonus = 0;
  if (accuracyScore >= 85) accuracyBonus = 25;      // Muito preciso
  else if (accuracyScore >= 70) accuracyBonus = 20; // Bem preciso
  else if (accuracyScore >= 55) accuracyBonus = 15; // Razoavelmente preciso
  else if (accuracyScore >= 40) accuracyBonus = 10; // Um pouco preciso
  else if (accuracyScore >= 25) accuracyBonus = 5;  // Minimamente preciso
  else accuracyBonus = 2; // Pelo menos tentou

  // 🎓 BÔNUS POR NÍVEL (iniciantes recebem mais)
  let levelBonus = 0;
  const subtotal = baseXP + lengthBonus + effortBonus;
  
  if (userLevel === 'Novice') {
    levelBonus = Math.round(subtotal * 0.4); // 40% bônus para iniciantes
  } else if (userLevel === 'Intermediate') {
    levelBonus = Math.round(subtotal * 0.15); // 15% bônus para intermediários
  }
  // Advanced não recebe bônus de nível

  // 🧮 CÁLCULO FINAL
  const totalXP = baseXP + lengthBonus + effortBonus + completenessBonus + accuracyBonus + levelBonus;
  const bonusXP = lengthBonus + effortBonus + completenessBonus + accuracyBonus + levelBonus;

  // 🎯 LIMITES: Mais generosos
  const finalXP = Math.max(30, Math.min(totalXP, 150)); // Entre 30-150 XP

  // 📝 FEEDBACK MOTIVADOR
  const feedback = generateMotivationalFeedback(
    assessmentResult, 
    finalXP, 
    audioDuration, 
    textLength, 
    userLevel
  );

  const result = {
    xpAwarded: finalXP,
    bonusXP,
    totalXP: finalXP,
    scoreBreakdown: {
      baseXP,
      lengthBonus,
      effortBonus,
      completenessBonus,
      accuracyBonus,
      levelBonus
    },
    feedback,
    shouldRetry: false,
    retryReason: ''
  };

  console.log('✅ Valid audio XP calculated:', {
    finalXP,
    textLength,
    duration: audioDuration,
    breakdown: result.scoreBreakdown
  });

  return result;
}

/**
 * 🔄 Gerar feedback para quando precisa repetir
 */
function generateRetryFeedback(
  reason: string, 
  userLevel: 'Novice' | 'Intermediate' | 'Advanced'
): string {
  
  const isNovice = userLevel === 'Novice';
  
  switch (reason) {
    case 'not_understood':
      return isNovice 
        ? '🎤 Desculpe, não consegui entender seu áudio. Pode tentar falar mais devagar e claramente? Try speaking slower and clearer!' 
        : '🎤 I couldn\'t understand your audio clearly. Could you please try speaking slower and more clearly?';
        
    case 'too_short':
      return isNovice
        ? '⏱️ Seu áudio foi muito curto! Try speaking for at least 3-4 seconds so I can help you better!'
        : '⏱️ Your audio was too short! Please try speaking for at least 3-4 seconds so I can provide better feedback.';
        
    case 'poor_quality':
      return isNovice
        ? '📢 O áudio não ficou muito claro. Please check if you\'re in a quiet place and speak closer to the microphone!'
        : '📢 The audio quality seems low. Please make sure you\'re in a quiet environment and speaking clearly into the microphone.';
        
    case 'gibberish':
      return isNovice
        ? '🗣️ Não consegui reconhecer as palavras. Try speaking real English words slowly and clearly!'
        : '🗣️ I had trouble recognizing the words. Please try speaking clearly with real English words.';
        
    default:
      return isNovice
        ? '🔄 Vamos tentar novamente? Please speak clearly so I can help you practice better!'
        : '🔄 Let\'s try again! Please speak clearly so I can provide you with better feedback.';
  }
}

/**
 * 📝 Feedback motivacional para áudio válido
 */
function generateMotivationalFeedback(
  result: AudioAssessmentResult,
  xpAwarded: number,
  duration: number,
  textLength: number,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced'
): string {
  
  let feedback = '';
  
  // 🎉 Feedback baseado no ESFORÇO e COMPRIMENTO
  if (textLength >= 100 && duration >= 15) {
    feedback = `🌟 Fantastic! +${xpAwarded} XP - You spoke a long, complete sentence with great effort!`;
  } else if (textLength >= 80 || duration >= 12) {
    feedback = `👏 Excellent work! +${xpAwarded} XP - I love how much you're practicing!`;
  } else if (textLength >= 60 || duration >= 8) {
    feedback = `👍 Great job! +${xpAwarded} XP - You're building strong speaking habits!`;
  } else if (textLength >= 40 || duration >= 5) {
    feedback = `💪 Good effort! +${xpAwarded} XP - Keep practicing longer sentences!`;
  } else {
    feedback = `🚀 Nice start! +${xpAwarded} XP - Try speaking a bit longer next time!`;
  }
  
  // 💡 Dicas motivadoras
  const suggestions = [];
  
  if (textLength >= 100) {
    suggestions.push('🎯 Perfect! Long sentences like this really improve your fluency!');
  } else if (textLength >= 60) {
    suggestions.push('📈 Great length! Try to add even more details to practice more vocabulary!');
  } else if (duration >= 10) {
    suggestions.push('⏱️ Good speaking time! The longer you speak, the more confident you become!');
  } else {
    suggestions.push('💬 Challenge: Try speaking for 10+ seconds next time to boost your skills!');
  }
  
  if (suggestions.length > 0) {
    feedback += '\n\n' + suggestions[0];
  }
  
  // 🎯 Incentivo por nível
  if (userLevel === 'Novice') {
    feedback += '\n🚀 You\'re making amazing progress as a beginner!';
  } else if (userLevel === 'Intermediate') {
    feedback += '\n📚 Your intermediate skills are really developing!';
  } else {
    feedback += '\n⭐ Excellent advanced practice!';
  }
  
  return feedback;
}

// Export das funções principais
export function compareWithOldSystem(
  pronunciationScore: number,
  newXP: number,
  textLength: number
): {
  oldXP: number;
  newXP: number;
  difference: number;
  improvement: string;
} {
  const oldXP = pronunciationScore >= 80 ? 75 : 50;
  const difference = newXP - oldXP;
  
  let improvement = 'Same';
  if (difference > 0) improvement = `+${difference} XP better (effort-based)`;
  if (difference < 0) improvement = `${Math.abs(difference)} XP lower`;
  
  return {
    oldXP,
    newXP,
    difference,
    improvement
  };
}

export function recalculateXPFromScores(
  accuracyScore: number,
  fluencyScore: number,
  completenessScore: number,
  pronunciationScore: number,
  duration: number = 10,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
): number {
  
  let mockTextLength = 50;
  if (pronunciationScore >= 80) mockTextLength = 90;
  else if (pronunciationScore >= 60) mockTextLength = 70;
  else if (pronunciationScore >= 40) mockTextLength = 55;
  
  const mockText = 'Practice session '.repeat(Math.ceil(mockTextLength / 16)).substring(0, mockTextLength);
  
  const mockAssessment: AudioAssessmentResult = {
    text: mockText,
    accuracyScore,
    fluencyScore,
    completenessScore,
    pronunciationScore,
    feedback: []
  };
  
  const xpResult = calculateAudioXP(mockAssessment, duration, userLevel);
  return xpResult.totalXP;
}

// 🎤 NOVO: Calcular XP para conversas de voz ao vivo baseado no tempo
export function calculateLiveVoiceXP(
  conversationDurationSeconds: number,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
): AudioXPResult {
  
  const durationMinutes = conversationDurationSeconds / 60;
  
  // 🚀 TAXAS ATUALIZADAS - Mais generosas para incentivar conversas longas
  const baseXPPerMinute = {
    'Novice': 120,      // 120 XP por minuto (2 XP/segundo)
    'Intermediate': 60, // 60 XP por minuto (1 XP/segundo)  
    'Advanced': 30      // 30 XP por minuto (0.5 XP/segundo)
  };
  
  // Calcular XP base
  const baseXP = Math.floor(durationMinutes * baseXPPerMinute[userLevel]);
  
  // Bônus por duração da conversa (mais generosos)
  let durationBonus = 0;
  if (durationMinutes >= 15) durationBonus = 200;     // 15+ minutos - bônus épico
  else if (durationMinutes >= 10) durationBonus = 150; // 10+ minutos - bônus grande
  else if (durationMinutes >= 5) durationBonus = 100;  // 5+ minutos - bônus médio
  else if (durationMinutes >= 2) durationBonus = 50;   // 2+ minutos - bônus pequeno
  
  // Bônus por nível (incentivo para níveis mais altos manterem prática)
  const levelBonus = {
    'Novice': Math.floor(baseXP * 0.1),        // +10% para iniciantes
    'Intermediate': Math.floor(baseXP * 0.15), // +15% para intermediários
    'Advanced': Math.floor(baseXP * 0.25)      // +25% para avançados (maior incentivo)
  };
  
  const bonusXP = durationBonus + levelBonus[userLevel];
  const finalXP = Math.max(10, Math.min(500, baseXP + bonusXP)); // Entre 10-500 XP (limite aumentado)
  
  // Feedback motivador
  const feedback = generateLiveVoiceFeedback(durationMinutes, finalXP, userLevel);
  
  const result: AudioXPResult = {
    xpAwarded: finalXP,
    bonusXP,
    totalXP: finalXP,
    scoreBreakdown: {
      baseXP,
      lengthBonus: durationBonus,
      effortBonus: 0,
      completenessBonus: 0,
      accuracyBonus: 0,
      levelBonus: levelBonus[userLevel]
    },
    feedback,
    shouldRetry: false,
    retryReason: ''
  };
  
  console.log('🎤 Live voice XP calculated (UPDATED RATES):', {
    duration: `${durationMinutes.toFixed(1)} minutes`,
    rate: `${baseXPPerMinute[userLevel]} XP/min`,
    baseXP,
    durationBonus,
    levelBonus: levelBonus[userLevel],
    finalXP,
    userLevel
  });
  
  return result;
}

// 🎤 Feedback para conversas de voz ao vivo
function generateLiveVoiceFeedback(
  durationMinutes: number,
  xpAwarded: number,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced'
): string {
  
  const feedbackTemplates = {
    'Novice': {
      short: [
        "Great start! Every conversation helps you improve. Keep practicing!",
        "Wonderful! You're building confidence in English. Continue the great work!",
        "Excellent effort! Each conversation makes you stronger in English."
      ],
      medium: [
        "Amazing conversation! You're really improving your English fluency. Keep it up!",
        "Fantastic! You spoke for several minutes - that's real progress in English!",
        "Incredible work! Your English conversation skills are getting better every day."
      ],
      long: [
        "Outstanding! You had a long conversation in English - that's incredible progress!",
        "Wow! You're becoming so confident in English. This long conversation shows real improvement!",
        "Exceptional! You're truly developing fluent English conversation skills. Amazing work!"
      ]
    },
    'Intermediate': {
      short: [
        "Good conversation practice! You're developing natural English flow.",
        "Nice work! Your conversational English is becoming more natural.",
        "Well done! You're building stronger English communication skills."
      ],
      medium: [
        "Excellent conversation! You're showing great fluency and confidence in English.",
        "Impressive! Your English conversation skills are really developing well.",
        "Great job! You maintained a good conversation flow in English."
      ],
      long: [
        "Outstanding conversation! You're demonstrating advanced English communication skills.",
        "Exceptional work! Your extended English conversation shows real mastery.",
        "Brilliant! You're achieving natural, fluent English conversation abilities."
      ]
    },
    'Advanced': {
      short: [
        "Solid conversation practice. You're maintaining high-level English communication.",
        "Good work! Your advanced English skills are staying sharp.",
        "Well done! You're demonstrating sophisticated English conversation abilities."
      ],
      medium: [
        "Excellent conversation! Your advanced English fluency is impressive.",
        "Great work! You're showing mastery of complex English communication.",
        "Outstanding! Your sophisticated English conversation skills are excellent."
      ],
      long: [
        "Exceptional conversation! You're demonstrating true English fluency mastery.",
        "Brilliant work! Your extended, sophisticated English conversation is impressive.",
        "Outstanding! You're achieving native-level English conversation fluency."
      ]
    }
  };
  
  let category: 'short' | 'medium' | 'long';
  if (durationMinutes >= 5) category = 'long';
  else if (durationMinutes >= 2) category = 'medium';
  else category = 'short';
  
  const templates = feedbackTemplates[userLevel][category];
  const randomFeedback = templates[Math.floor(Math.random() * templates.length)];
  
  return `${randomFeedback} (+${xpAwarded} XP for ${durationMinutes.toFixed(1)} minutes of conversation)`;
}

export default {
  calculateAudioXP,
  compareWithOldSystem,
  recalculateXPFromScores,
  calculateLiveVoiceXP
};