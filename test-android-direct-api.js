// TESTE DIRETO ANDROID: Via API sem scheduler
// Execute no terminal

// 1. Testar Android direto via ReengagementNotificationService
const testAndroidDirect = async () => {
  console.log('🤖 TESTING ANDROID DIRECT...');
  
  const response = await fetch('https://charlotte.hubacademybr.com/api/notifications/test-direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'ade732ef-433b-4736-a73e-4e9376664ad2',  // Arthur Android
      name: 'Arthur Android Test'
    })
  });
  
  const result = await response.json();
  console.log('📱 Android Direct Result:', result);
  return result;
};

// 2. Testar apenas Web Push para Android
const testAndroidWebPush = async () => {
  console.log('🌐 TESTING ANDROID WEB PUSH...');
  
  // Simular payload Web Push direto para Android
  const response = await fetch('https://charlotte.hubacademybr.com/api/notifications/test-raw-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'ade732ef-433b-4736-a73e-4e9376664ad2',
      title: '🤖 Android Raw Push Test',
      body: 'Testing direct Web Push to Android FCM endpoint',
      custom_data: { test_type: 'android_debug' }
    })
  });
  
  const result = await response.json();
  console.log('📲 Android Web Push Result:', result);
  return result;
};

// Execute ambos
console.log('🔥 ANDROID DEBUG TESTS START');
testAndroidDirect().then(() => testAndroidWebPush());