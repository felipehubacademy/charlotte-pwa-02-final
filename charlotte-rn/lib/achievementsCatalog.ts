// Full achievements catalog — mirrors DB trigger in 031_fix_award_achievements.sql
// Used by both stats.tsx (preview) and achievements.tsx (full screen)

export interface CatalogEntry {
  code:     string;
  title:    string;
  category: string;
  rarity:   'common' | 'rare' | 'epic' | 'legendary';
}

export const ALL_ACHIEVEMENTS: CatalogEntry[] = [
  { code: 'first_practice', title: 'Ola, Mundo!',           category: 'general',  rarity: 'common'    },
  { code: 'first_text',     title: 'Primeira Conversa',     category: 'text',     rarity: 'common'    },
  { code: 'first_audio',    title: 'Primeira Voz',          category: 'audio',    rarity: 'common'    },
  { code: 'first_grammar',  title: 'Gramatico Iniciante',   category: 'grammar',  rarity: 'common'    },
  { code: 'first_learn',    title: 'Na Trilha',             category: 'learn',    rarity: 'common'    },
  { code: 'practices_10',   title: 'Aquecendo',             category: 'general',  rarity: 'common'    },
  { code: 'practices_50',   title: 'No Ritmo',              category: 'general',  rarity: 'rare'      },
  { code: 'practices_100',  title: 'Comprometido',          category: 'general',  rarity: 'epic'      },
  { code: 'practices_500',  title: 'Lenda da Pratica',      category: 'general',  rarity: 'legendary' },
  { code: 'streak_3',       title: 'Consistente',           category: 'streak',   rarity: 'common'    },
  { code: 'streak_7',       title: 'Semana Completa',       category: 'streak',   rarity: 'rare'      },
  { code: 'streak_14',      title: 'Duas Semanas',          category: 'streak',   rarity: 'epic'      },
  { code: 'streak_30',      title: 'Mes de Ouro',           category: 'streak',   rarity: 'legendary' },
  { code: 'text_25',        title: 'Comunicativo',          category: 'text',     rarity: 'rare'      },
  { code: 'text_100',       title: 'Fluente no Chat',       category: 'text',     rarity: 'epic'      },
  { code: 'audio_10',       title: 'Falante',               category: 'audio',    rarity: 'rare'      },
  { code: 'audio_50',       title: 'Voz de Ouro',           category: 'audio',    rarity: 'epic'      },
  { code: 'audio_200',      title: 'Locutor Profissional',  category: 'audio',    rarity: 'legendary' },
  { code: 'grammar_20',     title: 'Gramatico Avancado',    category: 'grammar',  rarity: 'rare'      },
  { code: 'grammar_50',     title: 'Mestre da Gramatica',   category: 'grammar',  rarity: 'epic'      },
  { code: 'learn_25',       title: 'Trilheiro',             category: 'learn',    rarity: 'rare'      },
  { code: 'learn_100',      title: 'Mestre da Trilha',      category: 'learn',    rarity: 'epic'      },
  { code: 'daily_100',      title: 'Super Dia',             category: 'habit',    rarity: 'rare'      },
  { code: 'daily_200',      title: 'Dia Lendario',          category: 'habit',    rarity: 'epic'      },
  { code: 'early_bird',     title: 'Madrugador',            category: 'habit',    rarity: 'rare'      },
  { code: 'night_owl',      title: 'Coruja Noturna',        category: 'habit',    rarity: 'rare'      },
];
