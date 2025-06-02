// check-real-tables.js
// Script para verificar todas as tabelas que realmente existem no Supabase local

const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealTables() {
  console.log('🔍 Verificando todas as tabelas que realmente existem...\n');
  
  try {
    // Lista de tabelas para testar
    const testTables = [
      'users', 'user_progress', 'user_sessions', 'user_practices', 
      'user_achievements', 'user_leaderboard_cache', 'user_vocabulary',
      'achievements', 'leaderboard'
    ];
    
    console.log('📋 Testando tabelas conhecidas:');
    console.log('===============================');
    
    for (const tableName of testTables) {
      console.log(`\n🔹 Testando: ${tableName}`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Erro: ${error.message}`);
          console.log(`   📋 Código: ${error.code}`);
        } else {
          console.log(`   ✅ Existe e acessível`);
          
          if (data && data.length > 0) {
            console.log(`   📊 ${Object.keys(data[0]).length} colunas: ${Object.keys(data[0]).join(', ')}`);
            console.log(`   📄 Exemplo:`, JSON.stringify(data[0], null, 2));
          } else {
            console.log(`   📭 Tabela vazia`);
            
            // Para tabelas vazias, tentar descobrir estrutura via erro de inserção
            try {
              const { error: insertError } = await supabase
                .from(tableName)
                .insert({})
                .select();
              
              if (insertError) {
                console.log(`   📋 Erro de inserção (revela estrutura): ${insertError.message}`);
                
                // Extrair campos obrigatórios do erro
                const nullConstraintMatch = insertError.message.match(/null value in column "([^"]+)"/);
                if (nullConstraintMatch) {
                  console.log(`   🔴 Campo obrigatório: ${nullConstraintMatch[1]}`);
                }
              }
            } catch (e) {
              console.log(`   ⚠️ Não foi possível testar inserção: ${e.message}`);
            }
          }
        }
      } catch (e) {
        console.log(`   ❌ Exceção: ${e.message}`);
      }
    }
    
    // Verificar especificamente user_vocabulary com variações
    console.log('\n🔍 Verificação específica de user_vocabulary:');
    console.log('================================================');
    
    const vocabularyVariants = [
      'user_vocabulary',
      'uservocabulary', 
      'vocabulary',
      'user_vocab',
      'vocabularies'
    ];
    
    for (const variant of vocabularyVariants) {
      try {
        const { data, error } = await supabase
          .from(variant)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Encontrada: ${variant}`);
          if (data && data.length > 0) {
            console.log(`   📊 Colunas: ${Object.keys(data[0]).join(', ')}`);
            console.log(`   📄 Exemplo:`, JSON.stringify(data[0], null, 2));
          } else {
            console.log(`   📭 Tabela vazia`);
          }
        } else {
          console.log(`❌ ${variant}: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${variant}: ${e.message}`);
      }
    }
    
    console.log('\n🎉 Verificação completa!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRealTables(); 