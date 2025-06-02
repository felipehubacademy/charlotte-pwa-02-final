// debug-achievements.js
// Script para conectar ao Supabase local e verificar estrutura

const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Conectando ao Supabase local...');
  
  try {
    // 1. Verificar estrutura da tabela user_achievements
    console.log('\n📋 Verificando estrutura da tabela user_achievements...');
    
    // Tentar buscar um registro para ver as colunas
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_achievements')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Erro ao buscar estrutura:', sampleError);
    } else {
      if (sampleData && sampleData.length > 0) {
        console.log('✅ Colunas da tabela user_achievements:');
        Object.keys(sampleData[0]).forEach(col => {
          console.log(`  - ${col}`);
        });
        console.log('\n📊 Dados de exemplo:', sampleData[0]);
      } else {
        console.log('📋 Tabela existe mas está vazia. Tentando inserção para descobrir estrutura...');
      }
    }
    
    // 2. Verificar dados existentes
    console.log('\n📊 Verificando dados existentes...');
    const { data: achievements, error: dataError } = await supabase
      .from('user_achievements')
      .select('*')
      .limit(3);
    
    if (dataError) {
      console.error('❌ Erro ao buscar dados:', dataError);
    } else {
      console.log(`✅ Encontrados ${achievements.length} achievements:`);
      achievements.forEach((ach, i) => {
        console.log(`  ${i + 1}. Colunas disponíveis:`, Object.keys(ach));
        console.log(`     Dados:`, ach);
      });
    }
    
    // 3. Testar inserção com UUID válido
    console.log('\n🧪 Testando inserção...');
    const testAchievement = {
      user_id: '550e8400-e29b-41d4-a716-446655440000', // UUID válido
      achievement_type: 'test',
      type: 'test',
      title: 'Test Achievement', // Campo obrigatório
      achievement_name: 'Test Achievement',
      description: 'This is a test achievement', // Campo description
      achievement_description: 'This is a test achievement',
      xp_bonus: 10,
      rarity: 'common',
      earned_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_achievements')
      .insert(testAchievement)
      .select();
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      console.error('❌ Detalhes:', insertError.message);
      console.error('❌ Hint:', insertError.hint);
      
      // Tentar inserção mais simples
      console.log('\n🔄 Tentando inserção mais simples...');
      const simpleTest = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        achievement_name: 'Simple Test',
        achievement_description: 'Simple test achievement'
      };
      
      const { data: simpleData, error: simpleError } = await supabase
        .from('user_achievements')
        .insert(simpleTest)
        .select();
      
      if (simpleError) {
        console.error('❌ Inserção simples também falhou:', simpleError);
        console.log('📋 Campos obrigatórios podem incluir:', simpleError.message);
      } else {
        console.log('✅ Inserção simples bem-sucedida:', simpleData);
        
        // Limpar teste
        await supabase
          .from('user_achievements')
          .delete()
          .eq('user_id', '550e8400-e29b-41d4-a716-446655440000');
        console.log('🧹 Teste limpo');
      }
    } else {
      console.log('✅ Inserção bem-sucedida:', insertData);
      
      // Mostrar estrutura real dos dados inseridos
      if (insertData && insertData.length > 0) {
        console.log('📋 Estrutura real da tabela (baseada na inserção):');
        Object.keys(insertData[0]).forEach(col => {
          console.log(`  - ${col}: ${typeof insertData[0][col]} = ${insertData[0][col]}`);
        });
      }
      
      // Limpar teste
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', '550e8400-e29b-41d4-a716-446655440000');
      console.log('🧹 Teste limpo');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkDatabase(); 