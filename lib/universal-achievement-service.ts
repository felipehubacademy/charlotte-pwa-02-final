/**
 * 🏆 UNIVERSAL ACHIEVEMENT SERVICE
 * Sistema de achievements que funciona para TODOS os tipos de prática
 */

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  xpBonus: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  earnedAt: Date;
}

export interface PracticeData {
  type: 'audio_message' | 'text_message' | 'live_voice' | 'camera_object';
  text: string;
  duration?: number; // Para áudio/live
  accuracy?: number; // Para áudio
  pronunciation?: number; // Para áudio
  grammar?: number; // Para texto
  wordCount?: number; // Para texto
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
  streakDays: number;
  // 🆕 NOVOS CAMPOS PARA ACHIEVEMENTS AVANÇADOS
  totalAudioCount?: number;
  totalTextCount?: number;
  totalLiveCount?: number;
  totalMinutesSpoken?: number;
  consecutivePerfectScores?: number;
  uniqueWordsUsed?: number[];
  topicsDiscussed?: string[];
  sessionLength?: number;
}

/**
 * 🎯 DETECTAR ACHIEVEMENTS UNIVERSAIS
 */
export function detectUniversalAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const { 
    type, text, duration, accuracy, pronunciation, grammar, wordCount, userLevel, streakDays,
    totalAudioCount, totalTextCount, totalLiveCount, totalMinutesSpoken,
    consecutivePerfectScores, uniqueWordsUsed, topicsDiscussed, sessionLength
  } = practiceData;

  // 🏆 ACHIEVEMENTS BÁSICOS (mantidos)
  achievements.push(...getBasicAchievements(practiceData));

  // 📊 ACHIEVEMENTS POR VOLUME/FREQUÊNCIA
  achievements.push(...getVolumeAchievements(practiceData));

  // 📈 ACHIEVEMENTS POR QUALIDADE/PERFORMANCE
  achievements.push(...getQualityAchievements(practiceData));

  // 🕐 ACHIEVEMENTS POR COMPORTAMENTO TEMPORAL
  achievements.push(...getBehaviorAchievements(practiceData));

  // 📝 ACHIEVEMENTS POR CONTEÚDO
  achievements.push(...getContentAchievements(practiceData));

  // 🎮 ACHIEVEMENTS POR DESAFIOS
  achievements.push(...getChallengeAchievements(practiceData));

  // 🎊 ACHIEVEMENTS ESPECIAIS
  achievements.push(...getSpecialAchievements(practiceData));

  // 🎲 SURPRISE ACHIEVEMENTS (1% chance)
  if (Math.random() < 0.01) {
    achievements.push(getSurpriseAchievement());
  }

  return achievements;
}

/**
 * 🏆 ACHIEVEMENTS BÁSICOS (originais)
 */
function getBasicAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const { type, text, duration, accuracy, pronunciation, grammar, userLevel, streakDays } = practiceData;

  // 1. Perfect Practice - baseado no tipo
  if (type === 'audio_message' && accuracy && accuracy > 95) {
    achievements.push(createAchievement('perfect-audio', 'Perfect Audio!', 'Achieved 95%+ accuracy in speech', 10, 'rare', '🎯'));
  } else if (type === 'text_message' && grammar && grammar > 95) {
    achievements.push(createAchievement('perfect-text', 'Perfect Grammar!', 'Achieved 95%+ grammar score', 10, 'rare', '📝'));
  } else if (type === 'live_voice' && duration && duration > 300) { // 5+ minutos
    achievements.push(createAchievement('perfect-conversation', 'Great Conversation!', 'Had a 5+ minute conversation', 15, 'rare', '💬'));
  }

  // 2. Long Content - adaptado por tipo
  if (type === 'audio_message' && text.length > 100) {
    achievements.push(createAchievement('eloquent-speaker', 'Eloquent Speaker', 'Spoke a long, detailed sentence', 5, 'common', '🗣️'));
  } else if (type === 'text_message' && text.length > 200) {
    achievements.push(createAchievement('detailed-writer', 'Detailed Writer', 'Wrote a comprehensive message', 5, 'common', '✍️'));
  } else if (type === 'live_voice' && duration && duration > 600) { // 10+ minutos
    achievements.push(createAchievement('marathon-talker', 'Marathon Talker', 'Conversed for over 10 minutes', 20, 'epic', '🏃‍♂️'));
  }

  // 3. Excellence Achievements
  if (type === 'audio_message' && pronunciation && pronunciation > 90) {
    achievements.push(createAchievement('pronunciation-master', 'Pronunciation Master', 'Excellent pronunciation score', 12, 'rare', '🎤'));
  } else if (type === 'text_message' && grammar && grammar > 90) {
    achievements.push(createAchievement('grammar-guru', 'Grammar Guru', 'Excellent grammar usage', 12, 'rare', '📖'));
  }

  // 4. Streak Milestones (universal)
  if (streakDays > 0 && streakDays % 5 === 0) {
    const rarity = streakDays >= 30 ? 'legendary' : streakDays >= 20 ? 'epic' : 'rare';
    achievements.push(createAchievement(
      `streak-${streakDays}`, 
      `${streakDays}-Day Streak!`, 
      `Practiced for ${streakDays} consecutive days`, 
      streakDays, 
      rarity, 
      '🔥'
    ));
  }

  return achievements;
}

/**
 * 📊 ACHIEVEMENTS POR VOLUME/FREQUÊNCIA
 */
function getVolumeAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const { type, totalAudioCount, totalTextCount, totalLiveCount, totalMinutesSpoken } = practiceData;

  // Audio Volume Milestones
  if (type === 'audio_message' && totalAudioCount) {
    if (totalAudioCount === 5) {
      achievements.push(createAchievement('audio-starter', 'Audio Starter', 'Completed 5 audio messages', 10, 'common', '🎙️'));
    } else if (totalAudioCount === 25) {
      achievements.push(createAchievement('audio-enthusiast', 'Audio Enthusiast', 'Completed 25 audio messages', 25, 'rare', '🎧'));
    } else if (totalAudioCount === 50) {
      achievements.push(createAchievement('audio-master', 'Audio Master', 'Completed 50 audio messages', 50, 'epic', '🎵'));
    } else if (totalAudioCount === 100) {
      achievements.push(createAchievement('audio-legend', 'Audio Legend', 'Completed 100 audio messages', 100, 'legendary', '🏆'));
    }
  }

  // Text Volume Milestones
  if (type === 'text_message' && totalTextCount) {
    if (totalTextCount === 10) {
      achievements.push(createAchievement('text-writer', 'Text Writer', 'Sent 10 text messages', 10, 'common', '✏️'));
    } else if (totalTextCount === 50) {
      achievements.push(createAchievement('text-warrior', 'Text Warrior', 'Sent 50 text messages', 30, 'rare', '⚔️'));
    } else if (totalTextCount === 100) {
      achievements.push(createAchievement('text-champion', 'Text Champion', 'Sent 100 text messages', 60, 'epic', '🏅'));
    } else if (totalTextCount === 250) {
      achievements.push(createAchievement('text-legend', 'Text Legend', 'Sent 250 text messages', 125, 'legendary', '📚'));
    }
  }

  // Live Chat Volume Milestones
  if (type === 'live_voice' && totalLiveCount) {
    if (totalLiveCount === 3) {
      achievements.push(createAchievement('live-beginner', 'Live Beginner', 'Completed 3 live conversations', 15, 'common', '💬'));
    } else if (totalLiveCount === 10) {
      achievements.push(createAchievement('live-conversationalist', 'Live Conversationalist', 'Completed 10 live conversations', 40, 'rare', '🗨️'));
    } else if (totalLiveCount === 20) {
      achievements.push(createAchievement('live-master', 'Live Master', 'Completed 20 live conversations', 80, 'epic', '🎭'));
    }
  }

  // Speaking Time Milestones
  if (totalMinutesSpoken) {
    if (totalMinutesSpoken >= 30) {
      achievements.push(createAchievement('voice-30min', 'Voice Explorer', 'Spoke for 30+ minutes total', 15, 'common', '⏱️'));
    } else if (totalMinutesSpoken >= 120) {
      achievements.push(createAchievement('voice-2hours', 'Voice Enthusiast', 'Spoke for 2+ hours total', 40, 'rare', '🕐'));
    } else if (totalMinutesSpoken >= 300) {
      achievements.push(createAchievement('voice-5hours', 'Voice Master', 'Spoke for 5+ hours total', 100, 'epic', '🕕'));
    }
  }

  return achievements;
}

/**
 * 📈 ACHIEVEMENTS POR QUALIDADE/PERFORMANCE
 */
function getQualityAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const { type, accuracy, grammar, pronunciation, consecutivePerfectScores } = practiceData;

  // Consistency Streaks
  if (consecutivePerfectScores) {
    if (type === 'audio_message' && consecutivePerfectScores >= 5) {
      achievements.push(createAchievement('accuracy-streak-5', 'Accuracy Streak', '5 consecutive audio messages with 85%+ accuracy', 20, 'rare', '🎯'));
    } else if (type === 'text_message' && consecutivePerfectScores >= 5) {
      achievements.push(createAchievement('grammar-streak-5', 'Grammar Streak', '5 consecutive texts with 90%+ grammar', 20, 'rare', '📝'));
    }
    
    if (consecutivePerfectScores >= 10) {
      achievements.push(createAchievement('perfection-streak-10', 'Perfection Streak', '10 consecutive perfect practices', 50, 'epic', '⭐'));
    }
  }

  // High Performance
  if (type === 'audio_message') {
    if (accuracy && accuracy >= 98) {
      achievements.push(createAchievement('near-perfect-audio', 'Near Perfect', '98%+ accuracy in audio', 15, 'rare', '🎯'));
    }
    if (pronunciation && pronunciation >= 95) {
      achievements.push(createAchievement('native-like-pronunciation', 'Native-like', '95%+ pronunciation score', 20, 'epic', '👑'));
    }
  }

  if (type === 'text_message' && grammar && grammar >= 98) {
    achievements.push(createAchievement('grammar-perfectionist', 'Grammar Perfectionist', '98%+ grammar score', 15, 'rare', '📖'));
  }

  return achievements;
}

/**
 * 🕐 ACHIEVEMENTS POR COMPORTAMENTO TEMPORAL
 */
function getBehaviorAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const hour = new Date().getHours();
  const day = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Time-based achievements
  if (hour >= 5 && hour <= 7) {
    achievements.push(createAchievement('early-bird', 'Early Bird', 'Practicing English in the morning!', 5, 'common', '🌅'));
  } else if (hour >= 22 || hour <= 2) {
    achievements.push(createAchievement('night-owl', 'Night Owl', 'Practicing English late at night!', 5, 'common', '🦉'));
  } else if (hour >= 12 && hour <= 14) {
    achievements.push(createAchievement('lunch-learner', 'Lunch Learner', 'Practicing during lunch break!', 5, 'common', '🍽️'));
  }

  // Day-based achievements
  if (day === 1) { // Monday
    achievements.push(createAchievement('monday-motivation', 'Monday Motivation', 'Starting the week with English!', 8, 'common', '💪'));
  } else if (day === 5) { // Friday
    achievements.push(createAchievement('friday-finisher', 'Friday Finisher', 'Ending the week strong!', 8, 'common', '🎉'));
  } else if (day === 0 || day === 6) { // Weekend
    achievements.push(createAchievement('weekend-warrior', 'Weekend Warrior', 'Practicing on the weekend!', 10, 'common', '🏖️'));
  }

  return achievements;
}

/**
 * 📝 ACHIEVEMENTS POR CONTEÚDO
 */
function getContentAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const { text, wordCount, uniqueWordsUsed, topicsDiscussed } = practiceData;

  // Content-based achievements
  if (text.toLowerCase().includes('thank you') || text.toLowerCase().includes('thanks')) {
    achievements.push(createAchievement('polite-learner', 'Polite Learner', 'Using polite expressions!', 3, 'common', '🙏'));
  }

  if (text.toLowerCase().includes('question') || text.includes('?')) {
    achievements.push(createAchievement('curious-mind', 'Curious Mind', 'Asking great questions!', 3, 'common', '❓'));
  }

  // Vocabulary achievements
  if (wordCount && wordCount > 50) {
    achievements.push(createAchievement('word-master', 'Word Master', 'Used 50+ words in one message', 8, 'common', '📚'));
  }

  if (uniqueWordsUsed && uniqueWordsUsed.length >= 100) {
    achievements.push(createAchievement('vocabulary-builder', 'Vocabulary Builder', 'Used 100+ unique words', 25, 'rare', '📖'));
  }

  // Topic diversity
  if (topicsDiscussed && topicsDiscussed.length >= 5) {
    achievements.push(createAchievement('topic-explorer', 'Topic Explorer', 'Discussed 5+ different topics', 20, 'rare', '🗺️'));
  }

  // Complex sentences
  if (text.split(' ').length > 20) {
    achievements.push(createAchievement('sentence-architect', 'Sentence Architect', 'Crafted a 20+ word sentence', 10, 'common', '🏗️'));
  }

  return achievements;
}

/**
 * 🎮 ACHIEVEMENTS POR DESAFIOS
 */
function getChallengeAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const { type, duration, sessionLength, text } = practiceData;

  // Speed challenges
  if (type === 'audio_message' && duration && duration > 60) {
    achievements.push(createAchievement('speed-talker', 'Speed Talker', 'Spoke for over 60 seconds', 10, 'common', '⚡'));
  }

  // Session length challenges
  if (sessionLength) {
    if (sessionLength >= 30) {
      achievements.push(createAchievement('marathon-session-30', 'Marathon Session', '30+ minutes of continuous practice', 25, 'rare', '🏃‍♂️'));
    } else if (sessionLength >= 60) {
      achievements.push(createAchievement('marathon-session-60', 'Ultra Marathon', '60+ minutes of continuous practice', 50, 'epic', '🏃‍♀️'));
    }
  }

  // Complexity challenges
  if (text.length > 300) {
    achievements.push(createAchievement('essay-writer', 'Essay Writer', 'Wrote a 300+ character message', 15, 'rare', '📄'));
  }

  return achievements;
}

/**
 * ⭐ ACHIEVEMENTS ESPECIAIS (mantidos + novos)
 */
function getSpecialAchievements(practiceData: PracticeData): Achievement[] {
  const achievements: Achievement[] = [];
  const { type, text } = practiceData;

  // Multi-modal achievements
  if (type === 'camera_object') {
    achievements.push(createAchievement('visual-learner', 'Visual Learner', 'Learning through images!', 10, 'rare', '📸'));
  }

  // Cultural achievements
  if (text.toLowerCase().includes('brazil') || text.toLowerCase().includes('brasil')) {
    achievements.push(createAchievement('cultural-bridge', 'Cultural Bridge', 'Sharing Brazilian culture!', 8, 'common', '🇧🇷'));
  }

  // Emotion achievements
  const emotionWords = ['happy', 'sad', 'excited', 'nervous', 'proud', 'grateful'];
  if (emotionWords.some(emotion => text.toLowerCase().includes(emotion))) {
    achievements.push(createAchievement('emotion-express', 'Emotion Express', 'Expressing feelings in English!', 5, 'common', '😊'));
  }

  return achievements;
}

/**
 * 🎲 SURPRISE ACHIEVEMENT (expandido)
 */
function getSurpriseAchievement(): Achievement {
  const surpriseAchievements = [
    { id: 'lucky-star', title: 'Lucky Star!', description: 'Fortune smiles upon you', xpBonus: 20, rarity: 'legendary' as const, icon: '⭐' },
    { id: 'golden-moment', title: 'Golden Moment', description: 'Perfect timing bonus', xpBonus: 15, rarity: 'epic' as const, icon: '🌟' },
    { id: 'magic-practice', title: 'Magic Practice', description: 'Something special happened!', xpBonus: 12, rarity: 'epic' as const, icon: '✨' },
    { id: 'rainbow-bonus', title: 'Rainbow Bonus', description: 'Colorful learning experience!', xpBonus: 10, rarity: 'rare' as const, icon: '🌈' },
    { id: 'serendipity', title: 'Serendipity', description: 'A beautiful coincidence!', xpBonus: 18, rarity: 'legendary' as const, icon: '🍀' },
    { id: 'cosmic-alignment', title: 'Cosmic Alignment', description: 'The stars aligned for your practice!', xpBonus: 25, rarity: 'legendary' as const, icon: '🌌' },
  ];

  const randomAchievement = surpriseAchievements[Math.floor(Math.random() * surpriseAchievements.length)];
  
  return createAchievement(
    `${randomAchievement.id}-${Date.now()}`,
    randomAchievement.title,
    randomAchievement.description,
    randomAchievement.xpBonus,
    randomAchievement.rarity,
    randomAchievement.icon
  );
}

/**
 * 🏭 FACTORY FUNCTION PARA CRIAR ACHIEVEMENTS
 */
function createAchievement(
  type: string,
  title: string,
  description: string,
  xpBonus: number,
  rarity: 'common' | 'rare' | 'epic' | 'legendary',
  icon: string
): Achievement {
  return {
    id: `${type}-${Date.now()}`,
    type,
    title,
    description,
    xpBonus,
    rarity,
    icon,
    earnedAt: new Date()
  };
}

/**
 * 🎯 FUNÇÃO PRINCIPAL PARA USAR EM QUALQUER TIPO DE PRÁTICA
 */
export function calculateUniversalAchievements(practiceData: PracticeData): {
  achievements: Achievement[];
  totalBonusXP: number;
} {
  const achievements = detectUniversalAchievements(practiceData);
  const totalBonusXP = achievements.reduce((sum, achievement) => sum + achievement.xpBonus, 0);

  console.log('🏆 Universal achievements calculated:', {
    practiceType: practiceData.type,
    achievementsEarned: achievements.length,
    totalBonusXP,
    achievements: achievements.map(a => ({ type: a.type, title: a.title, xp: a.xpBonus }))
  });

  return { achievements, totalBonusXP };
} 