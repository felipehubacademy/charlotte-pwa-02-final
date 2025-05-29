// scripts/check-supabase-enum.js
// Script para verificar e adicionar 'live_voice' ao enum practice_type

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de serviço para operações admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndUpdateEnum() {
  try {
    console.log('🔍 Checking current practice_type enum values...');
    
    // Verificar valores atuais do enum
    const { data, error } = await supabase.rpc('get_enum_values', {
      enum_name: 'practice_type'
    });

    if (error) {
      console.log('⚠️ Could not get enum values directly, trying alternative method...');
      
      // Método alternativo: tentar inserir um registro com 'live_voice'
      const testUserId = 'test-user-enum-check';
      const { error: insertError } = await supabase
        .from('user_practices')
        .insert({
          user_id: testUserId,
          transcription: 'Test for enum check',
          xp_awarded: 0,
          practice_type: 'live_voice',
          audio_duration: 0,
          session_id: 'test-session'
        });

      if (insertError) {
        if (insertError.message.includes('invalid input value for enum')) {
          console.log('❌ live_voice is NOT in the enum. Need to add it.');
          console.log('📝 SQL command to run in Supabase SQL Editor:');
          console.log('');
          console.log('ALTER TYPE practice_type ADD VALUE \'live_voice\';');
          console.log('');
          console.log('🔧 Please run this command in your Supabase SQL Editor.');
        } else {
          console.log('✅ live_voice is already in the enum!');
          console.log('Error was due to other constraint:', insertError.message);
        }
      } else {
        console.log('✅ live_voice is already in the enum!');
        // Limpar o registro de teste
        await supabase
          .from('user_practices')
          .delete()
          .eq('user_id', testUserId);
      }
    } else {
      console.log('📋 Current enum values:', data);
      
      if (data && data.includes('live_voice')) {
        console.log('✅ live_voice is already in the enum!');
      } else {
        console.log('❌ live_voice is NOT in the enum. Need to add it.');
        console.log('📝 SQL command to run in Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TYPE practice_type ADD VALUE \'live_voice\';');
        console.log('');
        console.log('🔧 Please run this command in your Supabase SQL Editor.');
      }
    }

  } catch (error) {
    console.error('❌ Error checking enum:', error);
  }
}

// Executar verificação
checkAndUpdateEnum(); 