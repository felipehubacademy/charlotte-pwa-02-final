// test-azure-fix.js - Teste rápido do Azure Speech SDK

const fs = require('fs');

async function testAzureFix() {
  console.log('🧪 Testing Azure Speech SDK fix...');
  
  try {
    // Criar um arquivo de áudio fake para teste
    const fakeAudioData = Buffer.from('fake audio data for testing');
    
    const formData = new FormData();
    const audioBlob = new Blob([fakeAudioData], { type: 'audio/webm;codecs=opus' });
    formData.append('audio', audioBlob, 'test.webm');
    
    console.log('📤 Sending test request to pronunciation API...');
    
    const response = await fetch('http://localhost:3001/api/pronunciation', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📥 Response received:');
    console.log('✅ Success:', result.success);
    console.log('🎯 Method:', result.result?.assessmentMethod);
    console.log('📝 Text:', result.result?.text);
    
    if (result.success) {
      console.log('🎉 Azure Speech SDK fix appears to be working!');
    } else {
      console.log('❌ Still having issues:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testAzureFix();
}

module.exports = { testAzureFix }; 