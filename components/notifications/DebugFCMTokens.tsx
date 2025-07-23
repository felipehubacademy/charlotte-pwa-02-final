'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getFCMToken } from '@/lib/firebase-config-optimized';

export default function DebugFCMTokens() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkFCMStatus = async () => {
    if (!user?.entra_id) return;

    setIsLoading(true);
    setDebugInfo(null);

    try {
      console.log('🔍 [DEBUG] Starting FCM debug check...');

      // 1. Verificar se o navegador suporta notificações
      const notificationSupport = 'Notification' in window;
      const permission = notificationSupport ? Notification.permission : 'unsupported';

      // 2. Verificar se há FCM token armazenado
      let fcmToken = null;
      let fcmError = null;
      
      try {
        fcmToken = await getFCMToken();
      } catch (error) {
        fcmError = error instanceof Error ? error.message : String(error);
      }

      // 3. Verificar tokens no banco de dados
      const dbResponse = await fetch('/api/notifications/check-fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.entra_id }),
      });

      const dbResult = await dbResponse.json();

      // 4. Tentar salvar token se conseguimos obter
      let saveResult = null;
      if (fcmToken) {
        try {
          const saveResponse = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: fcmToken,
              keys: { p256dh: 'fcm', auth: 'fcm' }, // Placeholder para FCM
              platform: 'fcm',
              user_id: user.entra_id,
              subscription_type: 'fcm'
            }),
          });
          saveResult = await saveResponse.json();
        } catch (error) {
          saveResult = { error: error instanceof Error ? error.message : String(error) };
        }
      }

      setDebugInfo({
        userId: user.entra_id,
        userLevel: user.user_level,
        browser: {
          notificationSupport,
          permission,
          userAgent: navigator.userAgent.substring(0, 100) + '...'
        },
        fcm: {
          token: fcmToken ? fcmToken.substring(0, 20) + '...' : null,
          tokenLength: fcmToken?.length || 0,
          error: fcmError
        },
        database: {
          hasFCMToken: dbResult.hasFCMToken,
          tokenCount: dbResult.tokenCount,
          error: dbResult.error
        },
        save: saveResult,
        timestamp: new Date().toISOString()
      });

      console.log('🔍 [DEBUG] FCM debug completed:', {
        hasToken: !!fcmToken,
        inDatabase: dbResult.hasFCMToken,
        permission
      });

    } catch (error) {
      console.error('❌ [DEBUG] FCM debug error:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission result:', permission);
      await checkFCMStatus(); // Recheck after permission change
    }
  };

  useEffect(() => {
    if (user?.entra_id) {
      checkFCMStatus();
    }
  }, [user?.entra_id]);

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">🔍 FCM Debug Info</h3>
        <div className="space-x-2">
          <button
            onClick={requestPermission}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
          >
            Request Permission
          </button>
          <button
            onClick={checkFCMStatus}
            disabled={isLoading}
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? '⏳ Checking...' : 'Refresh'}
          </button>
        </div>
      </div>

      {debugInfo && (
        <div className="space-y-3">
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-300 text-sm font-medium mb-2">User Info:</div>
            <div className="text-gray-400 text-xs space-y-1">
              <div>ID: {debugInfo.userId}</div>
              <div>Level: {debugInfo.userLevel}</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-300 text-sm font-medium mb-2">Browser Support:</div>
            <div className="text-gray-400 text-xs space-y-1">
              <div>Notifications: {debugInfo.browser?.notificationSupport ? '✅' : '❌'}</div>
              <div>Permission: <span className={
                debugInfo.browser?.permission === 'granted' ? 'text-green-400' : 
                debugInfo.browser?.permission === 'denied' ? 'text-red-400' : 'text-yellow-400'
              }>
                {debugInfo.browser?.permission}
              </span></div>
              <div>Browser: {debugInfo.browser?.userAgent}</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-300 text-sm font-medium mb-2">FCM Token:</div>
            <div className="text-gray-400 text-xs space-y-1">
              {debugInfo.fcm?.token ? (
                <>
                  <div className="text-green-400">✅ Token: {debugInfo.fcm.token}</div>
                  <div>Length: {debugInfo.fcm.tokenLength}</div>
                </>
              ) : (
                <div className="text-red-400">❌ No token available</div>
              )}
              {debugInfo.fcm?.error && (
                <div className="text-red-400">Error: {debugInfo.fcm.error}</div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-300 text-sm font-medium mb-2">Database:</div>
            <div className="text-gray-400 text-xs space-y-1">
              <div>Has FCM Token: {debugInfo.database?.hasFCMToken ? 
                <span className="text-green-400">✅ Yes</span> : 
                <span className="text-red-400">❌ No</span>
              }</div>
              <div>Token Count: {debugInfo.database?.tokenCount || 0}</div>
              {debugInfo.database?.error && (
                <div className="text-red-400">DB Error: {debugInfo.database.error}</div>
              )}
            </div>
          </div>

          {debugInfo.save && (
            <div className="bg-gray-800 rounded p-3">
              <div className="text-gray-300 text-sm font-medium mb-2">Save Result:</div>
              <div className="text-gray-400 text-xs">
                {debugInfo.save.success ? 
                  <span className="text-green-400">✅ {debugInfo.save.message}</span> :
                  <span className="text-red-400">❌ {debugInfo.save.error}</span>
                }
              </div>
            </div>
          )}

          {debugInfo.error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
              <div className="text-red-400 text-sm">❌ Debug Error:</div>
              <div className="text-red-300 text-xs">{debugInfo.error}</div>
            </div>
          )}

          <div className="text-gray-500 text-xs">
            Last check: {new Date(debugInfo.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4">
          <div className="text-gray-400 text-sm">🔍 Checking FCM status...</div>
        </div>
      )}
    </div>
  );
} 