'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Zap, Trophy, Clock, Users, Target } from 'lucide-react';

export default function ReengagementTest() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);

  const sendReengagementNotification = async (type: string, params: any) => {
    if (!user?.entra_id) {
      setMessage('❌ User not logged in');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/notifications/reengagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.entra_id,
          type,
          ...params
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(`✅ ${type} notification sent successfully!`);
      } else {
        setMessage(`❌ Failed: ${result.message || result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testScheduler = async (taskType?: string) => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/notifications/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: taskType || 'all' }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(`✅ Scheduler task "${taskType || 'all'}" completed!`);
      } else {
        setMessage(`❌ Scheduler failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/notifications/scheduler');
      const result = await response.json();
      setSchedulerStatus(result);
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  };

  const testNotifications = [
    {
      icon: Zap,
      title: '🔥 Streak Reminder',
      description: 'Test streak at risk notification',
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => sendReengagementNotification('streak_reminder', { streakDays: 7 })
    },
    {
      icon: Trophy,
      title: '💪 Weekly Challenge',
      description: 'Test weekly challenge notification',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => sendReengagementNotification('weekly_challenge', { challengeTitle: 'Pronunciation Master' })
    },
    {
      icon: Clock,
      title: '⏰ Practice Reminder',
      description: 'Test time-based practice reminder',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => sendReengagementNotification('practice_reminder', { preferredTime: '09:00' })
    },
    {
      icon: Users,
      title: '👥 Social Invite',
      description: 'Test social competition invite',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => sendReengagementNotification('social_invite', { 
        inviterName: 'Maria', 
        activityType: 'pronunciation challenge' 
      })
    },
    {
      icon: Target,
      title: '🎯 Goal Reminder',
      description: 'Test goal progress notification',
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => sendReengagementNotification('goal_reminder', { 
        goalType: 'weekly XP', 
        progress: 85 
      })
    }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <Zap className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-800">Reengagement Notifications Test</h2>
      </div>

      <div className="mb-4 p-3 bg-indigo-100 border border-indigo-200 rounded-lg">
        <p className="text-sm text-indigo-800">
          <strong>🎯 New Strategy:</strong> Achievements are now shown as in-app cards. 
          Push notifications are for reengagement only!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {testNotifications.map((notification, index) => {
          const IconComponent = notification.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <IconComponent className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-800">{notification.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{notification.description}</p>
              
              <button
                onClick={notification.onClick}
                disabled={isLoading}
                className={`w-full px-3 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${notification.color}`}
              >
                {isLoading ? '⏳ Sending...' : 'Test Notification'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Scheduler Tests */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-800">Scheduler Tests</h3>
          <button
            onClick={getSchedulerStatus}
            className="ml-auto text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded transition-colors"
          >
            Get Status
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => testScheduler('practice_reminders')}
            disabled={isLoading}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded transition-colors disabled:opacity-50"
          >
            Practice
          </button>
          
          <button
            onClick={() => testScheduler('streak_reminders')}
            disabled={isLoading}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded transition-colors disabled:opacity-50"
          >
            Streak
          </button>
          
          <button
            onClick={() => testScheduler('weekly_challenges')}
            disabled={isLoading}
            className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded transition-colors disabled:opacity-50"
          >
            Weekly
          </button>
          
          <button
            onClick={() => testScheduler('goal_reminders')}
            disabled={isLoading}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded transition-colors disabled:opacity-50"
          >
            Goals
          </button>
        </div>
        
        <button
          onClick={() => testScheduler('all')}
          disabled={isLoading}
          className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? '⏳ Running...' : 'Run All Scheduler Tasks'}
        </button>
      </div>

      {/* Scheduler Status */}
      {schedulerStatus && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-800 text-sm font-medium mb-2">📊 Scheduler Status</div>
          <div className="text-gray-700 text-sm space-y-1">
            <div><strong>Status:</strong> {schedulerStatus.status}</div>
            <div><strong>Time:</strong> {new Date(schedulerStatus.currentTime).toLocaleString()}</div>
            {schedulerStatus.nextTasks && (
              <div className="mt-2">
                <div className="text-blue-800 text-sm font-medium">Next Tasks:</div>
                {schedulerStatus.nextTasks.map((task: string, index: number) => (
                  <div key={index} className="text-gray-600 text-sm">• {task}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* User Info */}
      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Note:</strong> Make sure you have FCM notifications enabled and a valid token registered.</p>
        {user?.entra_id && (
          <p>🆔 <strong>Testing with user:</strong> {user.entra_id.substring(0, 8)}...</p>
        )}
        <p>🎨 <strong>Achievement cards:</strong> Check the in-app achievement component for animated celebrations!</p>
      </div>
    </div>
  );
} 