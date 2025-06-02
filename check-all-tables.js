// check-all-tables.js
// Script para verificar todas as tabelas e colunas no Supabase local

const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('🔍 Verificando todas as tabelas no Supabase local...\n');
  
  // Lista de tabelas que esperamos encontrar
  const expectedTables = [
    'users',
    'user_progress', 
    'user_sessions',
    'user_practices',
    'user_achievements',
    'user_leaderboard_cache',
    'user_vocabulary',
    'achievements'
  ];
  
  for (const tableName of expectedTables) {
    console.log(`📋 === TABELA: ${tableName.toUpperCase()} ===`);
    
    try {
      // Tentar buscar um registro para ver a estrutura
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Erro ao acessar ${tableName}:`, error.message);
        console.log(`   Código: ${error.code}`);
      } else {
        console.log(`✅ Tabela ${tableName} existe`);
        
        if (data && data.length > 0) {
          console.log(`📊 Colunas (${Object.keys(data[0]).length}):`);
          Object.keys(data[0]).forEach((col, index) => {
            const value = data[0][col];
            const type = value === null ? 'null' : typeof value;
            console.log(`   ${index + 1}. ${col} (${type})`);
          });
          console.log(`📄 Exemplo de dados:`, JSON.stringify(data[0], null, 2));
        } else {
          console.log(`📭 Tabela vazia - tentando inserção de teste para descobrir estrutura...`);
          
          // Tentar inserção mínima para descobrir campos obrigatórios
          let testData = {};
          
          switch (tableName) {
            case 'users':
              testData = { entra_id: 'test-user', name: 'Test User' };
              break;
            case 'user_progress':
              testData = { user_id: 'test-user', total_xp: 0 };
              break;
            case 'user_sessions':
              testData = { user_id: 'test-user', session_date: '2025-01-01' };
              break;
            case 'user_practices':
              testData = { user_id: 'test-user', transcription: 'test', xp_awarded: 0, practice_type: 'test', audio_duration: 0 };
              break;
            case 'user_achievements':
              testData = { user_id: 'test-user', title: 'Test', achievement_name: 'Test' };
              break;
            case 'achievements':
              testData = { achievement_code: 'test', title: 'Test Achievement' };
              break;
            default:
              testData = { id: 'test' };
          }
          
          const { data: insertData, error: insertError } = await supabase
            .from(tableName)
            .insert(testData)
            .select();
          
          if (insertError) {
            console.log(`⚠️ Inserção de teste falhou (normal):`, insertError.message);
            if (insertError.details) {
              console.log(`   Detalhes:`, insertError.details);
            }
          } else {
            console.log(`✅ Inserção de teste bem-sucedida`);
            if (insertData && insertData.length > 0) {
              console.log(`📊 Colunas descobertas (${Object.keys(insertData[0]).length}):`);
              Object.keys(insertData[0]).forEach((col, index) => {
                const value = insertData[0][col];
                const type = value === null ? 'null' : typeof value;
                console.log(`   ${index + 1}. ${col} (${type}) = ${value}`);
              });
            }
            
            // Limpar teste
            await supabase.from(tableName).delete().eq('id', insertData[0].id);
            console.log(`🧹 Teste limpo`);
          }
        }
      }
    } catch (exception) {
      console.log(`❌ Exceção ao verificar ${tableName}:`, exception.message);
    }
    
    console.log(''); // Linha em branco
  }
  
  console.log('🎉 Verificação completa!');
}

checkAllTables(); 