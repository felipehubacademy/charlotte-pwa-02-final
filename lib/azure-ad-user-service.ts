// lib/azure-ad-user-service.ts
// Serviço para gerenciar usuários e grupos no Azure AD

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthProvider } from './client-credential-auth-provider';

export interface TrialUser {
  email: string;
  displayName: string;
  nivel: 'Novice' | 'Inter' | 'Advanced';
  leadId: string;
  expirationDate: Date;
}

export interface AzureUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  mail: string;
  accountEnabled: boolean;
  expirationDateTime?: string;
}

export class AzureADUserService {
  private client: Client;
  private tenantId: string;

  constructor() {
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET!;
    this.tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID!;

    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, this.tenantId);
    this.client = Client.initWithMiddleware({ authProvider });
  }

  // Criar usuário trial no Azure AD
  async createTrialUser(
    displayName: string, 
    email: string, 
    nivel: 'Novice' | 'Inter' | 'Advanced',
    password?: string
  ): Promise<AzureUser | null> {
    try {
      console.log('🔧 Criando usuário trial no Azure AD:', email);

      // Dados do usuário
      const userData = {
        accountEnabled: true,
        displayName: displayName,
        mailNickname: email.split('@')[0],
        userPrincipalName: email,
        passwordProfile: {
          forceChangePasswordNextSignIn: false,
          password: password || this.generateTemporaryPassword()
        }
      };

      // Criar usuário
      const createdUser = await this.client.api('/users').post(userData);
      console.log('✅ Usuário trial criado:', createdUser.id);

      // Adicionar ao grupo apropriado
      await this.addUserToTrialGroup(createdUser.id, nivel);

      return {
        id: createdUser.id,
        userPrincipalName: createdUser.userPrincipalName,
        displayName: createdUser.displayName,
        mail: createdUser.mail,
        accountEnabled: createdUser.accountEnabled,
        expirationDateTime: createdUser.expirationDateTime
      };

    } catch (error: any) {
      console.error('❌ Erro ao criar usuário trial:', error);
      return null;
    }
  }

  // Adicionar usuário trial ao grupo apropriado
  async addUserToTrialGroup(userId: string, nivel: 'Novice' | 'Inter' | 'Advanced'): Promise<boolean> {
    try {
      const groupName = `Charlotte-Trial-${nivel}`;
      const groupId = await this.getGroupIdByName(groupName);
      
      if (!groupId) {
        console.error(`❌ Grupo ${groupName} não encontrado`);
        return false;
      }

      await this.client.api(`/groups/${groupId}/members/$ref`).post({
        '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
      });

      console.log(`✅ Usuário trial ${userId} adicionado ao grupo ${groupName}`);
      return true;

    } catch (error: any) {
      // Se o usuário já está no grupo, isso é um sucesso
      if (error.message && error.message.includes('already exist')) {
        console.log(`✅ Usuário trial ${userId} já está no grupo ${groupName}`);
        return true;
      }
      
      console.error('❌ Erro ao adicionar usuário trial ao grupo:', error);
      return false;
    }
  }

  // Remover usuário trial de grupo (quando trial expira)
  async removeUserFromTrialGroup(userId: string, nivel: 'Novice' | 'Inter' | 'Advanced'): Promise<boolean> {
    try {
      const groupName = `Charlotte-Trial-${nivel}`;
      const groupId = await this.getGroupIdByName(groupName);
      
      if (!groupId) {
        console.error(`❌ Grupo ${groupName} não encontrado`);
        return false;
      }

      await this.client.api(`/groups/${groupId}/members/${userId}/$ref`).delete();
      console.log(`✅ Usuário trial ${userId} removido do grupo ${groupName}`);
      return true;

    } catch (error: any) {
      console.error('❌ Erro ao remover usuário trial do grupo:', error);
      return false;
    }
  }

  // Mover usuário trial para grupo de expirados
  async moveUserToExpiredGroup(userId: string): Promise<boolean> {
    try {
      // Remover de todos os grupos de trial
      const trialLevels: ('Novice' | 'Inter' | 'Advanced')[] = ['Novice', 'Inter', 'Advanced'];
      for (const nivel of trialLevels) {
        await this.removeUserFromTrialGroup(userId, nivel);
      }

      // Adicionar ao grupo de expirados
      const expiredGroupId = await this.getGroupIdByName('Charlotte-Trial-Expired');
      if (expiredGroupId) {
        await this.client.api(`/groups/${expiredGroupId}/members/$ref`).post({
          '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
        });
        console.log(`✅ Usuário trial ${userId} movido para grupo de expirados`);
      }

      return true;

    } catch (error: any) {
      console.error('❌ Erro ao mover usuário trial para grupo expirado:', error);
      return false;
    }
  }

  // Desabilitar usuário trial (ao invés de deletar)
  async disableTrialUser(userId: string): Promise<boolean> {
    try {
      await this.client.api(`/users/${userId}`).patch({
        accountEnabled: false
      });

      console.log(`✅ Usuário trial ${userId} desabilitado`);
      return true;

    } catch (error: any) {
      console.error('❌ Erro ao desabilitar usuário trial:', error);
      return false;
    }
  }

  // Obter ID do grupo pelo nome
  private async getGroupIdByName(groupName: string): Promise<string | null> {
    try {
      const response = await this.client.api('/groups').filter(`displayName eq '${groupName}'`).get();
      const groups = response.value || [];
      
      if (groups.length > 0) {
        return groups[0].id;
      }
      
      return null;

    } catch (error: any) {
      console.error(`❌ Erro ao buscar grupo ${groupName}:`, error);
      return null;
    }
  }

  // Gerar senha temporária
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Verificar se usuário existe
  async getUserByEmail(email: string): Promise<AzureUser | null> {
    try {
      const response = await this.client.api(`/users/${email}`).get();
      return {
        id: response.id,
        userPrincipalName: response.userPrincipalName,
        displayName: response.displayName,
        mail: response.mail,
        accountEnabled: response.accountEnabled,
        expirationDateTime: response.expirationDateTime
      };

    } catch (error: any) {
      if (error.statusCode === 404) {
        return null; // Usuário não encontrado
      }
      console.error('❌ Erro ao buscar usuário:', error);
      return null;
    }
  }

  // Listar usuários em grupo específico
  async getUsersInGroup(groupName: string): Promise<AzureUser[]> {
    try {
      const groupId = await this.getGroupIdByName(groupName);
      if (!groupId) {
        return [];
      }

      const response = await this.client.api(`/groups/${groupId}/members`).get();
      const users = response.value || [];
      
      return users.map((user: any) => ({
        id: user.id,
        userPrincipalName: user.userPrincipalName,
        displayName: user.displayName,
        mail: user.mail,
        accountEnabled: user.accountEnabled,
        expirationDateTime: user.expirationDateTime
      }));

    } catch (error: any) {
      console.error(`❌ Erro ao listar usuários do grupo ${groupName}:`, error);
      return [];
    }
  }
}

export default new AzureADUserService();
