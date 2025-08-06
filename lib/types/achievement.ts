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