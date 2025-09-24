const fetch = require('node-fetch');

async function testEmails() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testando emails...\n');
  
  // 1. Teste de email de boas-vindas
  console.log('1️⃣ Testando email de boas-vindas...');
  try {
    const response = await fetch(`${baseUrl}/api/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'felipe.xavier1987@gmail.com',
        nome: 'Felipe Xavier',
        nivel: 'Advanced'
      })
    });
    
    const data = await response.json();
    console.log('✅ Resposta:', data);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
  
  console.log('\n2️⃣ Testando email de recuperação de senha...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'felipe.xavier1987@gmail.com'
      })
    });
    
    const data = await response.json();
    console.log('✅ Resposta:', data);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
  
  console.log('\n3️⃣ Testando criação de lead (que envia email de boas-vindas)...');
  try {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: 'Felipe Xavier Teste',
        email: 'felipe.xavier1987@gmail.com',
        telefone: '(11) 99999-9999',
        nivel: 'Advanced',
        senha: '123456',
        confirmarSenha: '123456'
      })
    });
    
    const data = await response.json();
    console.log('✅ Resposta:', data);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testEmails();
