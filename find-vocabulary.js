// find-vocabulary.js
// Script específico para encontrar a tabela user_vocabulary

const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findVocabularyTable() {
  console.log('🔍 Procurando especificamente por user_vocabulary...\n');
  
  // Tentar diferentes variações e schemas
  const variations = [
    'user_vocabulary',
    'public.user_vocabulary',
    'auth.user_vocabulary',
    'storage.user_vocabulary',
    'uservocabulary',
    'vocabulary',
    'user_vocab'
  ];
  
  for (const tableName of variations) {
    console.log(`🔹 Testando: ${tableName}`);
    
    try {
      // Tentar SELECT direto
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   📡 Status HTTP: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ENCONTRADA! ${tableName}`);
        console.log(`   📊 Dados:`, data);
        
        if (data.length > 0) {
          console.log(`   📋 Colunas: ${Object.keys(data[0]).join(', ')}`);
        } else {
          console.log(`   📭 Tabela vazia`);
        }
        
        return tableName; // Encontrou!
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Erro HTTP: ${errorText}`);
      }
    } catch (e) {
      console.log(`   ❌ Exceção: ${e.message}`);
    }
  }
  
  // Tentar via Supabase client também
  console.log('\n🔄 Tentando via Supabase client...');
  
  for (const tableName of ['user_vocabulary', 'vocabulary', 'user_vocab']) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ ENCONTRADA via client: ${tableName}`);
        console.log(`📊 Dados:`, data);
        return tableName;
      } else {
        console.log(`❌ ${tableName}: ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ ${tableName}: ${e.message}`);
    }
  }
  
  console.log('\n❌ Não foi possível encontrar user_vocabulary');
  return null;
}

findVocabularyTable(); 