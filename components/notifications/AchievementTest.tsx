'use client';

import { useState } from 'react';
import { Trophy, Star, Zap, BookOpen } from 'lucide-react';
import { Achievement } from '@/lib/improved-audio-xp-service';

interface AchievementTestProps {
  onTriggerAchievements: (achievements: Achievement[]) => void;
  onClearCache?: () => void;
}

export default function AchievementTest({ onTriggerAchievements, onClearCache }: AchievementTestProps) {
  const [isVisible, setIsVisible] = useState(false);

  const clearCacheAndTest = (testFn: () => void) => {
    console.log('🧹 Clearing processed achievement cache for test');
    if (onClearCache) {
      onClearCache();
    }
    // Aguardar um frame antes de executar o teste
    setTimeout(testFn, 10);
  };

  const testSingle = () => {
    console.log('🧪 Testing single achievement...');
    const achievement = {
      id: `test-single-${Date.now()}-${Math.random()}`,
      type: 'test',
      title: 'Test Achievement! 🎯',
      description: 'You successfully tested the achievement system',
      xpBonus: 15,
      rarity: 'rare' as const,
      icon: '🎯',
      earnedAt: new Date()
    };
    onTriggerAchievements([achievement]);
  };

  const testMultiple = () => {
    console.log('🧪 Testing multiple achievements...');
    const timestamp = Date.now();
    const random = Math.random();
    const multipleTests: Achievement[] = [
      {
        id: `test-perfect-${timestamp}-${random}-1`,
        type: 'perfect-practice',
        title: 'Perfect Practice! 🎯',
        description: 'Achieved 95%+ accuracy',
        xpBonus: 10,
        rarity: 'rare' as const,
        icon: '🎯',
        earnedAt: new Date()
      },
      {
        id: `test-eloquent-${timestamp}-${random}-2`,
        type: 'eloquent-speaker',
        title: 'Eloquent Speaker 📝',
        description: 'Spoke a long, detailed sentence',
        xpBonus: 5,
        rarity: 'common' as const,
        icon: '📝',
        earnedAt: new Date()
      },
      {
        id: `test-legendary-${timestamp}-${random}-3`,
        type: 'legendary-test',
        title: 'Legendary Achiever! ⭐',
        description: 'This is a legendary achievement for testing',
        xpBonus: 25,
        rarity: 'legendary' as const,
        icon: '⭐',
        earnedAt: new Date()
      }
    ];
    onTriggerAchievements(multipleTests);
  };

  const testRarities = () => {
    console.log('🧪 Testing different rarities...');
    const timestamp = Date.now();
    const random = Math.random();
    const rarityTests: Achievement[] = [
      {
        id: `test-common-${timestamp}-${random}-1`,
        type: 'test-common',
        title: 'Common Achievement',
        description: 'A common achievement for testing',
        xpBonus: 5,
        rarity: 'common' as const,
        icon: '🟢',
        earnedAt: new Date()
      },
      {
        id: `test-epic-${timestamp}-${random}-2`,
        type: 'test-epic',
        title: 'Epic Achievement! ✨',
        description: 'An epic achievement with particles',
        xpBonus: 20,
        rarity: 'epic' as const,
        icon: '✨',
        earnedAt: new Date()
      }
    ];
    onTriggerAchievements(rarityTests);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-full shadow-lg z-50 transition-all"
        title="Test Achievements"
      >
        <Trophy size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-2xl z-50 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">🧪 Achievement Test</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => clearCacheAndTest(testSingle)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Star size={14} />
          <span>Single Achievement</span>
        </button>

        <button
          onClick={() => clearCacheAndTest(testMultiple)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Zap size={14} />
          <span>Multiple (3x)</span>
        </button>

        <button
          onClick={() => clearCacheAndTest(testRarities)}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-2 px-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <BookOpen size={14} />
          <span>Test Rarities</span>
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        <p>• Test achievement animations</p>
        <p>• Check positioning & timing</p>
        <p>• Verify rarity effects</p>
      </div>
    </div>
  );
} 