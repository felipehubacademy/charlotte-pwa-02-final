// lib/translation-service.ts
// Serviço de tradução contextual para usuários Novice
// Versão 100% server-side (mais segura)

interface TranslationResult {
  translatedText: string;
  success: boolean;
  error?: string;
  cached?: boolean;
}

interface TranslationCache {
  [key: string]: string;
}

class TranslationService {
  private cache: TranslationCache = {};
  private readonly CACHE_PREFIX = 'charlotte_translation_';

  /**
   * Traduzir texto do inglês para português de forma contextual
   * Usa apenas API server-side (mais segura)
   */
  async translateToPortuguese(
    englishText: string,
    context?: string,
    userLevel?: string
  ): Promise<TranslationResult> {
    try {
      // Verificar cache local primeiro
      const cacheKey = this.generateCacheKey(englishText, context);
      const cachedTranslation = this.getFromCache(cacheKey);
      
      if (cachedTranslation) {
        console.log('✅ Translation found in local cache');
        return {
          translatedText: cachedTranslation,
          success: true,
          cached: true
        };
      }

      // Usar apenas API server-side (segura)
      console.log('🔄 Using secure server-side translation API...');
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: englishText,
          context: context,
          userLevel: userLevel
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.translatedText) {
          // Salvar no cache local se não veio do cache do servidor
          if (!data.cached) {
            this.saveToCache(cacheKey, data.translatedText);
          }
          
          console.log('✅ Server-side translation successful');
          return {
            translatedText: data.translatedText,
            success: true,
            cached: data.cached
          };
        } else {
          console.warn('⚠️ Server-side translation failed, using fallback...');
          return {
            translatedText: this.getFallbackTranslation(englishText),
            success: false,
            error: data.error || 'Server translation failed'
          };
        }
      } else {
        console.warn('⚠️ Server-side API error, using fallback...');
        return {
          translatedText: this.getFallbackTranslation(englishText),
          success: false,
          error: `API error: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Translation service error:', error);
      
      // Fallback final
      const fallbackTranslation = this.getFallbackTranslation(englishText);
      
      return {
        translatedText: fallbackTranslation,
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }

  /**
   * Gerar chave de cache baseada no texto e contexto
   */
  private generateCacheKey(text: string, context?: string): string {
    const baseKey = text.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 50);
    const contextKey = context ? context.substring(0, 20) : '';
    return `${this.CACHE_PREFIX}${baseKey}_${contextKey}`.replace(/\s+/g, '_');
  }

  /**
   * Buscar tradução do cache (localStorage)
   */
  private getFromCache(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Salvar tradução no cache (localStorage)
   */
  private saveToCache(key: string, translation: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, translation);
      
      // Limpar cache antigo (manter apenas 50 traduções)
      this.cleanOldCache();
    } catch (error) {
      console.warn('Cache save error:', error);
    }
  }

  /**
   * Limpar cache antigo para evitar overflow
   */
  private cleanOldCache(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX)
      );
      
      if (keys.length > 50) {
        // Remover as 10 mais antigas
        keys.slice(0, 10).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Tradução de fallback para casos de erro
   * Expandida com mais traduções comuns
   */
  private getFallbackTranslation(englishText: string): string {
    // Traduções básicas para frases comuns da Charlotte
    const basicTranslations: { [key: string]: string } = {
      // Encorajamento básico
      'great job': 'ótimo trabalho',
      'well done': 'muito bem',
      'excellent': 'excelente',
      'perfect': 'perfeito',
      'amazing': 'incrível',
      'fantastic': 'fantástico',
      'wonderful': 'maravilhoso',
      'good work': 'bom trabalho',
      'nice work': 'bom trabalho',
      
      // Instruções de prática
      'keep practicing': 'continue praticando',
      'keep it up': 'continue assim',
      'try again': 'tente novamente',
      'practice more': 'pratique mais',
      'keep going': 'continue',
      
      // Feedback positivo
      'you are doing well': 'você está indo bem',
      'you are improving': 'você está melhorando',
      'that is correct': 'isso está correto',
      'very good': 'muito bom',
      'good job': 'bom trabalho',
      
      // Cumprimentos básicos
      'hello': 'olá',
      'hi': 'oi',
      'goodbye': 'tchau',
      'thank you': 'obrigado',
      'please': 'por favor',
      'you are welcome': 'de nada',
      
      // Perguntas comuns
      'how are you': 'como você está',
      'what is your name': 'qual é o seu nome',
      'how old are you': 'quantos anos você tem',
      
      // Frases de ensino
      'let me help you': 'deixe-me ajudá-lo',
      'i understand': 'eu entendo',
      'can you repeat': 'você pode repetir',
      'speak slowly': 'fale devagar',
      'pronunciation': 'pronúncia',
      'grammar': 'gramática',
      'vocabulary': 'vocabulário'
    };

    // Procurar por traduções básicas (case insensitive)
    const lowerText = englishText.toLowerCase();
    
    for (const [english, portuguese] of Object.entries(basicTranslations)) {
      if (lowerText.includes(english)) {
        // Substituir mantendo a capitalização original
        const regex = new RegExp(english, 'gi');
        const translated = englishText.replace(regex, portuguese);
        
        // Se conseguiu traduzir algo, retornar
        if (translated !== englishText) {
          return translated;
        }
      }
    }

    // Fallback final com mensagem amigável
    return `Desculpe, não consegui traduzir esta mensagem no momento. Sorry, I couldn't translate this message right now. 😊`;
  }

  /**
   * Limpar todo o cache de traduções
   */
  clearCache(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      console.log('🗑️ Translation cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Verificar se o serviço está disponível
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Verificar status da API de tradução
   */
  async checkAPIStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'test',
          userLevel: 'Novice'
        })
      });
      
      return response.ok;
    } catch (error) {
      console.warn('API status check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const translationService = new TranslationService();

// Export types
export type { TranslationResult }; 