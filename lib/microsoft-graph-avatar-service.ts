// lib/microsoft-graph-avatar-service.ts
// Serviço para buscar avatars do Microsoft Graph API

interface GraphAvatarResponse {
  avatarUrl: string | null;
  fallbackInitial: string;
  fallbackColor: string;
}

class MicrosoftGraphAvatarService {
  private baseUrl = 'https://graph.microsoft.com/v1.0';
  private accessToken: string | null = null;

  /**
   * Configurar token de acesso (será implementado com autenticação real)
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Obter token de acesso do Microsoft Graph
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/graph/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to get Graph token:', response.status);
        return null;
      }

      const data = await response.json();
      return data.access_token || null;

    } catch (error) {
      console.error('Error getting Graph token:', error);
      return null;
    }
  }

  /**
   * Buscar avatar do usuário via Microsoft Graph
   */
  async getUserAvatar(userId: string, userName?: string): Promise<GraphAvatarResponse> {
    try {
      // 1. Obter token de acesso
      const token = await this.getAccessToken();
      if (token) {
        this.setAccessToken(token);
      }
      
      // 2. Tentar buscar foto do Microsoft Graph
      const photoUrl = await this.fetchUserPhoto(userId);
      
      // 3. Preparar fallback com dados reais
      const fallbackData = this.generateFallback(userName || userId);
      
      return {
        avatarUrl: photoUrl,
        fallbackInitial: fallbackData.initial,
        fallbackColor: fallbackData.color
      };
      
    } catch (error) {
      console.error('Error fetching avatar from Graph:', error);
      
      // Fallback seguro
      const fallbackData = this.generateFallback(userName || userId);
      return {
        avatarUrl: null,
        fallbackInitial: fallbackData.initial,
        fallbackColor: fallbackData.color
      };
    }
  }

  /**
   * Buscar foto do usuário via Graph API
   */
  private async fetchUserPhoto(userId: string): Promise<string | null> {
    if (!this.accessToken) {
      console.warn('No access token available for Graph API');
      return null;
    }

    try {
      // Buscar metadados da foto primeiro
      const metadataResponse = await fetch(`${this.baseUrl}/users/${userId}/photo`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!metadataResponse.ok) {
        console.log('No photo metadata found for user:', userId);
        return null;
      }

      // Buscar a foto real
      const photoResponse = await fetch(`${this.baseUrl}/users/${userId}/photo/$value`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!photoResponse.ok) {
        console.log('No photo data found for user:', userId);
        return null;
      }

      // Converter para blob e depois para data URL
      const photoBlob = await photoResponse.blob();
      const photoDataUrl = await this.blobToDataUrl(photoBlob);
      
      console.log('✅ Successfully fetched avatar from Graph for user:', userId);
      return photoDataUrl;

    } catch (error) {
      console.error('Error fetching photo from Graph API:', error);
      return null;
    }
  }

  /**
   * Converter blob para data URL
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Gerar fallback com inicial e cor
   */
  private generateFallback(name: string): { initial: string; color: string } {
    const cleanName = name || 'Anonymous';
    const initial = cleanName.charAt(0).toUpperCase();
    
    // Cores determinísticas
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const color = colors[Math.abs(hash) % colors.length];
    
    return { initial, color };
  }

  /**
   * Cache de avatars (implementação simples)
   */
  private avatarCache = new Map<string, { url: string | null; timestamp: number }>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Buscar avatar com cache
   */
  async getUserAvatarCached(userId: string, userName?: string): Promise<GraphAvatarResponse> {
    const cacheKey = userId;
    const cached = this.avatarCache.get(cacheKey);
    
    // Verificar se cache é válido
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      const fallbackData = this.generateFallback(userName || userId);
      return {
        avatarUrl: cached.url,
        fallbackInitial: fallbackData.initial,
        fallbackColor: fallbackData.color
      };
    }

    // Buscar novo avatar
    const result = await this.getUserAvatar(userId, userName);
    
    // Salvar no cache
    this.avatarCache.set(cacheKey, {
      url: result.avatarUrl,
      timestamp: Date.now()
    });

    return result;
  }
}

// Singleton
export const graphAvatarService = new MicrosoftGraphAvatarService();

// Tipos para export
export type { GraphAvatarResponse }; 