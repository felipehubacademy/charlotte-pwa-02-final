// 🤖 ANDROID DEBUG SCRIPT
// Execute no Console do Chrome Android (DevTools)

console.log('🤖 ANDROID PWA DEBUG START');

// 1. Verificar Service Worker
navigator.serviceWorker.ready.then(registration => {
  console.log('✅ Service Worker ready:', registration);
  console.log('📍 SW scope:', registration.scope);
  console.log('📄 SW script URL:', registration.active?.scriptURL);
  
  // 2. Verificar Push Subscription
  return registration.pushManager.getSubscription();
}).then(subscription => {
  if (subscription) {
    console.log('✅ Push subscription exists:');
    console.log('🔗 Endpoint:', subscription.endpoint);
    console.log('🔑 Keys:', subscription.keys);
    
    // Verificar se é FCM endpoint (Android)
    if (subscription.endpoint.includes('fcm.googleapis.com')) {
      console.log('🤖 Confirmed: Android FCM endpoint');
    } else {
      console.log('❓ Unexpected endpoint type for Android');
    }
  } else {
    console.log('❌ No push subscription found');
    console.log('🔧 Try to create subscription...');
    
    // Tentar criar subscription
    return navigator.serviceWorker.ready.then(reg => {
      const vapidKey = 'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA';
      
      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }
      
      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
    });
  }
}).then(newSub => {
  if (newSub) {
    console.log('🎉 NEW subscription created:', newSub);
  }
}).catch(error => {
  console.error('❌ Error:', error);
});

// 3. Verificar Notification permission
console.log('🔔 Notification permission:', Notification.permission);

// 4. Verificar se é PWA instalado
console.log('📱 Is PWA installed:', window.matchMedia('(display-mode: standalone)').matches);

// 5. Verificar User Agent
console.log('🤖 User Agent:', navigator.userAgent);

// 6. Teste de notificação local
if (Notification.permission === 'granted') {
  console.log('🧪 Testing local notification...');
  new Notification('Test Local', {
    body: 'Se você vê isso, notificações locais funcionam!',
    icon: '/icons/icon-192x192.png'
  });
} else {
  console.log('❌ Cannot test local notification - permission denied');
}

console.log('🤖 ANDROID DEBUG COMPLETE - Check results above');