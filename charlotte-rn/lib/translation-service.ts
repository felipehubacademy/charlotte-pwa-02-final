// lib/translation-service.ts - Serviço de tradução contextual para usuários Novice (RN)

import Constants from 'expo-constants';

export interface TranslationResult {
  translatedText: string;
  success: boolean;
  error?: string;
  cached?: boolean;
}

function getApiBaseUrl(): string {
  return (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte-pwa-02-final.vercel.app';
}

class TranslationService {
  private cache: Record<string, string> = {};

  private generateCacheKey(text: string, context?: string): string {
    return `${context ?? ''}::${text}`;
  }

  async translateToPortuguese(
    englishText: string,
    context?: string,
    userLevel?: string
  ): Promise<TranslationResult> {
    try {
      const cacheKey = this.generateCacheKey(englishText, context);
      if (this.cache[cacheKey]) {
        return { translatedText: this.cache[cacheKey], success: true, cached: true };
      }

      const response = await fetch(`${getApiBaseUrl()}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: englishText, context, userLevel }),
      });

      const data = await response.json();

      if (!response.ok || !data.translatedText) {
        throw new Error(data.error || 'Translation failed');
      }

      this.cache[cacheKey] = data.translatedText;

      return { translatedText: data.translatedText, success: true };
    } catch (error: any) {
      console.error('❌ Translation failed:', error);
      return {
        translatedText: englishText,
        success: false,
        error: error.message
      };
    }
  }
}

export const translationService = new TranslationService();
