'use client';

import { useState } from 'react';

export default function SimpleNotificationTest() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasicNotification = async () => {
    addLog('🧪 Starting basic notification test...');
    
    try {
      // Check permission first
      addLog(`📋 Current permission: ${Notification.permission}`);
      
      if (Notification.permission === 'default') {
        addLog('🔑 Requesting permission...');
        const permission = await Notification.requestPermission();
        addLog(`📋 Permission result: ${permission}`);
        
        if (permission !== 'granted') {
          addLog('❌ Permission denied');
          return;
        }
      } else if (Notification.permission === 'denied') {
        addLog('❌ Notifications blocked by user');
        return;
      }

      // Create simple notification
      addLog('📱 Creating notification...');
      
      const notification = new Notification('Charlotte Test 🎯', {
        body: 'This is a simple test notification',
        icon: '/icons/icon-192x192.png'
      });

      notification.addEventListener('show', () => {
        addLog('✅ Notification displayed');
      });

      notification.addEventListener('click', () => {
        addLog('👆 Notification clicked');
        notification.close();
      });

      notification.addEventListener('close', () => {
        addLog('❌ Notification closed');
      });

      notification.addEventListener('error', (event) => {
        addLog(`❌ Notification error: ${event}`);
      });

      addLog('📱 Notification created - should appear now!');
      
      // Auto close after 5 seconds
      setTimeout(() => {
        if (notification) {
          addLog('⏰ Auto-closing notification...');
          notification.close();
        }
      }, 5000);

    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const checkNotificationSupport = () => {
    addLog('🔍 Checking notification support...');
    addLog(`📱 Notification API: ${'Notification' in window ? 'YES' : 'NO'}`);
    addLog(`📱 Service Worker: ${'serviceWorker' in navigator ? 'YES' : 'NO'}`);
    addLog(`📱 Platform: ${navigator.platform}`);
    addLog(`📱 User Agent: ${navigator.userAgent}`);
    addLog(`📱 Is PWA: ${window.matchMedia('(display-mode: standalone)').matches ? 'YES' : 'NO'}`);
    addLog(`📱 Permission: ${Notification.permission}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg max-w-2xl">
      <h2 className="text-xl font-bold mb-4">🧪 Simple Notification Test</h2>
      
      <div className="space-y-3 mb-4">
        <button
          onClick={checkNotificationSupport}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
        >
          Check Support
        </button>
        
        <button
          onClick={testBasicNotification}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium"
        >
          Test Basic Notification
        </button>
        
        <button
          onClick={clearLogs}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-black/50 rounded p-3 h-64 overflow-y-auto">
        <h3 className="font-medium mb-2">📋 Test Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm">No logs yet...</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 