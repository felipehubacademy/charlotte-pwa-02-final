'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getFCMService } from '@/lib/firebase-messaging-service';
import { CloudIcon, Smartphone, CheckCircle, XCircle } from 'lucide-react';

export default function FCMTest() {
  const { user } = useAuth();
  const [fcmService] = useState(() => getFCMService());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fcmToken, setFCMToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    initializeFCM();
  }, []);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const initializeFCM = async () => {
    try {
      addLog('🔥 Initializing Firebase Cloud Messaging...');
      
      const initialized = await fcmService.initialize();
      
      if (initialized) {
        addLog('✅ FCM Service initialized successfully');
        setStatus('ready');
      } else {
        addLog('❌ FCM Service initialization failed');
        setStatus('error');
      }
    } catch (error) {
      addLog(`❌ FCM initialization error: ${error}`);
      setStatus('error');
    }
  };

  const getFCMToken = async () => {
    if (!user) {
      addLog('❌ User not authenticated');
      return;
    }

    setIsLoading(true);
    addLog('🔑 Getting FCM token...');

    try {
      const token = await fcmService.getToken(user.entra_id);
      
      if (token) {
        setFCMToken(token);
        addLog(`✅ FCM Token received: ${token.substring(0, 20)}...`);
      } else {
        addLog('❌ Failed to get FCM token');
      }
    } catch (error) {
      addLog(`❌ Error getting FCM token: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFCMNotification = async () => {
    if (!user) {
      addLog('❌ User not authenticated');
      return;
    }

    if (!fcmToken) {
      addLog('❌ No FCM token available - get token first');
      return;
    }

    setIsLoading(true);
    addLog('🧪 Testing FCM notification via server...');

    try {
      const response = await fetch('/api/notifications/fcm-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.entra_id, 
          type: 'fcm_test' 
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        addLog('✅ FCM notification sent successfully!');
        addLog('📱 Check for notification on your device...');
      } else {
        addLog(`❌ FCM notification failed: ${result.message || result.error}`);
      }
    } catch (error) {
      addLog(`❌ FCM test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const StatusIcon = ({ status: iconStatus }: { status: 'loading' | 'ready' | 'error' }) => {
    if (iconStatus === 'loading') return <CloudIcon className="w-4 h-4 text-yellow-500 animate-pulse" />;
    if (iconStatus === 'ready') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 text-gray-800">
      <div className="flex items-center space-x-2 mb-3">
        <CloudIcon className="w-5 h-5 text-orange-600" />
        <h3 className="font-medium">Firebase Cloud Messaging Test</h3>
        <StatusIcon status={status} />
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
          FCM not available. Check Firebase configuration and environment variables.
        </div>
      )}

      {status === 'ready' && (
        <div className="space-y-3">
          {/* FCM Token Status */}
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-orange-600" />
              <div>
                <div className="font-medium text-sm">FCM Token</div>
                <div className="text-xs text-gray-600">
                  {fcmToken ? 'Token acquired' : 'No token'}
                </div>
              </div>
            </div>
            <button
              onClick={getFCMToken}
              disabled={isLoading}
              className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Getting...' : 'Get Token'}
            </button>
          </div>

          {/* Test Notification */}
          {fcmToken && (
            <div className="p-3 bg-white rounded border">
              <h4 className="font-medium text-sm mb-2">Test Real FCM Notification</h4>
              <button
                onClick={testFCMNotification}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send FCM Test'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">📋 FCM Logs</h4>
          <button
            onClick={clearLogs}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        
        <div className="bg-gray-900 text-green-400 rounded p-3 h-32 overflow-y-auto text-xs font-mono">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 