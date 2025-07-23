'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TestFCMSending() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testFCMDirect = async () => {
    if (!user?.entra_id) return;

    setIsLoading(true);
    setLastResult(null);

    try {
      console.log('🧪 [FCM SEND TEST] Testing Firebase Admin sending...');

      const response = await fetch('/api/notifications/fcm-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.entra_id,
          type: 'direct_test'
        }),
      });

      const result = await response.json();

      setLastResult({
        success: response.ok && result.success,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString()
      });

      console.log('🧪 [FCM SEND TEST] Result:', result);

    } catch (error) {
      console.error('❌ [FCM SEND TEST] Error:', error);
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testReengagementDirect = async () => {
    if (!user?.entra_id) return;

    setIsLoading(true);
    setLastResult(null);

    try {
      console.log('🧪 [REENGAGEMENT TEST] Testing reengagement service...');

      const response = await fetch('/api/notifications/reengagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.entra_id,
          type: 'practice_reminder'
        }),
      });

      const result = await response.json();

      setLastResult({
        success: response.ok && result.success,
        status: response.status,
        data: result,
        timestamp: new Date().toISOString()
      });

      console.log('🧪 [REENGAGEMENT TEST] Result:', result);

    } catch (error) {
      console.error('❌ [REENGAGEMENT TEST] Error:', error);
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 max-w-md mx-auto">
      <h3 className="text-yellow-400 font-medium mb-3">🧪 FCM Server Test</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testFCMDirect}
          disabled={isLoading}
          className="w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {isLoading ? '⏳ Testing...' : 'Test Firebase Admin Direct'}
        </button>
        
        <button
          onClick={testReengagementDirect}
          disabled={isLoading}
          className="w-full text-sm bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {isLoading ? '⏳ Testing...' : 'Test Reengagement Service'}
        </button>
      </div>

      {lastResult && (
        <div className={`p-3 rounded text-sm ${
          lastResult.success 
            ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
            : 'bg-red-900/20 border border-red-500/30 text-red-400'
        }`}>
          <div className="font-medium mb-2">
            {lastResult.success ? '✅ Success' : '❌ Failed'}
            {lastResult.status && ` (${lastResult.status})`}
          </div>
          
          {lastResult.data && (
            <div className="text-xs space-y-1">
              {lastResult.data.message && (
                <div>Message: {lastResult.data.message}</div>
              )}
              {lastResult.data.error && (
                <div>Error: {lastResult.data.error}</div>
              )}
              {lastResult.data.details && (
                <div>Details: {lastResult.data.details}</div>
              )}
              {lastResult.data.service && (
                <div>Service: {lastResult.data.service}</div>
              )}
            </div>
          )}
          
          {lastResult.error && (
            <div className="text-xs">Error: {lastResult.error}</div>
          )}
          
          <div className="text-xs opacity-75 mt-2">
            {new Date(lastResult.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      <div className="text-yellow-600 text-xs mt-3">
        💡 Este teste verifica se o Firebase Admin consegue enviar notificações para o seu FCM token.
      </div>
    </div>
  );
} 