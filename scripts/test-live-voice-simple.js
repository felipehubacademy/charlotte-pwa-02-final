// scripts/test-live-voice-simple.js
// Teste simples para verificar se live_voice funciona

const { createClient } = require('@supabase/supabase-js');

// Hardcode para teste rápido - substitua pelos seus valores
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_ANON_KEY';

console.log('🧪 Testing live_voice in user_practices table...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLiveVoice() {
  try {
    // Primeiro, vamos ver se há algum registro existente
    console.log('🔍 Checking existing practice types...');
    
    const { data: existing, error: selectError } = await supabase
      .from('user_practices')
      .select('practice_type')
      .limit(5);

    if (selectError) {
      console.log('❌ Error reading table:', selectError.message);
      return;
    }

    console.log('📋 Existing practice types found:', 
      [...new Set(existing.map(r => r.practice_type))]);

    // Agora vamos tentar inserir com live_voice
    console.log('🚀 Attempting to insert with live_voice...');
    
    const testData = {
      user_id: 'test-live-voice-' + Date.now(),
      transcription: 'Test live voice conversation',
      xp_awarded: 120,
      practice_type: 'live_voice',
      audio_duration: 60
    };

    const { data, error } = await supabase
      .from('user_practices')
      .insert(testData)
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      
      if (error.message.includes('session_id')) {
        console.log('💡 Tip: session_id might be required. Let me try with a session...');
        
        // Tentar com session_id
        const testDataWithSession = {
          ...testData,
          session_id: '00000000-0000-0000-0000-000000000000' // UUID nulo para teste
        };

        const { data: data2, error: error2 } = await supabase
          .from('user_practices')
          .insert(testDataWithSession)
          .select();

        if (error2) {
          console.log('❌ Still failed:', error2.message);
        } else {
          console.log('✅ SUCCESS with session_id!');
          console.log('📝 Record created:', data2[0]);
          
          // Limpar
          await supabase
            .from('user_practices')
            .delete()
            .eq('id', data2[0].id);
          console.log('🧹 Test record cleaned up');
        }
      }
    } else {
      console.log('✅ SUCCESS! live_voice works perfectly!');
      console.log('📝 Record created:', data[0]);
      
      // Limpar o registro de teste
      await supabase
        .from('user_practices')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Executar teste
testLiveVoice(); 