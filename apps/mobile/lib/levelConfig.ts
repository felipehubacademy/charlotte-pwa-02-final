export type UserLevel = 'Novice' | 'Inter' | 'Advanced';
export type ChatMode = 'grammar' | 'pronunciation' | 'chat';

export interface LevelConfig {
  tabs: ChatMode[];
  language: 'pt' | 'en_with_pt_support' | 'en';
  correctionFrequency: 'all' | 'frequent' | 'subtle';
  tone: 'didactic' | 'encouraging' | 'partner';
  liveEnabled: boolean;
}

export const LEVEL_CONFIG: Record<UserLevel, LevelConfig> = {
  Novice: {
    tabs: ['grammar'],
    language: 'pt',
    correctionFrequency: 'all',
    tone: 'didactic',
    liveEnabled: false,
  },
  Inter: {
    tabs: ['grammar', 'pronunciation', 'chat'],
    language: 'en_with_pt_support',
    correctionFrequency: 'frequent',
    tone: 'encouraging',
    liveEnabled: false,
  },
  Advanced: {
    tabs: ['grammar', 'pronunciation', 'chat'],
    language: 'en',
    correctionFrequency: 'subtle',
    tone: 'partner',
    liveEnabled: true,
  },
};
