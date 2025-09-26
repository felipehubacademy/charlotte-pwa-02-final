// lib/client-credential-auth-provider.ts
// Provedor de autenticação para Microsoft Graph usando Client Credentials

import { AuthenticationProvider, AuthenticationProviderOptions } from '@microsoft/microsoft-graph-client';

export class ClientCredentialAuthProvider implements AuthenticationProvider {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientId: string, clientSecret: string, tenantId: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tenantId = tenantId;
  }

  async getAccessToken(authenticationProviderOptions?: AuthenticationProviderOptions): Promise<string> {
    // Verificar se o token ainda é válido
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Obter novo token
    return await this.getNewAccessToken();
  }

  private async getNewAccessToken(): Promise<string> {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token request failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      
      this.accessToken = tokenData.access_token;
      // Definir expiração com margem de segurança (5 minutos antes)
      this.tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000;

      console.log('✅ Novo token de acesso obtido via Client Credentials');
      return this.accessToken;

    } catch (error: any) {
      console.error('❌ Erro ao obter token de acesso:', error);
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }
}

