'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function NotificationTest() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [checks, setChecks] = useState({
    vapidKeys: false,
    serviceWorker: false,
    pushManager: false,
    notifications: false,
    platform: 'unknown'
  });

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    const results = {
      vapidKeys: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      platform: detectPlatform()
    };

    // Check if service worker is actually registered
    if (results.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log('✅ Service Worker registered:', registration.scope);
        } else {
          console.log('⚠️ Service Worker not registered yet');
        }
      } catch (error) {
        console.log('❌ Service Worker check failed:', error);
      }
    }

    setChecks(results);
    
    const allGood = results.vapidKeys && results.serviceWorker && results.pushManager && results.notifications;
    setStatus(allGood ? 'ready' : 'error');
    
    console.log('🔧 Notification Test Results:', results);
    console.log('🔧 VAPID Public Key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 20) + '...');
    console.log('🔧 Notification Permission:', Notification.permission);
  };

  const detectPlatform = () => {
    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    return 'Desktop';
  };

  const testLocalNotification = async () => {
    try {
      console.log('🧪 Testing local notification...');
      console.log('🔍 Current permission:', Notification.permission);
      console.log('🔍 Platform:', navigator.platform);
      console.log('🔍 User Agent:', navigator.userAgent);
      
      // Check if we're in a PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      console.log('🔍 Is PWA:', isPWA);
      
      if (Notification.permission === 'granted') {
        console.log('✅ Permission granted, creating notification...');
        
        // Try with more specific options for macOS
        const notification = new Notification('🧪 Charlotte Local Test', {
          body: 'Local notification working perfectly!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'charlotte-test-' + Date.now(),
          requireInteraction: true, // Keep notification visible
          silent: false,
          // Add data for debugging
          data: {
            test: true,
            timestamp: new Date().toISOString()
          }
        });
        
        notification.onclick = () => {
          console.log('✅ Local notification clicked');
          window.focus(); // Focus the app
          notification.close();
        };
        
        notification.onshow = () => {
          console.log('✅ Notification shown successfully');
        };
        
        notification.onerror = (error) => {
          console.error('❌ Notification error:', error);
        };
        
        notification.onclose = () => {
          console.log('🔔 Notification closed');
        };
        
        // Don't auto close - let user interact
        console.log('🔔 Notification created, should appear now...');
        
        // Also try using the service worker approach
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              console.log('🔧 Also trying via Service Worker...');
                             await registration.showNotification('🔧 Charlotte SW Test', {
                 body: 'Service Worker notification test',
                 icon: '/icons/icon-192x192.png',
                 badge: '/icons/icon-72x72.png',
                 tag: 'charlotte-sw-test',
                 requireInteraction: true
               });
               console.log('✅ Service Worker notification sent');
             }
           } catch (swError) {
             console.log('ℹ️ Service Worker notification failed (normal):', String(swError));
          }
        }
        
      } else if (Notification.permission !== 'denied') {
        console.log('🔑 Requesting permission...');
        const permission = await Notification.requestPermission();
        console.log('🔑 Permission result:', permission);
        
        if (permission === 'granted') {
          console.log('✅ Permission granted, creating welcome notification...');
          const welcomeNotification = new Notification('🎉 Charlotte Permission Granted!', {
            body: 'You can now receive notifications from Charlotte!',
            icon: '/icons/icon-192x192.png',
            requireInteraction: true
          });
          
          welcomeNotification.onshow = () => {
            console.log('✅ Welcome notification shown');
          };
        } else {
          console.log('❌ Permission denied by user');
          alert('Permission denied. Please enable notifications in browser settings.');
        }
      } else {
        console.log('❌ Notification permission permanently denied');
        alert('Notifications are blocked. Please enable them in browser settings and reload.');
      }
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      alert('Notification failed: ' + String(error));
    }
  };

  const testPushNotification = async () => {
    try {
      console.log('🧪 Testing push notification...');
      
      // Get user ID (mock for now)
      const userId = 'a211b07f-b7b9-4314-a986-184e47fe964f'; // From the logs
      
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, type: 'test' })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Push notification sent:', result);
      } else {
        console.error('❌ Push notification failed:', result);
      }
    } catch (error) {
      console.error('❌ Push notification error:', error);
    }
  };

  const StatusIcon = ({ passed }: { passed: boolean }) => 
    passed ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-white">
      <div className="flex items-center space-x-2 mb-3">
        <Bell className="w-5 h-5" />
        <h3 className="font-medium">Notification System Test</h3>
        {status === 'loading' && <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />}
        {status === 'ready' && <CheckCircle className="w-4 h-4 text-green-500" />}
        {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>VAPID Keys</span>
          <StatusIcon passed={checks.vapidKeys} />
        </div>
        
        <div className="flex items-center justify-between">
          <span>Service Worker</span>
          <StatusIcon passed={checks.serviceWorker} />
        </div>
        
        <div className="flex items-center justify-between">
          <span>Push Manager</span>
          <StatusIcon passed={checks.pushManager} />
        </div>
        
        <div className="flex items-center justify-between">
          <span>Notifications API</span>
          <StatusIcon passed={checks.notifications} />
        </div>
        
        <div className="flex items-center justify-between">
          <span>Platform</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            {checks.platform}
          </span>
        </div>
      </div>

      {status === 'ready' && (
        <div className="mt-4 pt-3 border-t border-white/20 space-y-2">
          <button
            onClick={testLocalNotification}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            Test Local Notification
          </button>
          
          <button
            onClick={testPushNotification}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
          >
            Test Push Notification
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs">
          Some features are missing. Check browser support and environment variables.
        </div>
      )}
    </div>
  );
} 