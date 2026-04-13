// Full achievements catalog — mirrors DB trigger in 031_fix_award_achievements.sql
// Used by stats.tsx (preview), achievements.tsx (full screen), and DB triggers.

export interface CatalogEntry {
  code:        string;
  title:       string;
  category:    string;
  rarity:      'common' | 'rare' | 'epic' | 'legendary';
  howToEarnPT: string;
  howToEarnEN: string;
  level?:      'Novice' | 'Inter' | 'Advanced'; // undefined = general (all levels)
}

// ── General badges (all levels) ───────────────────────────────────────────────
export const GENERAL_ACHIEVEMENTS: CatalogEntry[] = [
  {
    code: 'first_practice', title: 'Olá, Mundo!', category: 'general', rarity: 'common',
    howToEarnPT: 'Faça sua primeira prática no app.',
    howToEarnEN: 'Complete your first practice in the app.',
  },
  {
    code: 'first_text', title: 'Primeira Conversa', category: 'text', rarity: 'common',
    howToEarnPT: 'Envie sua primeira mensagem de texto para a Charlotte.',
    howToEarnEN: 'Send your first text message to Charlotte.',
  },
  {
    code: 'first_audio', title: 'Primeira Voz', category: 'audio', rarity: 'common',
    howToEarnPT: 'Envie sua primeira mensagem de voz para a Charlotte.',
    howToEarnEN: 'Send your first voice message to Charlotte.',
  },
  {
    code: 'first_grammar', title: 'Gramático Iniciante', category: 'grammar', rarity: 'common',
    howToEarnPT: 'Complete seu primeiro exercício de gramática.',
    howToEarnEN: 'Complete your first grammar exercise.',
  },
  {
    code: 'first_learn', title: 'Na Trilha', category: 'learn', rarity: 'common',
    howToEarnPT: 'Complete seu primeiro tópico na trilha de aprendizado.',
    howToEarnEN: 'Complete your first topic on the learning trail.',
  },
  {
    code: 'practices_10', title: 'Aquecendo', category: 'general', rarity: 'common',
    howToEarnPT: 'Faça 10 práticas no total.',
    howToEarnEN: 'Complete 10 total practices.',
  },
  {
    code: 'practices_50', title: 'No Ritmo', category: 'general', rarity: 'rare',
    howToEarnPT: 'Faça 50 práticas no total.',
    howToEarnEN: 'Complete 50 total practices.',
  },
  {
    code: 'practices_100', title: 'Comprometido', category: 'general', rarity: 'epic',
    howToEarnPT: 'Faça 100 práticas no total.',
    howToEarnEN: 'Complete 100 total practices.',
  },
  {
    code: 'practices_500', title: 'Lenda da Prática', category: 'general', rarity: 'legendary',
    howToEarnPT: 'Faça 500 práticas no total.',
    howToEarnEN: 'Complete 500 total practices.',
  },
  {
    code: 'streak_3', title: 'Consistente', category: 'streak', rarity: 'common',
    howToEarnPT: 'Pratique 3 dias seguidos.',
    howToEarnEN: 'Practice 3 days in a row.',
  },
  {
    code: 'streak_7', title: 'Semana Completa', category: 'streak', rarity: 'rare',
    howToEarnPT: 'Pratique 7 dias seguidos.',
    howToEarnEN: 'Practice 7 days in a row.',
  },
  {
    code: 'streak_14', title: 'Duas Semanas', category: 'streak', rarity: 'epic',
    howToEarnPT: 'Pratique 14 dias seguidos.',
    howToEarnEN: 'Practice 14 days in a row.',
  },
  {
    code: 'streak_30', title: 'Mês de Ouro', category: 'streak', rarity: 'legendary',
    howToEarnPT: 'Pratique 30 dias seguidos.',
    howToEarnEN: 'Practice 30 days in a row.',
  },
  {
    code: 'text_25', title: 'Comunicativo', category: 'text', rarity: 'rare',
    howToEarnPT: 'Envie 25 mensagens de texto para a Charlotte.',
    howToEarnEN: 'Send 25 text messages to Charlotte.',
  },
  {
    code: 'text_100', title: 'Fluente no Chat', category: 'text', rarity: 'epic',
    howToEarnPT: 'Envie 100 mensagens de texto para a Charlotte.',
    howToEarnEN: 'Send 100 text messages to Charlotte.',
  },
  {
    code: 'audio_10', title: 'Falante', category: 'audio', rarity: 'rare',
    howToEarnPT: 'Envie 10 mensagens de voz para a Charlotte.',
    howToEarnEN: 'Send 10 voice messages to Charlotte.',
  },
  {
    code: 'audio_50', title: 'Voz de Ouro', category: 'audio', rarity: 'epic',
    howToEarnPT: 'Envie 50 mensagens de voz para a Charlotte.',
    howToEarnEN: 'Send 50 voice messages to Charlotte.',
  },
  {
    code: 'audio_200', title: 'Locutor Profissional', category: 'audio', rarity: 'legendary',
    howToEarnPT: 'Envie 200 mensagens de voz para a Charlotte.',
    howToEarnEN: 'Send 200 voice messages to Charlotte.',
  },
  {
    code: 'grammar_20', title: 'Gramático Avançado', category: 'grammar', rarity: 'rare',
    howToEarnPT: 'Complete 20 exercícios de gramática.',
    howToEarnEN: 'Complete 20 grammar exercises.',
  },
  {
    code: 'grammar_50', title: 'Mestre da Gramática', category: 'grammar', rarity: 'epic',
    howToEarnPT: 'Complete 50 exercícios de gramática.',
    howToEarnEN: 'Complete 50 grammar exercises.',
  },
  {
    code: 'learn_25', title: 'Trilheiro', category: 'learn', rarity: 'rare',
    howToEarnPT: 'Complete 25 tópicos na trilha de aprendizado.',
    howToEarnEN: 'Complete 25 topics on the learning trail.',
  },
  {
    code: 'learn_100', title: 'Mestre da Trilha', category: 'learn', rarity: 'epic',
    howToEarnPT: 'Complete 100 tópicos na trilha de aprendizado.',
    howToEarnEN: 'Complete 100 topics on the learning trail.',
  },
  {
    code: 'daily_100', title: 'Super Dia', category: 'habit', rarity: 'rare',
    howToEarnPT: 'Ganhe 100 XP em um único dia.',
    howToEarnEN: 'Earn 100 XP in a single day.',
  },
  {
    code: 'daily_200', title: 'Dia Lendário', category: 'habit', rarity: 'epic',
    howToEarnPT: 'Ganhe 200 XP em um único dia.',
    howToEarnEN: 'Earn 200 XP in a single day.',
  },
  {
    code: 'early_bird', title: 'Madrugador', category: 'habit', rarity: 'rare',
    howToEarnPT: 'Pratique antes das 8h da manhã.',
    howToEarnEN: 'Practice before 8am.',
  },
  {
    code: 'night_owl', title: 'Coruja Noturna', category: 'habit', rarity: 'rare',
    howToEarnPT: 'Pratique depois das 22h.',
    howToEarnEN: 'Practice after 10pm.',
  },
];

// ── Level-specific badges ─────────────────────────────────────────────────────
export const LEVEL_ACHIEVEMENTS: CatalogEntry[] = [
  // Novice (PT titles)
  {
    code: 'novice_first_topic', title: 'A Jornada Começa', category: 'learn', rarity: 'common',
    level: 'Novice',
    howToEarnPT: 'Complete o primeiro tópico da trilha Novice.',
    howToEarnEN: 'Complete the first topic on the Novice trail.',
  },
  {
    code: 'novice_halfway', title: 'No Embalo', category: 'learn', rarity: 'rare',
    level: 'Novice',
    howToEarnPT: 'Complete 25 dos 50 tópicos da trilha Novice.',
    howToEarnEN: 'Complete 25 of 50 Novice trail topics.',
  },
  {
    code: 'novice_master', title: 'Mestre do Básico', category: 'learn', rarity: 'epic',
    level: 'Novice',
    howToEarnPT: 'Complete todos os 50 tópicos da trilha Novice.',
    howToEarnEN: 'Complete all 50 Novice trail topics.',
  },
  {
    code: 'novice_promoted', title: 'Passou de Fase!', category: 'general', rarity: 'legendary',
    level: 'Novice',
    howToEarnPT: 'Complete a trilha Novice e atinja 4.000 XP para ser promovido ao nível Inter.',
    howToEarnEN: 'Complete the Novice trail and reach 4,000 XP to be promoted to Inter.',
  },
  // Inter (EN titles)
  {
    code: 'inter_first_topic', title: 'Rising Up', category: 'learn', rarity: 'common',
    level: 'Inter',
    howToEarnPT: 'Complete o primeiro tópico da trilha Inter.',
    howToEarnEN: 'Complete the first topic on the Inter trail.',
  },
  {
    code: 'inter_halfway', title: 'Halfway There', category: 'learn', rarity: 'rare',
    level: 'Inter',
    howToEarnPT: 'Complete 35 dos 70 tópicos da trilha Inter.',
    howToEarnEN: 'Complete 35 of 70 Inter trail topics.',
  },
  {
    code: 'inter_champion', title: 'Inter Champion', category: 'learn', rarity: 'epic',
    level: 'Inter',
    howToEarnPT: 'Complete todos os 70 tópicos da trilha Inter.',
    howToEarnEN: 'Complete all 70 Inter trail topics.',
  },
  {
    code: 'inter_promoted', title: 'Going Advanced', category: 'general', rarity: 'legendary',
    level: 'Inter',
    howToEarnPT: 'Complete a trilha Inter e atinja 9.800 XP para ser promovido ao nível Advanced.',
    howToEarnEN: 'Complete the Inter trail and reach 9,800 XP to be promoted to Advanced.',
  },
  // Advanced (EN titles)
  {
    code: 'advanced_first_topic', title: 'Elite Learner', category: 'learn', rarity: 'common',
    level: 'Advanced',
    howToEarnPT: 'Complete o primeiro tópico da trilha Advanced.',
    howToEarnEN: 'Complete the first topic on the Advanced trail.',
  },
  {
    code: 'advanced_halfway', title: 'Deep End', category: 'learn', rarity: 'rare',
    level: 'Advanced',
    howToEarnPT: 'Complete 20 dos 40 tópicos da trilha Advanced.',
    howToEarnEN: 'Complete 20 of 40 Advanced trail topics.',
  },
  {
    code: 'advanced_master', title: 'Advanced Master', category: 'learn', rarity: 'epic',
    level: 'Advanced',
    howToEarnPT: 'Complete todos os 40 tópicos da trilha Advanced.',
    howToEarnEN: 'Complete all 40 Advanced trail topics.',
  },
  {
    code: 'advanced_fluent', title: 'Fluent', category: 'general', rarity: 'legendary',
    level: 'Advanced',
    howToEarnPT: 'Acumule 20.000 XP no total.',
    howToEarnEN: 'Accumulate 20,000 total XP.',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** All general badges — used in stats.tsx preview fallback pool */
export const ALL_ACHIEVEMENTS = GENERAL_ACHIEVEMENTS;

/** Returns the 30 badges visible to a given user level (26 general + 4 level-specific) */
export function getBadgesForLevel(level: string): CatalogEntry[] {
  return [
    ...GENERAL_ACHIEVEMENTS,
    ...LEVEL_ACHIEVEMENTS.filter(a => a.level === level),
  ];
}
