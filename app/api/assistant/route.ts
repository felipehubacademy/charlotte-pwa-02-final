// app/api/assistant/route.ts - ATUALIZADO com Sistema de Contexto Conversacional

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { grammarAnalysisService } from '@/lib/grammar-analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Interface atualizada para aceitar contexto conversacional e imagens
interface AssistantRequest {
  transcription: string;
  pronunciationData?: {
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number;
  } | null;
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
  userName?: string;
  messageType?: 'text' | 'audio' | 'image'; // 🆕 Adicionado suporte para imagens
  conversationContext?: string; // 🆕 Contexto da conversa
  imageData?: string; // 🆕 Dados da imagem em base64
}

// ✅ Interface atualizada para incluir dados de gramática
interface AssistantResponse {
  feedback: string;
  nextChallenge?: string;
  tips: string[];
  encouragement: string;
  xpAwarded: number;
  // 🆕 Novos campos para gramática
  grammarScore?: number;
  grammarErrors?: number;
  textComplexity?: string;
  technicalFeedback: string;
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
    const { transcription, pronunciationData, userLevel, userName, messageType, conversationContext, imageData } = body;

    console.log('Processing for user:', { userName: userName ? 'user-***' : 'unknown', userLevel, hasTranscription: !!transcription });
    console.log('Pronunciation scores:', pronunciationData);
    console.log('Message type:', messageType);
    console.log('Has conversation context:', !!conversationContext);
    console.log('Has image data:', !!imageData);

    // ✅ VERIFICAR TIPO DE MENSAGEM
    if (messageType === 'image' && imageData) {
      console.log('📸 Processing IMAGE message with vocabulary analysis...');
      return await handleImageMessage(transcription, imageData, userLevel, userName, conversationContext);
    } else if (messageType === 'text' || !pronunciationData) {
      console.log('🔤 Processing TEXT message with GRAMMAR ANALYSIS...');
      return await handleTextMessageWithGrammar(transcription, userLevel, userName, conversationContext);
    } else {
      console.log('🎤 Processing AUDIO message...');
      return await handleAudioMessage(transcription, pronunciationData, userLevel, userName, conversationContext);
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

// 🆕 NOVA FUNÇÃO: Processar mensagens de TEXTO com ANÁLISE DE GRAMÁTICA e CONTEXTO
async function handleTextMessageWithGrammar(
  transcription: string, 
  userLevel: 'Novice' | 'Intermediate' | 'Advanced', 
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('🔍 Starting text message processing for level:', userLevel);

    // 🎯 NOVICE SPECIAL HANDLING: Usar lógica simplificada e encorajadora
    if (userLevel === 'Novice') {
      console.log('👶 Using Novice-specific text handling...');
      return await handleNoviceTextMessage(transcription, userName, conversationContext);
    }

    // Para Inter/Advanced: usar análise completa de gramática
    console.log('🔍 Starting comprehensive grammar analysis with context...');

    // 1. 🎯 ANÁLISE COMPLETA DE GRAMÁTICA
    const grammarResult = await grammarAnalysisService.analyzeText(
      transcription, 
      userLevel, 
      userName
    );

    console.log('📊 Grammar analysis completed:', {
      score: grammarResult.analysis.overallScore,
      errors: grammarResult.analysis.errors.length,
      xp: grammarResult.xpAwarded,
      complexity: grammarResult.analysis.complexity
    });

    // 2. 🎨 COMBINAR FEEDBACK DE GRAMÁTICA COM RESPOSTA CONVERSACIONAL CONTEXTUALIZADA
    const combinedFeedback = await generateContextualFeedback(
      transcription,
      grammarResult,
      userLevel,
      userName,
      conversationContext
    );

    // 3. 📈 PREPARAR RESPOSTA COMPLETA
    const response: AssistantResponse = {
      feedback: combinedFeedback,
      xpAwarded: grammarResult.xpAwarded,
      nextChallenge: grammarResult.nextChallenge,
      tips: grammarResult.analysis.suggestions.slice(0, 2),
      encouragement: grammarResult.encouragement,
      // 🆕 Dados de gramática para o frontend
      grammarScore: grammarResult.analysis.overallScore,
      grammarErrors: grammarResult.analysis.errors.length,
      textComplexity: grammarResult.analysis.complexity,
      technicalFeedback: ''
    };

    console.log('✅ Text with grammar analysis and context response ready');
    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleTextMessageWithGrammar:', error);
    
    // 🆘 Fallback para análise simples
    return await handleTextMessageSimple(transcription, userLevel, userName, conversationContext);
  }
}

// 🎨 Combinar feedback de gramática com resposta conversacional CONTEXTUALIZADA
async function generateContextualFeedback(
  originalText: string,
  grammarResult: any,
  userLevel: string,
  userName?: string,
  conversationContext?: string
): Promise<string> {
  
  const levelInstructions = {
    'Novice': 'Use simple, clear English only. Be very encouraging about grammar mistakes. Speak slowly and use basic vocabulary to help beginners understand.',
    'Intermediate': 'Provide clear feedback. Balance grammar correction with conversational response. Focus on practical improvements.',
    'Advanced': 'Give sophisticated feedback. Integrate grammar analysis naturally into professional conversation.'
  };

  const systemPrompt = `You are Charlotte, an English tutor. Create a natural, conversational response that seamlessly integrates grammar feedback while maintaining conversation flow.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

${conversationContext ? `\n${conversationContext}\n` : ''}

IMPORTANT CONVERSATION RULES:
- Use the conversation context to avoid repetitive greetings
- Build naturally on previous topics and messages
- Don't say "Hi Felipe" or "Hey Felipe" if you've already greeted recently
- Reference previous conversation when relevant
- Keep the conversation flowing naturally
- Integrate grammar feedback smoothly, not as a separate lesson

Create a response that:
1. Responds naturally to their message content (considering conversation history)
2. Smoothly incorporates grammar feedback when relevant
3. Maintains an encouraging, conversational tone
4. Provides actionable suggestions
5. Continues the conversation naturally based on context

Keep it natural - don't make it feel like a formal grammar lesson. Make it feel like a helpful friend giving tips while having a real conversation.`;

  const userPrompt = `Student wrote: "${originalText}"

Grammar Analysis Results:
- Overall Grammar Score: ${grammarResult.analysis.overallScore}/100
- Errors Found: ${grammarResult.analysis.errors.length}
- Main Strengths: ${grammarResult.analysis.strengths.join(', ')}
- Key Issues: ${grammarResult.analysis.errors.slice(0, 2).map((e: any) => `${e.type}: "${e.original}" → "${e.correction}"`).join(', ')}
- Text Complexity: ${grammarResult.analysis.complexity}

Student name: ${userName || 'there'}

Create a natural, conversational response that acknowledges their message and smoothly incorporates helpful grammar feedback. Use the conversation context to maintain natural flow and avoid repetitive patterns.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      // Fallback: usar apenas o feedback de gramática
      return grammarResult.feedback;
    }

    return response;

  } catch (error) {
    console.error('Error generating contextual feedback:', error);
    
    // Fallback: usar apenas o feedback de gramática
    return grammarResult.feedback;
  }
}

// 🎯 NOVA FUNÇÃO: Processar mensagens de texto específicas para NOVICE
async function handleNoviceTextMessage(
  transcription: string,
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('👶 Processing Novice text message with simple, encouraging approach...');

    const systemPrompt = `You are Charlotte, a warm and genuine friend helping someone practice English.

BE NATURAL AND HUMAN:
- React genuinely to what they say - show real interest
- Vary your responses naturally (don't always start with "Nice!")
- Use natural conversation starters: "Oh!", "Wow!", "Cool!", "Really?", "That's great!", "I see!"
- Don't copy their exact words back to them
- Be curious about their life and experiences

CONVERSATION STYLE:
- Listen to what they actually said and respond to it specifically
- Ask follow-up questions that show you're paying attention
- Share brief, relatable responses when appropriate
- Keep the conversation flowing naturally
- When they make small mistakes, naturally model the correct way without being obvious about it

${conversationContext ? `\n${conversationContext}\n` : ''}

VOCABULARY: Use simple, natural words:
- Reactions: oh, wow, cool, great, nice, fun, good, awesome, really, that's cool, sounds good, interesting
- Questions: what, where, how, why, do you, are you, can you, which, when
- Common words: like, love, want, need, go, come, see, do, make, have, get, work, play, eat, live, think, feel, visit, enjoy, beautiful, small, big

EXAMPLES OF NATURAL RESPONSES:
- "Oh cool! What kind of work do you do?"
- "That sounds fun! Where did you go?"
- "Wow, really? How was that?"
- "I see! Do you like doing that?"

NATURAL CORRECTIONS (when they make mistakes):
- They say "it are beautiful" → You say "Oh, it sounds beautiful! What makes it so special?"
- They say "I like to the church" → You say "Cool! What do you like about the church?"
- They say "I goed there" → You say "Nice! When did you go there?"

AVOID being robotic:
- Don't always start with "Nice!"
- Don't repeat their exact words back
- Don't give the same type of response every time
- Don't ignore what they actually said

Remember: Be a real friend having a genuine conversation. Show interest in their life!`;

    const userPrompt = `Student wrote: "${transcription}"

Respond like a genuine friend who is really listening:

1. React naturally to what they specifically said (don't just say "Nice!")
2. Show genuine interest in their message
3. If they made a small mistake, naturally model the correct way in your response (don't repeat their mistake)
4. Ask a follow-up question that shows you were paying attention
5. Keep it short and conversational (2 sentences max)

IMPORTANT: 
- Don't copy their exact words back to them
- Vary your response style - be unpredictable and natural
- React to the actual content of their message
- End with a question mark (?) for questions, period (.) for statements`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 80, // Mais flexível para respostas naturais
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Novice text response generated:', assistantResponse.length, 'characters');

    // 🔧 PUNCTUATION VALIDATION: Corrigir pontuação se necessário
    let correctedResponse = assistantResponse.trim();
    
    // 🎯 NOVICE: Verificar se tem pergunta natural (não forçar mais)
    if (!correctedResponse.includes('?')) {
      console.log('⚠️ [NOVICE] Response without question - should be naturally generated');
    }
    
    // 🔧 CORREÇÃO DE PONTUAÇÃO PARA MÚLTIPLAS FRASES
    // Dividir em frases e corrigir pontuação de cada uma
    const sentences = correctedResponse.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    const correctedSentences = sentences.map((sentence, index) => {
      let trimmed = sentence.trim();
      
      // Detectar se é pergunta
      const lowerText = trimmed.toLowerCase();
      const questionStarters = ["what", "where", "when", "who", "how", "why", "do", "does", "did", "is", "are", "can", "could", "would", "will", "should", "have", "has", "had"];
      const firstWord = lowerText.split(" ")[0];
      const isQuestion = questionStarters.includes(firstWord) || 
                        lowerText.includes("do you") || 
                        lowerText.includes("are you") ||
                        lowerText.includes("can you");
      
      // Aplicar pontuação correta
      if (isQuestion) {
        if (!trimmed.endsWith("?")) {
          trimmed = trimmed.replace(/[.!]*$/, "") + "?";
          console.log('🔧 [PUNCTUATION] Fixed question:', trimmed);
        }
      } else {
        if (!trimmed.match(/[.!?]$/)) {
          trimmed += ".";
          console.log('🔧 [PUNCTUATION] Added period:', trimmed);
        }
      }
      
      return trimmed;
    });
    
    correctedResponse = correctedSentences.join(" ");

                const response: AssistantResponse = {
        feedback: correctedResponse,
        xpAwarded: 5, // XP baixo mas consistente para Novice
        nextChallenge: '', // Novice não precisa de challenge separado
      tips: ['Keep writing in English!'],
      encouragement: 'You\'re doing great! 😊',
      technicalFeedback: ''
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleNoviceTextMessage:', error);
    
    // Fallback ultra-simples para Novice
    const fallbackResponse = `Great job, ${userName || 'there'}! Keep writing in English. What do you like to do?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 5,
        nextChallenge: '', // Novice não precisa de challenge separado
        tips: ['Keep practicing!'],
        encouragement: 'You\'re doing well! 😊',
        technicalFeedback: ''
      }
    });
  }
}

// 🎯 NOVA FUNÇÃO: Processar mensagens de áudio específicas para NOVICE
async function handleNoviceAudioMessage(
  transcription: string,
  pronunciationData: any,
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('👶 Processing Novice audio message with natural, encouraging approach...');

    const systemPrompt = `You are Charlotte, a warm and genuine friend helping someone practice English pronunciation.

BE NATURAL AND HUMAN:
- React genuinely to what they said - show real interest
- Vary your responses naturally (don't always start with "Nice!")
- Use natural conversation starters: "Oh!", "Wow!", "Cool!", "Really?", "That's great!", "I see!"
- Don't copy their exact words back to them
- Be curious about their life and experiences

CONVERSATION STYLE:
- Listen to what they actually said and respond to it specifically
- Ask follow-up questions that show you're paying attention
- Share brief, relatable responses when appropriate
- Keep the conversation flowing naturally
- When they make small mistakes, naturally model the correct way without being obvious about it

${conversationContext ? `\n${conversationContext}\n` : ''}

VOCABULARY: Use simple, natural words:
- Reactions: oh, wow, cool, great, nice, fun, good, awesome, really, that's cool, sounds good, interesting
- Questions: what, where, how, why, do you, are you, can you, which, when
- Common words: like, love, want, need, go, come, see, do, make, have, get, work, play, eat, live, think, feel, visit, enjoy, beautiful, small, big

EXAMPLES OF NATURAL RESPONSES:
- "Oh cool! What kind of work do you do?"
- "That sounds fun! Where did you go?"
- "Wow, really? How was that?"
- "I see! Do you like doing that?"

NATURAL CORRECTIONS (when they make mistakes):
- They say "it are beautiful" → You say "Oh, it sounds beautiful! What makes it so special?"
- They say "I like to the church" → You say "Cool! What do you like about the church?"
- They say "I goed there" → You say "Nice! When did you go there?"

AVOID being robotic:
- Don't always start with "Nice!"
- Don't repeat their exact words back
- Don't give the same type of response every time
- Don't ignore what they actually said

Remember: Be a real friend having a genuine conversation. Show interest in their life!`;

    const userPrompt = `Student said: "${transcription}"

Their pronunciation score: ${pronunciationData.pronunciationScore}/100

Respond like a genuine friend who is really listening:

1. React naturally to what they specifically said (don't just say "Nice!")
2. Show genuine interest in their message
3. If they made a small mistake, naturally model the correct way in your response (don't repeat their mistake)
4. Ask a follow-up question that shows you were paying attention
5. Keep it short and conversational (2 sentences max)
6. Don't mention pronunciation scores - just have a natural conversation

IMPORTANT: 
- Don't copy their exact words back to them
- Vary your response style - be unpredictable and natural
- React to the actual content of their message
- End with a question mark (?) for questions, period (.) for statements`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 80, // Mais flexível para respostas naturais
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Novice audio response generated:', assistantResponse.length, 'characters');

    // 🔧 PUNCTUATION VALIDATION: Corrigir pontuação se necessário
    let correctedResponse = assistantResponse.trim();
    
    // 🔧 CORREÇÃO DE PONTUAÇÃO PARA MÚLTIPLAS FRASES
    // Dividir em frases e corrigir pontuação de cada uma
    const sentences = correctedResponse.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    const correctedSentences = sentences.map((sentence, index) => {
      let trimmed = sentence.trim();
      
      // Detectar se é pergunta
      const lowerText = trimmed.toLowerCase();
      const questionStarters = ["what", "where", "when", "who", "how", "why", "do", "does", "did", "is", "are", "can", "could", "would", "will", "should", "have", "has", "had"];
      const firstWord = lowerText.split(" ")[0];
      const isQuestion = questionStarters.includes(firstWord) || 
                        lowerText.includes("do you") || 
                        lowerText.includes("are you") ||
                        lowerText.includes("can you");
      
      // Aplicar pontuação correta
      if (isQuestion) {
        if (!trimmed.endsWith("?")) {
          trimmed = trimmed.replace(/[.!]*$/, "") + "?";
          console.log('🔧 [PUNCTUATION] Fixed question:', trimmed);
        }
      } else {
        if (!trimmed.match(/[.!?]$/)) {
          trimmed += ".";
          console.log('🔧 [PUNCTUATION] Added period:', trimmed);
        }
      }
      
      return trimmed;
    });
    
    correctedResponse = correctedSentences.join(" ");

    // Calcular XP baseado nos scores (lógica original)
    let xpAwarded = 25;
    if (pronunciationData.pronunciationScore >= 80) {
      xpAwarded += 50;
    }
    if (pronunciationData.pronunciationScore >= 90) {
      xpAwarded += 25;
    }

    const response: AssistantResponse = {
      feedback: correctedResponse,
      xpAwarded,
      nextChallenge: '', // Novice não precisa de challenge separado
      tips: ['Keep speaking in English!'],
      encouragement: 'You\'re doing great! 😊',
      technicalFeedback: '' // Novice não tem feedback técnico
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleNoviceAudioMessage:', error);
    
    // Fallback ultra-simples para Novice
    const fallbackResponse = `Great job, ${userName || 'there'}! Your pronunciation sounds good. What do you like to do?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 25,
        nextChallenge: '', // Novice não precisa de challenge separado
        tips: ['Keep practicing!'],
        encouragement: 'You\'re doing well! 😊',
        technicalFeedback: '' // Novice não tem feedback técnico
      }
    });
  }
}

// 🔄 Função de fallback para texto simples (caso a análise de gramática falhe)
async function handleTextMessageSimple(
  transcription: string, 
  userLevel: string, 
  userName?: string,
  conversationContext?: string
) {
  console.log('⚠️ Using simple text fallback with context...');

  const levelInstructions = {
    'Novice': 'Use simple, encouraging English only. Be very supportive and include basic vocabulary tips. Focus on building confidence with clear, slow speech.',
    'Intermediate': 'Provide clear, business-focused English responses. Give grammar and vocabulary suggestions when relevant.',
    'Advanced': 'Use sophisticated language and provide advanced English learning insights. Focus on professional communication.'
  };

  const systemPrompt = `You are Charlotte, an English conversation tutor from Hub Academy. You're helping ${userName || 'a student'} (${userLevel} level) practice English through text conversation.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

${conversationContext ? `\n${conversationContext}\n` : ''}

IMPORTANT CONVERSATION RULES:
- Use the conversation context to maintain natural flow
- Don't repeat greetings if you've already greeted recently
- Build on previous topics and messages
- Keep responses conversational and engaging
- Reference conversation history when relevant

Your role:
- Respond naturally to their message (considering conversation history)
- Provide encouraging, helpful feedback
- Suggest follow-up practice opportunities
- Be conversational and supportive
- Focus on grammar, vocabulary, and communication skills

Response style: Keep responses friendly, conversational, and around 100-150 words. Continue the conversation naturally based on context.`;

  const userPrompt = `Student wrote: "${transcription}"

Provide a helpful, encouraging response that:
1. Acknowledges what they said naturally (considering conversation history)
2. Gives relevant feedback or builds on their message
3. Suggests a follow-up practice activity or asks an engaging question
4. Matches their ${userLevel} proficiency level
5. Uses conversation context to maintain natural flow

Keep the response conversational and engaging, avoiding repetitive patterns.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
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

    console.log('✅ Simple text response with context generated:', assistantResponse.length, 'characters');

    const response: AssistantResponse = {
      feedback: assistantResponse,
      xpAwarded: 8, // 🎯 REBALANCEADO: XP reduzido para fallback (era 15)
      nextChallenge: generateTextChallenge(userLevel),
      tips: ['Keep practicing your written English!', 'Try expressing complex ideas in simple words'],
      encouragement: generateTextEncouragement(userLevel),
      technicalFeedback: ''
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('Error in handleTextMessageSimple:', error);
    
    // Fallback final
    const fallbackResponse = userLevel === 'Novice' 
      ? `Great job practicing your English writing, ${userName || 'there'}! 😊 Keep it up - every message helps you improve! What would you like to talk about next?`
      : `Thank you for sharing that, ${userName || 'there'}! Your English communication is developing well. I'd love to continue our conversation - what interests you most about English learning?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 8, // 🎯 REBALANCEADO: XP reduzido para fallback final (era 15)
        nextChallenge: generateTextChallenge(userLevel),
        tips: ['Keep writing in English!'],
        encouragement: 'Every message makes you better! 💪',
        technicalFeedback: ''
      }
    });
  }
}

// ✅ FUNÇÃO EXISTENTE: Processar mensagens de ÁUDIO (atualizada com contexto conversacional)
async function handleAudioMessage(
  transcription: string,
  pronunciationData: any,
  userLevel: string,
  userName?: string,
  conversationContext?: string
) {
  // 🎯 NOVICE SPECIAL HANDLING: Usar lógica simplificada e natural como no texto
  if (userLevel === 'Novice') {
    console.log('👶 Using Novice-specific audio handling...');
    return await handleNoviceAudioMessage(transcription, pronunciationData, userName, conversationContext);
  }

  const levelInstructions = {
    'Intermediate': 'Provide clear, practical feedback like a professional coach. Focus on business English and communication effectiveness.',
    'Advanced': 'Give sophisticated feedback like an expert coach. Focus on nuanced pronunciation and professional communication.'
  };

  const systemPrompt = `You are Charlotte, a friendly English pronunciation coach. You're having a natural conversation while providing helpful pronunciation guidance.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

${conversationContext ? `\n${conversationContext}\n` : ''}

IMPORTANT CONVERSATION RULES:
- Respond naturally to what they said, like a real conversation
- DON'T use the format "🎤 I heard: ..." - that's too formal
- DON'T repeat their exact words unless necessary for correction
- Integrate pronunciation feedback smoothly into natural conversation
- Be encouraging and supportive like a coach
- Reference conversation context when relevant
- Keep the conversation flowing naturally

PRONUNCIATION COACHING APPROACH:
- Acknowledge what they said conversationally
- Give encouraging feedback about their pronunciation naturally
- Mention 1-2 specific pronunciation strengths
- Gently suggest 1 area for improvement if needed
- Ask a follow-up question or continue the conversation topic
- Keep it conversational, not like a formal lesson

Response style: Natural conversation (100-150 words) that includes pronunciation coaching seamlessly integrated. Be encouraging and keep the conversation flowing.`;

  const userPrompt = `Student said: "${transcription}"

Pronunciation Assessment:
- Overall Score: ${pronunciationData.pronunciationScore}/100
- Accuracy: ${pronunciationData.accuracyScore}/100  
- Fluency: ${pronunciationData.fluencyScore}/100
- Completeness: ${pronunciationData.completenessScore}/100

Create a natural, conversational response that:
1. Responds to what they said (considering conversation context)
2. Smoothly integrates encouraging pronunciation feedback
3. Mentions what they did well with their speech
4. Gently suggests improvement if needed (but keep it positive)
5. Continues the conversation naturally with a question or comment
6. Feels like talking to a supportive coach, not a formal teacher

Keep it natural and conversational - avoid formal assessment language.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
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

    console.log('✅ Audio response with conversational context generated:', assistantResponse.length, 'characters');

    // Calcular XP baseado nos scores (lógica original)
    let xpAwarded = 25;
    if (pronunciationData.pronunciationScore >= 80) {
      xpAwarded += 50;
    }
    if (pronunciationData.pronunciationScore >= 90) {
      xpAwarded += 25;
    }

    // 🆕 Gerar feedback técnico separado para o botão "Feedback"
    const technicalFeedback = generateTechnicalFeedback(pronunciationData, userLevel);

    const response: AssistantResponse = {
      feedback: assistantResponse,
      xpAwarded,
      nextChallenge: generateNextChallenge(userLevel, pronunciationData),
      tips: extractTipsFromResponse(assistantResponse),
      encouragement: generateEncouragement(pronunciationData.pronunciationScore),
      // 🆕 Feedback técnico separado
      technicalFeedback: technicalFeedback
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('Error generating conversational audio feedback:', error);
    
    // Fallback conversacional
    const fallbackResponse = `Nice work on your pronunciation, ${userName || 'there'}! Your speaking skills are developing well. I appreciate the effort you're putting into practicing. What else would you like to discuss?`;

    const technicalFeedback = generateTechnicalFeedback(pronunciationData, userLevel);

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 25,
        nextChallenge: generateNextChallenge(userLevel, pronunciationData),
        tips: ['Keep practicing your pronunciation!'],
        encouragement: 'Every practice session makes you stronger! 🌱',
        technicalFeedback: technicalFeedback
      }
    });
  }
}

// 🆕 Gerar feedback técnico DETALHADO usando dados ocultos do Azure
function generateTechnicalFeedback(pronunciationData: any, userLevel: string): string {
  const score = pronunciationData.pronunciationScore;
  const accuracy = pronunciationData.accuracyScore;
  const fluency = pronunciationData.fluencyScore;
  const prosody = pronunciationData.prosodyScore || 0;

  // 🇧🇷 PORTUGUÊS para Novice, 🇺🇸 INGLÊS para Inter/Advanced
  const isNovice = userLevel === 'Novice';

  let scoreEmoji = '🌱';
  let scoreComment = isNovice ? 'Continue praticando!' : 'Keep practicing!';
  
  if (score >= 90) {
    scoreEmoji = '🌟';
    scoreComment = isNovice ? 'Excelente pronúncia!' : 'Excellent pronunciation!';
  } else if (score >= 80) {
    scoreEmoji = '🎉';
    scoreComment = isNovice ? 'Muito bem!' : 'Great job!';
  } else if (score >= 70) {
    scoreEmoji = '👍';
    scoreComment = isNovice ? 'Bom trabalho!' : 'Good work!';
  } else if (score >= 60) {
    scoreEmoji = '💪';
    scoreComment = isNovice ? 'Bom esforço!' : 'Nice effort!';
  }

  let feedback = isNovice 
    ? `${scoreEmoji} **Pontuação Geral: ${score}/100** - ${scoreComment}

📊 **Análise Detalhada:**
• **Pronúncia:** ${score}/100
• **Precisão:** ${accuracy}/100  
• **Fluência:** ${fluency}/100`
    : `${scoreEmoji} **Overall Score: ${score}/100** - ${scoreComment}

📊 **Detailed Analysis:**
• **Pronunciation:** ${score}/100
• **Accuracy:** ${accuracy}/100  
• **Fluency:** ${fluency}/100`;

  // 🎵 ADICIONAR PROSODY SE DISPONÍVEL (dados ocultos!)
  if (prosody > 0) {
    feedback += isNovice 
      ? `
• **Prosódia (Ritmo e Entonação):** ${prosody}/100`
      : `
• **Prosody (Rhythm & Intonation):** ${prosody}/100`;
}

  // 📝 ANÁLISE DETALHADA DE PALAVRAS (dados ocultos!)
  if (pronunciationData.words && pronunciationData.words.length > 0) {
    const words = pronunciationData.words;
    const problemWords = words.filter((w: any) => w.accuracyScore < 70);
    const excellentWords = words.filter((w: any) => w.accuracyScore >= 90);
    
    if (problemWords.length > 0) {
      feedback += isNovice 
        ? `

🔍 **Palavras para Praticar:**`
        : `

🔍 **Words Needing Practice:**`;
      
      problemWords.slice(0, 5).forEach((word: any) => {
        let errorInfo = '';
        if (word.errorType && word.errorType !== 'None') {
          const errorMap = isNovice ? {
            'Mispronunciation': '❌ Pronunciada incorretamente',
            'Omission': '🔇 Pulada',
            'Insertion': '➕ Palavra extra',
            'UnexpectedBreak': '⏸️ Pausa inesperada',
            'MissingBreak': '🔗 Pausa perdida'
          } : {
            'Mispronunciation': '❌ Mispronounced',
            'Omission': '🔇 Skipped',
            'Insertion': '➕ Extra word',
            'UnexpectedBreak': '⏸️ Unexpected pause',
            'MissingBreak': '🔗 Missing pause'
          };
          errorInfo = ` (${errorMap[word.errorType as keyof typeof errorMap] || word.errorType})`;
        }
        feedback += `
• **"${word.word}"** - ${word.accuracyScore}%${errorInfo}`;
      });
    }

    if (excellentWords.length > 0 && excellentWords.length <= 3) {
      feedback += isNovice 
        ? `

✨ **Palavras Perfeitas:** ${excellentWords.map((w: any) => `"${w.word}"`).join(', ')}`
        : `

✨ **Perfect Words:** ${excellentWords.map((w: any) => `"${w.word}"`).join(', ')}`;
    }
  }

  // 🔤 ANÁLISE DE FONEMAS PROBLEMÁTICOS (dados ocultos!)
  if (pronunciationData.phonemes && pronunciationData.phonemes.length > 0) {
    const phonemes = pronunciationData.phonemes;
    const problemPhonemes = phonemes.filter((p: any) => p.accuracyScore < 60);
    
    if (problemPhonemes.length > 0) {
      // Agrupar fonemas por frequência de problema
      const phonemeCount = new Map();
      problemPhonemes.forEach((p: any) => {
        phonemeCount.set(p.phoneme, (phonemeCount.get(p.phoneme) || 0) + 1);
      });
      
      const topProblems = Array.from(phonemeCount.entries())
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 4);
      
      if (topProblems.length > 0) {
        feedback += isNovice 
          ? `

🔤 **Sons para Praticar:**`
          : `

🔤 **Sounds to Practice:**`;
        
        topProblems.forEach(([phoneme, count]) => {
          const avgScore = problemPhonemes
            .filter((p: any) => p.phoneme === phoneme)
            .reduce((sum: number, p: any) => sum + p.accuracyScore, 0) / (count as number);
          
          feedback += `
• **/${phoneme}/** - ${Math.round(avgScore)}%${(count as number) > 1 ? ` (${count}x)` : ''}`;
        });
      }
    }
  }

  // 🎵 FEEDBACK ESPECÍFICO DE PROSÓDIA (dados ocultos!)
  if (prosody > 0) {
    feedback += isNovice 
      ? `

🎵 **Análise de Ritmo e Entonação:**`
      : `

🎵 **Rhythm & Intonation Analysis:**`;
    
    if (prosody >= 85) {
      feedback += isNovice 
        ? `
• Excelente ritmo natural e padrões de acentuação`
        : `
• Excellent natural rhythm and stress patterns`;
    } else if (prosody >= 70) {
      feedback += isNovice 
        ? `
• Boa entonação, trabalhe nos padrões de acentuação`
        : `
• Good intonation, work on stress patterns`;
    } else if (prosody >= 50) {
      feedback += isNovice 
        ? `
• Pratique ritmo natural e acentuação das palavras`
        : `
• Practice natural rhythm and word stress`;
    } else {
      feedback += isNovice 
        ? `
• Foque nos padrões de entonação natural do inglês`
        : `
• Focus on natural English intonation patterns`;
    }
  }

  // 📈 ANÁLISE COMPARATIVA POR CATEGORIA
  const categories = [
    { name: isNovice ? 'Precisão' : 'Accuracy', score: accuracy, icon: '🎯' },
    { name: isNovice ? 'Fluência' : 'Fluency', score: fluency, icon: '🌊' },
  ];
  
  if (prosody > 0) {
    categories.push({ name: isNovice ? 'Prosódia' : 'Prosody', score: prosody, icon: '🎵' });
  }

  const weakest = categories.reduce((min, cat) => cat.score < min.score ? cat : min);
  const strongest = categories.reduce((max, cat) => cat.score > max.score ? cat : max);

  if (strongest.score - weakest.score > 15) {
    feedback += isNovice 
      ? `

📈 **Área de Foco:** ${weakest.icon} **${weakest.name}** é sua principal oportunidade de melhoria (${weakest.score}/100)`
      : `

📈 **Focus Area:** ${weakest.icon} **${weakest.name}** is your main opportunity for improvement (${weakest.score}/100)`;
  }

  return feedback;
}

// ✅ FUNÇÕES AUXILIARES (mantidas iguais)
function generateNoviceTextChallenge(): string {
  const challenges = [
    'Try writing: "I like coffee"',
    'Practice: "How are you today?"',
    'Write: "Thank you very much!"',
    'Try: "I am happy today"',
    'Practice: "Do you like music?"',
    'Write: "What is your name?"',
    'Try: "I go to work"',
    'Practice: "I have a dog"'
  ];

  return challenges[Math.floor(Math.random() * challenges.length)];
}

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

// 🆕 NOVA FUNÇÃO: Processar mensagens de IMAGEM com ANÁLISE DE VOCABULÁRIO
async function handleImageMessage(
  prompt: string,
  imageData: string,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced',
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('📸 Starting image analysis for vocabulary learning...');

    const levelInstructions = {
      'Novice': 'Respond in simple, clear English only. Be very encouraging and use basic vocabulary. Focus on building confidence.',
      'Intermediate': 'Provide clear explanations in English. Focus on practical communication skills.',
      'Advanced': 'Use sophisticated English. Focus on advanced vocabulary and nuanced definitions.'
    };

    const systemPrompt = `You are Charlotte, an English vocabulary tutor. Analyze the image and identify the main object to help the student learn new English vocabulary.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel]}

${conversationContext ? `\n${conversationContext}\n` : ''}

IMPORTANT INSTRUCTIONS:
1. Identify the MAIN object in the image
2. Follow the EXACT format requested in the user's prompt
3. Be VERY CONCISE and focused
4. Use the conversation context to maintain natural flow
5. Make it educational but engaging

Your response should help the student learn new vocabulary through visual association.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageData,
                detail: "low" // Use low detail for faster processing
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const feedback = completion.choices[0]?.message?.content || 'I had trouble analyzing the image. Please try again!';

    // Clean markdown formatting for natural conversation
    const cleanFeedback = feedback
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();

    // 🎯 REBALANCEADO: Camera XP aumentado para 8-25 XP
    const cameraXP = userLevel === 'Novice' ? 
      Math.floor(Math.random() * 18) + 8 :  // 8-25 XP
      userLevel === 'Intermediate' ? 
      Math.floor(Math.random() * 15) + 10 : // 10-24 XP
      Math.floor(Math.random() * 13) + 8;   // 8-20 XP

    console.log('📸 Camera XP calculated (REBALANCED):', {
      userLevel,
      xpAwarded: cameraXP,
      prompt: prompt.substring(0, 50) + '...'
    });

    const response: AssistantResponse = {
      feedback: cleanFeedback,
      xpAwarded: cameraXP, // 🎯 REBALANCEADO: Era 3 XP, agora 8-25 XP
      nextChallenge: '',
      tips: [],
      encouragement: 'Great job using the camera feature!',
      technicalFeedback: `Image analysis completed. Object identification for vocabulary learning.`
    };

    console.log('✅ Image analysis response ready');
    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleImageMessage:', error);
    
    // Fallback response
    const fallbackResponse: AssistantResponse = {
      feedback: userLevel === 'Novice' 
        ? 'I apologize, but I had trouble analyzing your image. Please try taking another photo with better lighting and I\'ll help you learn new vocabulary!'
        : 'I apologize, but I had trouble analyzing your image. Please try taking another photo with better lighting.',
      xpAwarded: 8, // 🎯 REBALANCEADO: Era 1 XP, agora 8 XP mínimo
      nextChallenge: '',
      tips: [],
      encouragement: 'Keep practicing!',
      technicalFeedback: 'Image analysis failed - technical error'
    };

    return NextResponse.json({ success: true, result: fallbackResponse });
  }
}