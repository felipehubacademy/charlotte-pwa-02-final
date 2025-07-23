'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

interface TestAchievement {
  code: string;
  name: string;
  description: string;
  badge_icon: string;
  badge_color: string;
  category: string;
  xp_reward: number;
  rarity: string;
}

export default function AchievementNotificationTest() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testSingleAchievement = async () => {
    if (!user?.entra_id) {
      setMessage('❌ User not logged in');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const testAchievement: TestAchievement = {
        code: 'test-single',
        name: 'Test Achievement',
        description: 'This is a test achievement notification',
        badge_icon: '🎯',
        badge_color: '#FFD700',
        category: 'test',
        xp_reward: 25,
        rarity: 'rare'
      };

      const response = await fetch('/api/notifications/send-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.entra_id,
          notification: {
            title: `${testAchievement.badge_icon} ${testAchievement.name}`,
            body: `${testAchievement.description} (+${testAchievement.xp_reward} XP)`,
            data: {
              type: 'achievement',
              code: testAchievement.code,
              name: testAchievement.name,
              xpReward: testAchievement.xp_reward.toString(),
              rarity: testAchievement.rarity,
              userId: user.entra_id
            }
          }
        }),
      });

      if (response.ok) {
        setMessage('✅ Single achievement notification sent successfully!');
      } else {
        const error = await response.text();
        setMessage(`❌ Failed to send notification: ${error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMultipleAchievements = async () => {
    if (!user?.entra_id) {
      setMessage('❌ User not logged in');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const testAchievements: TestAchievement[] = [
        {
          code: 'test-multi-1',
          name: 'First Achievement',
          description: 'First test achievement',
          badge_icon: '🏆',
          badge_color: '#FFD700',
          category: 'test',
          xp_reward: 10,
          rarity: 'common'
        },
        {
          code: 'test-multi-2',
          name: 'Second Achievement',
          description: 'Second test achievement',
          badge_icon: '⭐',
          badge_color: '#FF6B6B',
          category: 'test',
          xp_reward: 15,
          rarity: 'rare'
        },
        {
          code: 'test-multi-3',
          name: 'Third Achievement',
          description: 'Third test achievement',
          badge_icon: '🎯',
          badge_color: '#4ECDC4',
          category: 'test',
          xp_reward: 20,
          rarity: 'epic'
        }
      ];

      const totalXP = testAchievements.reduce((sum, ach) => sum + ach.xp_reward, 0);

      const response = await fetch('/api/notifications/send-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.entra_id,
          notification: {
            title: `🏆 ${testAchievements.length} New Achievements!`,
            body: `You earned ${totalXP} bonus XP! Keep it up!`,
            data: {
              type: 'multiple_achievements',
              count: testAchievements.length.toString(),
              totalXP: totalXP.toString(),
              userId: user.entra_id
            }
          }
        }),
      });

      if (response.ok) {
        setMessage('✅ Multiple achievements notification sent successfully!');
      } else {
        const error = await response.text();
        setMessage(`❌ Failed to send notification: ${error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🏆 Achievement Notifications Test
      </h3>
      
      <div className="space-y-4">
        <button
          onClick={testSingleAchievement}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ Sending...' : '🎯 Test Single Achievement'}
        </button>

        <button
          onClick={testMultipleAchievements}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ Sending...' : '🏆 Test Multiple Achievements'}
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Note: Make sure you have FCM notifications enabled and a valid token registered.</p>
        {user?.entra_id && (
          <p className="mt-1">🆔 Testing with user: {user.entra_id.substring(0, 8)}...</p>
        )}
      </div>
    </div>
  );
} 