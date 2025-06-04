// pages/api/translate.ts
// API route para tradução server-side

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TranslateRequest {
  text: string;
  context?: string;
  userLevel?: string;
}

interface TranslateResponse {
  success: boolean;
  translatedText?: string;
  error?: string;
  cached?: boolean;
}

// Cache simples em memória (em produção, usar Redis)
const translationCache = new Map<string, string>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranslateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { text, context, userLevel }: TranslateRequest = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }

    // Verificar cache primeiro
    const cacheKey = generateCacheKey(text, context);
    const cachedTranslation = translationCache.get(cacheKey);
    
    if (cachedTranslation) {
      console.log('✅ Translation found in server cache');
      return res.status(200).json({
        success: true,
        translatedText: cachedTranslation,
        cached: true
      });
    }

    console.log('🔄 Translating with OpenAI server-side...');

    // Prompt otimizado baseado no nível do usuário
    const levelContext = userLevel === 'Novice' 
      ? 'This is for a beginner English student. Use simple, encouraging Portuguese.'
      : 'This is for an English student. Use natural, fluent Portuguese.';

    const systemPrompt = `You are a professional translator specializing in English-Portuguese translation for language learning contexts.

TRANSLATION GUIDELINES:
- Translate from English to Portuguese (Brazil)
- Maintain the conversational and encouraging tone
- Keep educational context and terminology appropriate
- Preserve formatting (emojis, punctuation, etc.)
- Make the translation natural and fluent in Portuguese
- ${levelContext}

IMPORTANT:
- Only return the Portuguese translation
- Do not add explanations or notes
- Keep the same emotional tone and style
- Maintain any educational encouragement in the message`;

    const userPrompt = context 
      ? `Context: This is a message from Charlotte, an English tutor, to a Brazilian student learning English.

Previous conversation context: ${context}

Text to translate to Portuguese:
"${text}"`
      : `Text to translate to Portuguese:
"${text}"`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ],
      model: "gpt-4.1-nano", // 🔧 OTIMIZADO: Mudança de gpt-4o-mini para gpt-4.1-nano (33% mais barato)
      max_tokens: 500,
      temperature: 0.3,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('Empty translation response');
    }

    // Salvar no cache
    translationCache.set(cacheKey, translatedText);
    
    // Limitar cache a 100 entradas
    if (translationCache.size > 100) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) {
        translationCache.delete(firstKey);
      }
    }

    console.log('✅ Translation completed successfully');
    
    return res.status(200).json({
      success: true,
      translatedText,
      cached: false
    });

  } catch (error) {
    console.error('❌ Translation API error:', error);
    
    // Fallback para tradução básica
    const textToTranslate = (req.body?.text && typeof req.body.text === 'string') ? req.body.text : '';
    const fallbackTranslation = getFallbackTranslation(textToTranslate);
    
    return res.status(200).json({
      success: false,
      translatedText: fallbackTranslation,
      error: error instanceof Error ? error.message : 'Translation failed'
    });
  }
}

function generateCacheKey(text: string, context?: string): string {
  const baseKey = text.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 50);
  const contextKey = context ? context.substring(0, 20) : '';
  return `${baseKey}_${contextKey}`.replace(/\s+/g, '_');
}

function getFallbackTranslation(englishText: string): string {
  // Traduções básicas para frases comuns
  const basicTranslations: { [key: string]: string } = {
    'great job': 'ótimo trabalho',
    'keep practicing': 'continue praticando',
    'well done': 'muito bem',
    'excellent': 'excelente',
    'good work': 'bom trabalho',
    'try again': 'tente novamente',
    'you are doing well': 'você está indo bem',
    'keep it up': 'continue assim',
    'nice work': 'bom trabalho',
    'that is correct': 'isso está correto',
    'perfect': 'perfeito',
    'amazing': 'incrível',
    'thank you': 'obrigado',
    'please': 'por favor',
    'hello': 'olá',
    'goodbye': 'tchau',
    'how are you': 'como você está',
    'i understand': 'eu entendo',
    'very good': 'muito bom'
  };

  // Procurar por traduções básicas
  const lowerText = englishText.toLowerCase();
  for (const [english, portuguese] of Object.entries(basicTranslations)) {
    if (lowerText.includes(english)) {
      return englishText.replace(new RegExp(english, 'gi'), portuguese);
    }
  }

  // Fallback final
  return `[Tradução não disponível no momento. Translation not available at the moment.]`;
} 