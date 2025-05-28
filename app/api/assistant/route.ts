// app/api/assistant/route.ts - CORRIGIDO para aceitar texto

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Interface atualizada para aceitar pronunciationData opcional
interface AssistantRequest {
  transcription: string;
  pronunciationData?: { // ✅ Agora opcional
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number;
  } | null; // ✅ Pode ser null
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
  userName?: string;
  messageType?: 'text' | 'audio'; // ✅ Novo campo opcional
}

// Interface para resposta
interface AssistantResponse {
  feedback: string;
  nextChallenge?: string;
  tips: string[];
  encouragement: string;
  xpAwarded: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Assistant API: Processing request...');

    // Verificar API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI credentials not configured' },
        { status: 500 }
      );
    }

    const body: AssistantRequest = await request.json();
    const { transcription, pronunciationData, userLevel, userName, messageType } = body;

    console.log('Processing for user:', { userName, userLevel, transcription });
    console.log('Pronunciation scores:', pronunciationData);
    console.log('Message type:', messageType);

    // ✅ VERIFICAR SE É TEXTO OU ÁUDIO
    const isTextMessage = messageType === 'text' || !pronunciationData;

    if (isTextMessage) {
      console.log('🔤 Processing TEXT message...');
      return await handleTextMessage(transcription, userLevel, userName);
    } else {
      console.log('🎤 Processing AUDIO message...');
      return await handleAudioMessage(transcription, pronunciationData, userLevel, userName);
    }

  } catch (error: any) {
    console.error('Assistant API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate feedback', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// ✅ NOVA FUNÇÃO: Processar mensagens de TEXTO
async function handleTextMessage(
  transcription: string, 
  userLevel: string, 
  userName?: string
) {
  const levelInstructions = {
    'Novice': 'Use simple, encouraging English. Be very supportive and include basic vocabulary tips. Can include occasional Portuguese words if truly helpful.',
    'Intermediate': 'Provide clear, business-focused English responses. Give grammar and vocabulary suggestions when relevant.',
    'Advanced': 'Use sophisticated language and provide advanced English learning insights. Focus on professional communication.'
  };

  const systemPrompt = `You are Charlotte, an English conversation tutor from Hub Academy. You're helping ${userName || 'a student'} (${userLevel} level) practice English through text conversation.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

Your role:
- Respond naturally to their message
- Provide encouraging, helpful feedback
- Suggest follow-up practice opportunities
- Be conversational and supportive
- Focus on grammar, vocabulary, and communication skills

Response style: Keep responses friendly, conversational, and around 100-150 words. Always end with an engaging question or suggestion to continue practicing.`;

  const userPrompt = `Student wrote: "${transcription}"

Provide a helpful, encouraging response that:
1. Acknowledges what they said naturally
2. Gives relevant feedback or builds on their message
3. Suggests a follow-up practice activity or asks an engaging question
4. Matches their ${userLevel} proficiency level

Keep the response conversational and engaging.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Text response generated:', assistantResponse.length, 'characters');

    // XP para texto (menor que áudio)
    const xpAwarded = 15;

    const response: AssistantResponse = {
      feedback: assistantResponse,
      xpAwarded,
      nextChallenge: generateTextChallenge(userLevel),
      tips: ['Keep practicing your written English!', 'Try expressing complex ideas in simple words'],
      encouragement: generateTextEncouragement(userLevel)
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('Error in handleTextMessage:', error);
    
    // Fallback para texto
    const fallbackResponse = userLevel === 'Novice' 
      ? `Great job practicing your English writing, ${userName || 'there'}! 😊 Keep it up - every message helps you improve! What would you like to talk about next?`
      : `Thank you for sharing that, ${userName || 'there'}! Your English communication is developing well. I'd love to continue our conversation - what interests you most about English learning?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 15,
        nextChallenge: generateTextChallenge(userLevel),
        tips: ['Keep writing in English!'],
        encouragement: 'Every message makes you better! 💪'
      }
    });
  }
}

// ✅ FUNÇÃO EXISTENTE: Processar mensagens de ÁUDIO (mantida igual)
async function handleAudioMessage(
  transcription: string,
  pronunciationData: any,
  userLevel: string,
  userName?: string
) {
  const levelInstructions = {
    'Novice': 'Be very encouraging and use simple English. Only provide Portuguese explanations if it genuinely helps understanding a pronunciation concept.',
    'Intermediate': 'Provide balanced feedback with specific pronunciation tips. Focus on business English relevance.',
    'Advanced': 'Give detailed, professional feedback. Focus on nuanced pronunciation and advanced vocabulary usage.'
  };

  const systemPrompt = `You are Charlotte, a pronunciation specialist and English tutor from Hub Academy. You provide structured, encouraging feedback on pronunciation practice.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

IMPORTANT: You are analyzing PRONUNCIATION only. Follow this EXACT format:

🎤 I heard: "${transcription}" (use the EXACT transcription text, NO phonetic symbols)
🎉 Score: [score]/100 - [brief encouraging comment]
🔍 What worked well: [1-2 specific pronunciation strengths]
🎯 Areas to improve: [1-2 specific pronunciation issues with clear guidance]
💡 Quick tip: [ONE actionable pronunciation tip]
🎵 Practice phrase: "[suggested phrase for improvement]"

CRITICAL RULES:
- Use the EXACT transcription text in quotes - NO IPA symbols like [ʃʊr, wʌt]
- Maximum 120 words total
- Focus ONLY on pronunciation, rhythm, and clarity
- Be specific about sound issues (like /θ/, /r/, linking, stress)
- NO Portuguese unless absolutely necessary for sound explanation
- NO grammar or vocabulary feedback
- Keep each section to 1-2 bullet points max`;

  const userPrompt = `Student said: "${transcription}"
Pronunciation scores: Overall ${pronunciationData.pronunciationScore}/100, Accuracy ${pronunciationData.accuracyScore}/100, Fluency ${pronunciationData.fluencyScore}/100, Completeness ${pronunciationData.completenessScore}/100

Provide structured pronunciation feedback only.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  const assistantResponse = completion.choices[0]?.message?.content;
  
  if (!assistantResponse) {
    throw new Error('No response from assistant');
  }

  // ✅ ADICIONAR ESTA LIMPEZA:
  let cleanResponse = assistantResponse;

  // Remover símbolos fonéticos comuns se aparecerem
  const phoneticPatterns = [
    /\[.*?\]/g, // Remove [símbolos dentro de colchetes]
    /\/.*?\//g, // Remove /símbolos entre barras/
    /ʃ|ʊ|ʌ|ˈ|ɛ|ʧ|æ|aɪ/g // Remove símbolos IPA específicos
  ];

  phoneticPatterns.forEach(pattern => {
    cleanResponse = cleanResponse.replace(pattern, '');
  });

  // Se ainda contém símbolos estranhos, usar o texto original
  if (cleanResponse.includes('🎤 I heard: ""') || cleanResponse.includes('[') || cleanResponse.includes('ʃ')) {
    console.log('⚠️ Detected phonetic symbols, using fallback response');
    cleanResponse = `🎤 I heard: "${transcription}"
🎉 Score: ${pronunciationData.pronunciationScore}/100 - ${pronunciationData.pronunciationScore >= 80 ? 'Great job!' : 'Good effort!'}
🔍 What worked well: Your English pronunciation is developing well!
🎯 Areas to improve: Keep practicing to build confidence and clarity.
💡 Quick tip: Speak slowly and clearly - you're doing great!`;
  }

  console.log('✅ Audio response generated:', cleanResponse.length, 'characters');

  // Calcular XP baseado nos scores (lógica original)
  let xpAwarded = 25;
  if (pronunciationData.pronunciationScore >= 80) {
    xpAwarded += 50;
  }
  if (pronunciationData.pronunciationScore >= 90) {
    xpAwarded += 25;
  }

  const response: AssistantResponse = {
    feedback: cleanResponse,
    xpAwarded,
    nextChallenge: generateNextChallenge(userLevel, pronunciationData),
    tips: extractTipsFromResponse(cleanResponse),
    encouragement: generateEncouragement(pronunciationData.pronunciationScore)
  };

  return NextResponse.json({ success: true, result: response });
}

// ✅ NOVAS FUNÇÕES para texto
function generateTextChallenge(level: string): string {
  const challenges = {
    'Novice': [
      'Try writing: "Tell me about your favorite hobby"',
      'Practice: "Describe your perfect weekend"',
      'Write about: "What makes you happy?"'
    ],
    'Intermediate': [
      'Challenge: "Explain a recent challenge you overcame"',
      'Practice: "Describe your ideal work environment"',
      'Try: "Give your opinion on remote work"'
    ],
    'Advanced': [
      'Complex topic: "Analyze the impact of AI on education"',
      'Professional: "Draft a proposal for process improvement"',
      'Advanced: "Discuss the pros and cons of globalization"'
    ]
  };

  const levelChallenges = challenges[level as keyof typeof challenges] || challenges['Intermediate'];
  return levelChallenges[Math.floor(Math.random() * levelChallenges.length)];
}

function generateTextEncouragement(level: string): string {
  const encouragements = {
    'Novice': "You're doing great with your English writing! 📝",
    'Intermediate': "Your English communication skills are improving! 💬",
    'Advanced': "Excellent written expression! Keep challenging yourself! 🎯"
  };
  
  return encouragements[level as keyof typeof encouragements] || "Keep up the great work! 💪";
}

// ✅ FUNÇÕES EXISTENTES mantidas iguais
function generateNextChallenge(level: string, scores: any): string {
  const challenges = {
    'Novice': [
      'Try saying: "Hello, nice to meet you!"',
      'Practice: "How was your day today?"',
      'Record: "Thank you very much!"'
    ],
    'Intermediate': [
      'Challenge: "I would like to schedule a meeting"',
      'Practice: "Could you please clarify that point?"',
      'Try: "I appreciate your assistance with this matter"'
    ],
    'Advanced': [
      'Professional phrase: "I\'d like to propose an alternative approach"',
      'Complex sentence: "The implementation timeline seems overly ambitious"',
      'Advanced: "Let\'s circle back on this after we\'ve had time to deliberate"'
    ]
  };

  const levelChallenges = challenges[level as keyof typeof challenges] || challenges['Intermediate'];
  return levelChallenges[Math.floor(Math.random() * levelChallenges.length)];
}

function extractTipsFromResponse(response: string): string[] {
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences
    .filter(sentence => 
      sentence.toLowerCase().includes('tip') || 
      sentence.toLowerCase().includes('try') ||
      sentence.toLowerCase().includes('practice')
    )
    .map(tip => tip.trim())
    .slice(0, 2);
}

function generateEncouragement(score: number): string {
  if (score >= 90) return "Outstanding work! You're speaking like a native! 🌟";
  if (score >= 80) return "Excellent progress! Your English is really improving! 🎉";
  if (score >= 70) return "Great job! Keep up the good work! 👍";
  if (score >= 60) return "Good effort! You're getting better with each practice! 💪";
  return "Keep going! Every practice session makes you stronger! 🌱";
}