// scripts/test-live-voice-enum.js
// Script simples para testar se 'live_voice' funciona no Supabase

const { createClient } = require('@supabase/supabase-js');

// Usar as mesmas variáveis que o Next.js usa
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔍 Testing live_voice enum in Supabase...');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Has Anon Key:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLiveVoiceEnum() {
  try {
    // Tentar inserir um registro de teste com 'live_voice'
    const testData = {
      user_id: 'test-live-voice-enum',
      transcription: 'Test live voice enum',
      xp_awarded: 50,
      practice_type: 'live_voice',
      audio_duration: 60,
      session_id: 'test-session-live-voice'
    };

    console.log('🧪 Attempting to insert test record with live_voice...');
    
    const { data, error } = await supabase
      .from('user_practices')
      .insert(testData)
      .select();

    if (error) {
      if (error.message.includes('invalid input value for enum')) {
        console.log('❌ ENUM ERROR: live_voice is NOT in the practice_type enum');
        console.log('');
        console.log('🔧 SOLUTION: Run this SQL command in Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TYPE practice_type ADD VALUE \'live_voice\';');
        console.log('');
      } else if (error.message.includes('violates foreign key constraint')) {
        console.log('✅ ENUM OK: live_voice is in the enum!');
        console.log('❌ FK ERROR: session_id or user_id constraint failed (expected for test)');
        console.log('');
        console.log('🎉 The live_voice enum value works! You can use it in your app.');
      } else {
        console.log('❓ OTHER ERROR:', error.message);
        console.log('');
        console.log('This might still mean the enum is OK, just other constraints failed.');
      }
    } else {
      console.log('✅ SUCCESS: live_voice enum works perfectly!');
      console.log('📝 Test record created:', data);
      
      // Limpar o registro de teste
      console.log('🧹 Cleaning up test record...');
      await supabase
        .from('user_practices')
        .delete()
        .eq('user_id', 'test-live-voice-enum');
      console.log('✅ Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Executar teste
testLiveVoiceEnum(); 