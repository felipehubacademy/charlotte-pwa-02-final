// scripts/setup-azure-groups.js
// Script para criar grupos necessários no Azure AD

const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientCredentialAuthProvider } = require('../lib/client-credential-auth-provider');

// Configuração
const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;

if (!clientId || !clientSecret || !tenantId) {
  console.error('❌ Variáveis de ambiente do Microsoft Graph não configuradas');
  process.exit(1);
}

const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
const client = Client.initWithMiddleware({ authProvider });

// Grupos que precisam ser criados
const groupsToCreate = [
  // Grupos para Trials
  {
    displayName: 'Charlotte-Trial-Novice',
    description: 'Usuários trial do Charlotte com nível Novice',
    mailNickname: 'charlotte-trial-novice',
    mailEnabled: false,
    securityEnabled: true,
    groupTypes: []
  },
  {
    displayName: 'Charlotte-Trial-Inter',
    description: 'Usuários trial do Charlotte com nível Intermediário',
    mailNickname: 'charlotte-trial-inter',
    mailEnabled: false,
    securityEnabled: true,
    groupTypes: []
  },
  {
    displayName: 'Charlotte-Trial-Advanced',
    description: 'Usuários trial do Charlotte com nível Advanced',
    mailNickname: 'charlotte-trial-advanced',
    mailEnabled: false,
    securityEnabled: true,
    groupTypes: []
  },
  {
    displayName: 'Charlotte-Trial-Expired',
    description: 'Usuários trial do Charlotte que expiraram',
    mailNickname: 'charlotte-trial-expired',
    mailEnabled: false,
    securityEnabled: true,
    groupTypes: []
  },
];

async function createGroups() {
  console.log('🚀 Iniciando criação de grupos no Azure AD...');
  
  for (const group of groupsToCreate) {
    try {
      // Verificar se grupo já existe
      const existingGroups = await client.api('/groups').filter(`displayName eq '${group.displayName}'`).get();
      
      if (existingGroups.value && existingGroups.value.length > 0) {
        console.log(`✅ Grupo ${group.displayName} já existe`);
        continue;
      }

      // Criar grupo
      const createdGroup = await client.api('/groups').post(group);
      console.log(`✅ Grupo criado: ${group.displayName} (ID: ${createdGroup.id})`);

    } catch (error) {
      console.error(`❌ Erro ao criar grupo ${group.displayName}:`, error.message);
    }
  }

  console.log('🎉 Processo de criação de grupos concluído!');
}

async function listExistingGroups() {
  console.log('📋 Grupos existentes no Azure AD:');
  
  try {
    const response = await client.api('/groups').filter("startswith(displayName, 'Charlotte')").get();
    const groups = response.value || [];
    
    if (groups.length === 0) {
      console.log('   Nenhum grupo do Charlotte encontrado');
    } else {
      groups.forEach(group => {
        console.log(`   - ${group.displayName} (ID: ${group.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao listar grupos:', error.message);
  }
}

async function main() {
  console.log('🔧 Configuração de Grupos Azure AD - Charlotte PWA');
  console.log('================================================');
  
  // Listar grupos existentes
  await listExistingGroups();
  
  console.log('\n');
  
  // Criar grupos necessários
  await createGroups();
  
  console.log('\n');
  
  // Listar grupos após criação
  await listExistingGroups();
}

main().catch(console.error);
