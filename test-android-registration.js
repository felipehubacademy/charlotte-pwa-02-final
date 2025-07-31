// Teste de registro Android - Execute no console do Chrome Android
// Acesse Charlotte no Android e execute no DevTools

console.log('🤖 TESTE ANDROID REGISTRATION');

// 1. Verificar se Service Worker está ativo
navigator.serviceWorker.ready.then(registration => {
  console.log('✅ Service Worker ready:', registration);
  
  // 2. Verificar suporte a Push
  if ('PushManager' in window) {
    console.log('✅ Push Manager supported');
    
    // 3. Verificar permissão atual
    console.log('📱 Current permission:', Notification.permission);
    
    // 4. Verificar subscription existente
    return registration.pushManager.getSubscription();
  } else {
    console.log('❌ Push Manager NOT supported');
    return null;
  }
}).then(subscription => {
  if (subscription) {
    console.log('✅ Existing subscription found:');
    console.log('Endpoint:', subscription.endpoint);
    console.log('Keys:', subscription.keys);
  } else {
    console.log('❌ No subscription found');
    
    // 5. Tentar criar subscription
    console.log('🔄 Attempting to create subscription...');
    return navigator.serviceWorker.ready.then(registration => {
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
      
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
    });
  }
}).then(newSubscription => {
  if (newSubscription) {
    console.log('🎉 NEW SUBSCRIPTION CREATED:');
    console.log('Endpoint:', newSubscription.endpoint);
    console.log('Keys:', newSubscription.keys);
    
    // 6. Detectar plataforma
    const platform = /Android/i.test(navigator.userAgent) ? 'android' : 'desktop';
    console.log('📱 Detected platform:', platform);
    
    // 7. Preparar dados para salvar
    const subscriptionData = {
      endpoint: newSubscription.endpoint,
      keys: {
        p256dh: newSubscription.keys.p256dh,
        auth: newSubscription.keys.auth
      },
      platform: platform,
      subscription_type: 'web_push'
    };
    
    console.log('💾 Subscription data to save:', subscriptionData);
    console.log('🔥 COPY THIS DATA TO SAVE MANUALLY IN DATABASE');
    
    return subscriptionData;
  }
}).catch(error => {
  console.error('❌ Error in Android registration test:', error);
});