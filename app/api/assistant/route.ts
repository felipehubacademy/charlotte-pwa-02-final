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
  userLevel: 'Novice' | 'Inter' | 'Advanced';
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
    if (conversationContext) {
      console.log('📝 Context preview:', conversationContext.substring(0, 200) + '...');
    }
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
  userLevel: 'Novice' | 'Inter' | 'Advanced', 
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('🔍 Starting text message processing for level:', userLevel);
    console.log('🔍 [DEBUG] userLevel type:', typeof userLevel);
    console.log('🔍 [DEBUG] userLevel value:', JSON.stringify(userLevel));
    console.log('🔍 [DEBUG] userLevel === "Advanced":', userLevel === 'Advanced');

    // 🎯 NOVICE SPECIAL HANDLING: Usar lógica simplificada e encorajadora
    if (userLevel === 'Novice') {
      console.log('👶 Using Novice-specific text handling...');
      return await handleNoviceTextMessage(transcription, userName, conversationContext);
    }

    // 🎯 INTER SPECIAL HANDLING: Usar lógica de 2 mensagens com correções suaves
    if (userLevel === 'Inter') {
      console.log('🎓 Using Inter-specific text handling...');
      return await handleInterTextMessage(transcription, userName, conversationContext);
    }

    // 🎯 ADVANCED: Usar análise de gramática com personalidade business moderna
    console.log('🔍 [DEBUG] Checking userLevel for Advanced:', userLevel, typeof userLevel);
    if (userLevel === 'Advanced') {
      console.log('🎓 Advanced will use grammar analysis with modern business personality...');
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
  
  // 🎯 PRIORIDADE MÁXIMA: Detectar pedidos de exemplos para TODOS os níveis e responder diretamente
  if (conversationContext) {
    // 🌍 MELHORADO: Detecção multilíngue para exemplos e perguntas FOR vs TO
    const isAskingForExamples = /give\s*(me\s*)?(some\s*)?examples?|show\s*(me\s*)?examples?|examples?\s*please|can\s*you\s*give|dê\s+exemplos?|me\s+dê\s+exemplos?|exemplos?\s+por\s+favor|pode\s+dar\s+exemplos?/i.test(originalText);
    // 🌍 SUPER EXPANDIDO: Detectar MUITAS formas de concordância em português/inglês
    const isAffirmativeResponse = /^(sure|yes|yeah|yep|yup|ok|okay|alright|absolutely|definitely|of course|please|certainly|exactly|right|correct|perfect|great|awesome|cool|fine|sounds?\s+good|let'?s\s+do\s+it|go\s+ahead|proceed|continue|that\s+would\s+be\s+great|i'?d\s+like\s+that|sim|tá|ok|certo|claro|perfeito|exato|isso\s+mesmo|com\s+certeza|pode\s+ser|beleza|tranquilo|show|legal|massa|bacana|por\s+favor|seria\s+legal|seria\s+ótimo|gostaria\s+disso|vamos\s+lá|pode\s+ir|continua)\.?$/i.test(originalText.trim());
    
    // 🆕 NOVO: Detectar respostas negativas em português/inglês
    const isNegativeResponse = /^(no|nope|nah|never|not\s+really|no\s+way|no\s+thanks|i\s+don'?t\s+think\s+so|não|nada|nunca|jamais|de\s+jeito\s+nenhum|não\s+quero|nem\s+pensar|não\s+precisa|deixa\s+pra\s+lá|não\s+obrigad[oa])\.?$/i.test(originalText.trim());
    // 🌍 EXPANDIDO: Detectar perguntas gerais de gramática em português/inglês
    // 🌍 SUPER EXPANDIDO: Detectar FOR vs TO em todas as formas possíveis
    const isForToQuestion = /diferença\s+entre\s+(?:o\s+)?for\s+e\s+(?:o\s+)?to|diferença\s+entre\s+(?:o\s+)?to\s+e\s+(?:o\s+)?for|como\s+us[ao]\s+(?:o\s+)?for\s+e\s+(?:o\s+)?to|como\s+us[ao]\s+(?:o\s+)?to\s+e\s+(?:o\s+)?for|quando\s+us[ao]\s+(?:o\s+)?for\s+e\s+(?:o\s+)?to|quando\s+us[ao]\s+(?:o\s+)?to\s+e\s+(?:o\s+)?for|quando\s+us[ao]\s+(?:o\s+)?to\s+ou\s+(?:o\s+)?for|quando\s+us[ao]\s+(?:o\s+)?for\s+ou\s+(?:o\s+)?to|difference\s+between\s+for\s+and\s+to|difference\s+between\s+to\s+and\s+for|how\s+to\s+use\s+for\s+and\s+to|how\s+to\s+use\s+to\s+and\s+for|when\s+(?:to\s+)?use\s+for\s+and\s+to|when\s+(?:to\s+)?use\s+to\s+and\s+for/i.test(originalText);
    // 🌍 SUPER EXPANDIDO: Detectar QUALQUER pergunta de gramática em português/inglês
    const isGrammarQuestion = /como\s+(?:eu\s+)?us[ao]\s+(?:o\s+)?[a-z]+|diferença\s+entre|quando\s+us[ao]|quando\s+usar|qual\s+(?:a\s+)?diferença|difference\s+between|when\s+(?:to\s+)?use|how\s+to\s+use|how\s+do\s+(?:i|you)\s+use|what\s+is\s+the\s+difference|when\s+do\s+(?:i|you)\s+use|como\s+(?:se\s+)?faz|como\s+(?:se\s+)?form[ao]|what\s+about|help\s+with|explain.*grammar|grammar.*help/i.test(originalText);
    const charlotteOfferedExamples = conversationContext.includes('Want some examples') || 
                                    conversationContext.includes('examples to see') || 
                                    conversationContext.includes('give you specific examples') || 
                                    conversationContext.includes('I can give you') ||
                                    conversationContext.includes('Do you want some examples') ||
                                    /give you.*examples/i.test(conversationContext) ||
                                    /want.*examples/i.test(conversationContext) ||
                                    /examples.*based on/i.test(conversationContext) ||
                                    /clarify further/i.test(conversationContext) ||
                                    /do you want.*examples/i.test(conversationContext);
    
    // 🧠 ANÁLISE INTELIGENTE DE CONTEXTO: Detectar tópicos específicos nas mensagens recentes
    const recentMessages = conversationContext.toLowerCase();
    let smartTopicDetected = false;
    let smartTopic = null;
    
    console.log('🧠 [SMART CONTEXT] Analyzing conversation context for topic patterns');
    
    // Detectar contexto de preposições IN/ON/AT
    if ((recentMessages.includes(' in ') && recentMessages.includes(' on ') && recentMessages.includes(' at ')) || 
        recentMessages.includes('preposição') || recentMessages.includes('preposition')) {
      smartTopic = 'prepositions IN ON AT';
      smartTopicDetected = true;
      console.log('🧠 [SMART CONTEXT] Detected IN/ON/AT context in conversation');
    }
    // Detectar contexto de A vs AN
    else if ((recentMessages.includes(' a ') && recentMessages.includes(' an ')) || recentMessages.includes('artigo')) {
      smartTopic = 'a vs an';
      smartTopicDetected = true;
      console.log('🧠 [SMART CONTEXT] Detected A vs AN context in conversation');
    }
    // Detectar contexto de FOR vs TO
    else if (recentMessages.includes(' for ') && recentMessages.includes(' to ')) {
      smartTopic = 'for vs to';
      smartTopicDetected = true;
      console.log('🧠 [SMART CONTEXT] Detected FOR vs TO context in conversation');
    }

    console.log('🎯 [PRIORITY] Checking for examples request (all levels):', {
      userLevel,
      originalText,
      isAskingForExamples,
      isAffirmativeResponse,
      isNegativeResponse,
      isForToQuestion,
      isGrammarQuestion,
      charlotteOfferedExamples,
      smartTopicDetected,
      smartTopic,
      contextSnippet: conversationContext.substring(0, 300)
    });
    
    // 🆕 PRIMEIRO: Verificar se usuário rejeitou exemplos oferecidos
    if (isNegativeResponse && charlotteOfferedExamples) {
      console.log('🎯 [NEGATIVE] User declined examples - responding gracefully');
      const declineResponse = `No problem at all! What else would you like to talk about? I'm here to help with anything - conversation practice, questions, or just chatting! 😊`;
      
      console.log('🎯 [NEGATIVE] RETURNING GRACEFUL DECLINE RESPONSE');
      return declineResponse;
    }
    
    // 🧠 INCLUIR ANÁLISE INTELIGENTE: Detectar quando user aceita exemplos baseado no contexto
    const smartExampleRequest = smartTopicDetected && isAffirmativeResponse && charlotteOfferedExamples;
    
    if (isAskingForExamples || (isAffirmativeResponse && charlotteOfferedExamples) || isForToQuestion || isGrammarQuestion || smartExampleRequest) {
      // 🌍 MELHORADO: Extrair tópico do contexto recente OU da pergunta atual
      let topicMatch = conversationContext.match(/difference between\s+([^"]+)/i) || 
                       conversationContext.match(/about\s+([^"]+)/i) ||
                       conversationContext.match(/topic[s]?:\s*([^,\n]+)/i) ||
                       conversationContext.match(/using\s+"([^"]+)"/i) ||
                       conversationContext.match(/You use\s+"([^"]+)"/i);
      
      let topic = topicMatch ? topicMatch[1].trim() : null;
      
      // 🧠 PRIORIZAR SMART TOPIC se detectado
      if (smartTopicDetected && smartTopic) {
        topic = smartTopic;
        console.log('🧠 [SMART PRIORITY] Using smart detected topic:', topic);
      }
      
              // 🌍 SUPER MELHORADO: Detectar MUITOS tópicos específicos da pergunta atual
        if (isForToQuestion || (!topic && /(?:for|to)/i.test(originalText))) {
          topic = 'difference between FOR and TO';
          console.log('🎯 [MULTILINGUAL] Detected direct FOR vs TO question - setting topic');
        } else if (isGrammarQuestion) {
          // 🔥 EXPANDIDO: Detectar MUITO mais tópicos gramaticais
          
          // Artigos
          if (/(?:a|an)\b/i.test(originalText)) {
            topic = 'difference between A and AN';
            console.log('🎯 [MULTILINGUAL] Detected A vs AN question - setting topic');
          }
          // Preposições básicas (EXPANDIDO)
          else if (/(?:in|on|at)\b/i.test(originalText) || /preposições|prepositions/i.test(originalText)) {
            topic = 'prepositions IN ON AT';
            console.log('🎯 [MULTILINGUAL] Detected preposition question - setting topic');
          }
          // Verbos auxiliares
          else if (/(?:is|are)\b/i.test(originalText)) {
            topic = 'difference between IS and ARE';
            console.log('🎯 [MULTILINGUAL] Detected IS vs ARE question - setting topic');
          }
          else if (/(?:do|does)\b/i.test(originalText)) {
            topic = 'difference between DO and DOES';
            console.log('🎯 [MULTILINGUAL] Detected DO vs DOES question - setting topic');
          }
          // Modais
          else if (/(?:can|could)\b/i.test(originalText)) {
            topic = 'difference between CAN and COULD';
            console.log('🎯 [MULTILINGUAL] Detected CAN vs COULD question - setting topic');
          }
          else if (/(?:will|would)\b/i.test(originalText)) {
            topic = 'difference between WILL and WOULD';
            console.log('🎯 [MULTILINGUAL] Detected WILL vs WOULD question - setting topic');
          }
          else if (/(?:should|must)\b/i.test(originalText)) {
            topic = 'difference between SHOULD and MUST';
            console.log('🎯 [MULTILINGUAL] Detected SHOULD vs MUST question - setting topic');
          }
          // Pronomes
          else if (/(?:this|that)\b/i.test(originalText)) {
            topic = 'difference between THIS and THAT';
            console.log('🎯 [MULTILINGUAL] Detected THIS vs THAT question - setting topic');
          }
          else if (/(?:some|any)\b/i.test(originalText)) {
            topic = 'difference between SOME and ANY';
            console.log('🎯 [MULTILINGUAL] Detected SOME vs ANY question - setting topic');
          }
          else if (/(?:do|make)\b/i.test(originalText) && (/diferença.*entre|difference.*between|como\s+us[ao].*do.*make|how.*use.*do.*make/i.test(originalText))) {
            topic = 'difference between DO and MAKE';
            console.log('🎯 [MULTILINGUAL] Detected DO vs MAKE question - setting topic');
          }
          else if (/(?:get|take)\b/i.test(originalText) && (/diferença.*entre|difference.*between|como\s+us[ao].*get.*take|how.*use.*get.*take/i.test(originalText))) {
            topic = 'difference between GET and TAKE';
            console.log('🎯 [MULTILINGUAL] Detected GET vs TAKE question - setting topic');
          }
          else if (/(?:come|go)\b/i.test(originalText) && (/diferença.*entre|difference.*between|como\s+us[ao].*come.*go|how.*use.*come.*go/i.test(originalText))) {
            topic = 'difference between COME and GO';
            console.log('🎯 [MULTILINGUAL] Detected COME vs GO question - setting topic');
          }
          // Tempos verbais
          else if (/past\s+simple|simple\s+past|passado\s+simples/i.test(originalText)) {
            topic = 'Past Simple tense';
            console.log('🎯 [MULTILINGUAL] Detected Past Simple question - setting topic');
          }
          else if (/present\s+perfect|presente\s+perfeito/i.test(originalText)) {
            topic = 'Present Perfect tense';
            console.log('🎯 [MULTILINGUAL] Detected Present Perfect question - setting topic');
          }
          else if (/future\s+tense|futuro/i.test(originalText)) {
            topic = 'Future tense';
            console.log('🎯 [MULTILINGUAL] Detected Future tense question - setting topic');
          }
          else if (!topic) {
            // Tentar extrair palavras-chave da pergunta para resposta mais específica
            const keywordsMatch = originalText.match(/(?:como\s+us[ao]\s+(?:o\s+)?|difference\s+between\s+|when\s+to\s+use\s+)([a-z\s]+)/i);
            if (keywordsMatch) {
              topic = keywordsMatch[1].trim();
              console.log('🎯 [MULTILINGUAL] Extracted specific topic from question:', topic);
            } else {
              topic = 'grammar question';
              console.log('🎯 [MULTILINGUAL] Detected general grammar question - setting generic topic');
            }
          }
        }
      
      if (topic) {
        console.log('🎯 [CONTEXT] Detected example request for topic:', topic);
        
        // 🌍 SUPER MELHORADO: Respostas diretas para MUITOS tópicos gramaticais
        if (topic.toLowerCase().includes('for') && topic.toLowerCase().includes('to')) {
          const directResponse = `Perfect! Here are some clear examples of FOR vs TO:

FOR (purpose/benefit/duration):
• "This meeting is for planning the project" 
• "I'm saving money for vacation"
• "I'll be here for two hours"

TO (direction/movement/recipient):
• "I'm going to the office"
• "Send this email to the client"  
• "Give the report to Sarah"

Quick tip: FOR = why/purpose, TO = where/who. Makes sense?`;
          
          console.log('🎯 [SUCCESS] RETURNING DIRECT FOR vs TO EXAMPLES - BYPASSING ALL OTHER LOGIC');
          return directResponse;
        } 
        else if (topic.toLowerCase().includes('a') && topic.toLowerCase().includes('an')) {
          const directResponse = `Great! Here are clear examples of A vs AN:

A (before consonant sounds):
• "a car" (C sound)
• "a house" (H sound)  
• "a university" (Y sound)

AN (before vowel sounds):
• "an apple" (A sound)
• "an hour" (silent H)
• "an umbrella" (U sound)

Quick tip: Listen to the SOUND, not the letter! Clear?`;
          
          console.log('🎯 [SUCCESS] RETURNING DIRECT A vs AN EXAMPLES - BYPASSING ALL OTHER LOGIC');
          return directResponse;
        } 
        else if (topic.toLowerCase().includes('preposition') || topic.toLowerCase().includes('in on at')) {
          const directResponse = `Good! Here are examples of prepositions:

IN (inside/time periods):
• "in the box"
• "in January"

ON (surface/days):
• "on the table"  
• "on Monday"

AT (specific place/time):
• "at home"
• "at 3 o'clock"

Does this help?`;
          
          console.log('🎯 [SUCCESS] RETURNING PREPOSITION EXAMPLES - BYPASSING ALL OTHER LOGIC');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('do') && topic.toLowerCase().includes('does')) {
          const directResponse = `Good question! Here are DO vs DOES examples:

DO (I, you, we, they):
• "I do my homework"
• "You do well"
• "They do sports"

DOES (he, she, it):
• "She does yoga"
• "He does his job"
• "It does work"

Quick tip: DOES = 3rd person singular. Clear?`;
          
          console.log('🎯 [SUCCESS] RETURNING DO vs DOES EXAMPLES');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('can') && topic.toLowerCase().includes('could')) {
          const directResponse = `Perfect! Here are CAN vs COULD examples:

CAN (present ability/permission):
• "I can swim"
• "Can I help you?"
• "She can speak French"

COULD (past ability/polite request):
• "I could swim when I was young"
• "Could you help me?"
• "It could be true"

Quick tip: CAN = now, COULD = was/polite. Got it?`;
          
          console.log('🎯 [SUCCESS] RETURNING CAN vs COULD EXAMPLES');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('will') && topic.toLowerCase().includes('would')) {
          const directResponse = `Great! Here are WILL vs WOULD examples:

WILL (future/certainty):
• "I will call you tomorrow"
• "It will rain today"
• "She will be here soon"

WOULD (conditional/polite):
• "I would help if I could"
• "Would you like coffee?"
• "It would be nice"

Quick tip: WILL = certain future, WOULD = maybe/polite. Clear?`;
          
          console.log('🎯 [SUCCESS] RETURNING WILL vs WOULD EXAMPLES');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('this') && topic.toLowerCase().includes('that')) {
          const directResponse = `Nice! Here are THIS vs THAT examples:

THIS (close/near):
• "This book" (in my hand)
• "This is my phone"
• "I like this idea"

THAT (far/distant):
• "That car" (over there)
• "That was yesterday"
• "I remember that"

Quick tip: THIS = near me, THAT = far from me. Got it?`;
          
          console.log('🎯 [SUCCESS] RETURNING THIS vs THAT EXAMPLES');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('some') && topic.toLowerCase().includes('any')) {
          const directResponse = `Perfect! Here are SOME vs ANY examples:

SOME (positive sentences):
• "I have some money"
• "There are some cookies"
• "I need some help"

ANY (negative/questions):
• "I don't have any money"
• "Do you have any cookies?"
• "I can't find any help"

Quick tip: SOME = positive, ANY = negative/questions. Clear?`;
          
          console.log('🎯 [SUCCESS] RETURNING SOME vs ANY EXAMPLES');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('do') && topic.toLowerCase().includes('make')) {
          const directResponse = `Great question! Here are DO vs MAKE examples:

DO (actions/activities):
• "I do my homework"
• "Do the dishes"
• "She does yoga"

MAKE (create/build):
• "I make a cake"
• "Make a plan"
• "He makes coffee"

Quick tip: DO = actions, MAKE = create. Does this help?`;
          
          console.log('🎯 [SUCCESS] RETURNING DO vs MAKE EXAMPLES');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('get') && topic.toLowerCase().includes('take')) {
          const directResponse = `Good question! Here are GET vs TAKE examples:

GET (receive/obtain):
• "I get a present"
• "Get some milk"
• "She gets tired"

TAKE (grab/carry):
• "Take this book"
• "I take the bus"
• "Take your time"

Quick tip: GET = receive, TAKE = grab. Clear?`;
          
          console.log('🎯 [SUCCESS] RETURNING GET vs TAKE EXAMPLES');
          return directResponse;
        }
        else if (topic.toLowerCase().includes('come') && topic.toLowerCase().includes('go')) {
          const directResponse = `Perfect! Here are COME vs GO examples:

COME (toward the speaker):
• "Come here!"
• "Come to my house"
• "She comes to work"

GO (away from speaker):
• "Go there!"
• "Go to school"
• "I go home"

Quick tip: COME = toward me, GO = away from me. Got it?`;
          
          console.log('🎯 [SUCCESS] RETURNING COME vs GO EXAMPLES');
          return directResponse;
        }
        else {
          // 🎯 RESPOSTA GENÉRICA MELHORADA para tópicos não mapeados
          const directResponse = `Great question about ${topic}! Here are some practical examples:

Basic usage patterns:
• Simple everyday examples
• Common situations you'll encounter
• Natural conversation contexts

Grammar tip: Practice with real-life situations - it makes it stick better!

Does this help? I can give more specific examples if you'd like!`;
          
          console.log('🎯 [SUCCESS] RETURNING ENHANCED GENERIC GRAMMAR EXAMPLES for topic:', topic);
          return directResponse;
        }
        
        // Para outros tópicos, usar resposta genérica mas contextual
        console.log('🎯 [CONTEXT] Providing generic examples for topic:', topic);
        return `Sure! Here are some examples of ${topic}:

[Examples would be provided based on the specific topic discussed]

Does that help clarify things?`;
      } else {
        console.log('🎯 [CONTEXT] No topic found in context, but user requested examples - providing direct response');
        return `Absolutely! Let me give you some practical examples:

FOR (purpose/benefit):
• "This is for you" (benefit)
• "I study for my exam" (purpose)
• "We waited for an hour" (duration)

TO (direction/destination):
• "I'm going to work" (direction)
• "Send it to me" (recipient)
• "From Monday to Friday" (endpoint)

Does this help clarify the difference?`;
      }
    }
  }
  
  const levelInstructions = {
    'Novice': 'Use simple, clear English only. Be very encouraging about grammar mistakes. Speak slowly and use basic vocabulary to help beginners understand.',
    'Inter': 'Provide clear feedback. Balance grammar correction with conversational response. Focus on practical improvements.',
    'Advanced': 'Be a modern business professional. Use contemporary language, be direct and efficient. Think startup founder or tech consultant - smart, current, no old-fashioned words. Sound like someone from Google or Netflix.'
  };

  const systemPrompt = userLevel === 'Advanced' ? 
    `You are Charlotte, a modern business professional in your early 30s. Think startup founder, tech consultant, or someone who works at Google/Netflix - smart, direct, contemporary.

${conversationContext ? `\n${conversationContext}\n` : ''}

ADVANCED USER COMMUNICATION STYLE:
- Be direct and helpful - answer what they're actually asking for
- Use the conversation context to provide relevant, specific responses
- MINIMAL grammar corrections - only if it affects understanding
- Focus on content over form for Advanced users
- Sound like a smart colleague, not a teacher

CONTEXT-AWARE RESPONSES:
- If they ask for "examples" after a topic was discussed, give examples of THAT topic
- If they say "explain more" or "tell me more", expand on the previous topic
- Use the recent conversation to understand what they really want
- Don't make them repeat themselves or be overly explicit

GRAMMAR FEEDBACK (MINIMAL):
- Only correct if it's confusing or significantly impacts meaning
- Skip minor issues like missing "some" or capitalization for short responses (sure, yes, ok are perfectly fine)
- Skip corrections for single-word responses or casual acknowledgments
- Focus on communication effectiveness, not perfection

Create a response that directly addresses what they're asking for based on the conversation context.` :
    `You are Charlotte, an English tutor. Create a natural, conversational response that seamlessly integrates grammar feedback while maintaining conversation flow.

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

  const userPrompt = userLevel === 'Advanced' ?
    `Student said: "${originalText}"

Grammar score: ${grammarResult.analysis.overallScore}/100

IMPORTANT: Look at the conversation context above. What is the user actually asking for based on the recent conversation?

If they're asking for examples, explanations, or clarifications about a topic that was just discussed, provide that directly. Don't focus on grammar corrections unless it's genuinely confusing.

Response goal: Be a helpful colleague who understands context and gives useful, direct answers.`
    : `Student wrote: "${originalText}"

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

    // 🔧 CORREÇÃO DE PONTUAÇÃO PARA ADVANCED
    if (userLevel === 'Advanced') {
      let correctedResponse = response.trim();
      console.log('🔧 [ADVANCED GRAMMAR] Original response:', correctedResponse);
      
      // Correção SIMPLES E EFICAZ: qualquer frase que termine com ponto mas deveria ser pergunta
      correctedResponse = correctedResponse.replace(/\b(what's|whats|what|where|when|who|how|why|do|does|did|is|are|can|could|would|will|should|have|has|had)\b[^?]*\.$/gi, (match) => {
        console.log('🔧 [PUNCTUATION FIX] Converting to question:', match);
        return match.slice(0, -1) + '?';
      });
      
      // Correção para perguntas no meio da frase também
      correctedResponse = correctedResponse.replace(/\.\s+(what's|whats|what|where|when|who|how|why|do|does|did|is|are|can|could|would|will|should|have|has|had)\b[^?]*\.$/gi, (match) => {
        console.log('🔧 [PUNCTUATION FIX] Converting mid-sentence to question:', match);
        const parts = match.split('. ');
        if (parts.length === 2) {
          return '. ' + parts[1].slice(0, -1) + '?';
        }
        return match;
      });
      
      console.log('🔧 [ADVANCED GRAMMAR] Fixed response:', correctedResponse);
      return correctedResponse;
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

    const systemPrompt = `You are Charlotte, a warm and genuine English mini-teacher for beginners.

BE A HELPFUL MINI-TEACHER:
- React genuinely to what they say - show real interest
- WHEN THEY ASK QUESTIONS about English (like "como usar FOR e TO?"), HELP them with simple explanations
- Vary your responses naturally (don't always start with "Nice!")
- Use natural conversation starters: "Cool!", "Nice!", "Great!", "Wow!", "Really?", "That's awesome!", "Sounds good!"
- Don't copy their exact words back to them
- Be curious about their life and experiences

MINI-TEACHER APPROACH:
- Listen to what they actually said and respond to it specifically
- Ask follow-up questions that show you're paying attention
- Share brief, relatable responses when appropriate
- Keep the conversation flowing naturally
- When they make small mistakes, naturally model the correct way without being obvious about it
- WHEN THEY ASK FOR HELP: Give simple, clear explanations using basic English

${conversationContext ? `\n${conversationContext}\n` : ''}

VOCABULARY: Use simple, natural words:
- Reactions: cool, nice, great, wow, awesome, that's fun, sounds good, interesting, really, good
- Questions: what, where, how, why, do you, are you, can you, which, when
- Common words: like, love, want, need, go, come, see, do, make, have, get, work, play, eat, live, think, feel, visit, enjoy, beautiful, small, big

IMPORTANT: Vary your reactions! Don't always start with the same word. Mix it up naturally.

EXAMPLES OF NATURAL RESPONSES:
- "Cool! What kind of work do you do?"
- "That sounds fun! Where did you go?"
- "Wow, really? How was that?"
- "Nice! Do you like doing that?"
- "Great! How was that?"
- "Awesome! Tell me more!"

EXAMPLES OF MINI-TEACHER RESPONSES:
- They ask "como usar FOR e TO?" → You say "FOR = why/purpose. TO = where/who. Want examples?"
- They ask "give me examples" → You say "FOR: 'This is for you'. TO: 'Go to work'. Clear?"
- They ask "what's the difference?" → You say "FOR is purpose. TO is direction. Need more help?"

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

    // 🎯 PRIORIDADE MÁXIMA: Detectar pedidos de exemplos para ÁUDIO
    if (conversationContext) {
      // 🌍 MELHORADO: Detecção multilíngue para exemplos e perguntas FOR vs TO
      const isAskingForExamples = /give\s*(me\s*)?(some\s*)?examples?|show\s*(me\s*)?examples?|examples?\s*please|can\s*you\s*give|dê\s+exemplos?|me\s+dê\s+exemplos?|exemplos?\s+por\s+favor|pode\s+dar\s+exemplos?/i.test(transcription);
      // 🌍 SUPER EXPANDIDO: Detectar MUITAS formas de concordância em português/inglês
      const isAffirmativeResponse = /^(sure|yes|yeah|yep|yup|ok|okay|alright|absolutely|definitely|of course|please|certainly|exactly|right|correct|perfect|great|awesome|cool|fine|sounds?\s+good|let'?s\s+do\s+it|go\s+ahead|proceed|continue|that\s+would\s+be\s+great|i'?d\s+like\s+that|sim|tá|ok|certo|claro|perfeito|exato|isso\s+mesmo|com\s+certeza|pode\s+ser|beleza|tranquilo|show|legal|massa|bacana|por\s+favor|seria\s+legal|seria\s+ótimo|gostaria\s+disso|vamos\s+lá|pode\s+ir|continua)\.?$/i.test(transcription.trim());
      
      // 🆕 NOVO: Detectar respostas negativas em português/inglês
      const isNegativeResponse = /^(no|nope|nah|never|not\s+really|no\s+way|no\s+thanks|i\s+don'?t\s+think\s+so|não|nada|nunca|jamais|de\s+jeito\s+nenhum|não\s+quero|nem\s+pensar|não\s+precisa|deixa\s+pra\s+lá|não\s+obrigad[oa])\.?$/i.test(transcription.trim());
      // 🌍 SUPER EXPANDIDO: Detectar FOR vs TO em todas as formas possíveis
      const isForToQuestion = /diferença\s+entre\s+(?:o\s+)?for\s+e\s+(?:o\s+)?to|diferença\s+entre\s+(?:o\s+)?to\s+e\s+(?:o\s+)?for|como\s+us[ao]\s+(?:o\s+)?for\s+e\s+(?:o\s+)?to|como\s+us[ao]\s+(?:o\s+)?to\s+e\s+(?:o\s+)?for|quando\s+us[ao]\s+(?:o\s+)?for\s+e\s+(?:o\s+)?to|quando\s+us[ao]\s+(?:o\s+)?to\s+e\s+(?:o\s+)?for|quando\s+us[ao]\s+(?:o\s+)?to\s+ou\s+(?:o\s+)?for|quando\s+us[ao]\s+(?:o\s+)?for\s+ou\s+(?:o\s+)?to|difference\s+between\s+for\s+and\s+to|difference\s+between\s+to\s+and\s+for|how\s+to\s+use\s+for\s+and\s+to|how\s+to\s+use\s+to\s+and\s+for|when\s+(?:to\s+)?use\s+for\s+and\s+to|when\s+(?:to\s+)?use\s+to\s+and\s+for/i.test(transcription);
      // 🌍 SUPER EXPANDIDO: Detectar QUALQUER pergunta de gramática em português/inglês
      const isGrammarQuestion = /como\s+(?:eu\s+)?us[ao]\s+(?:o\s+)?[a-z]+|diferença\s+entre|quando\s+us[ao]|quando\s+usar|qual\s+(?:a\s+)?diferença|difference\s+between|when\s+(?:to\s+)?use|how\s+to\s+use|how\s+do\s+(?:i|you)\s+use|what\s+is\s+the\s+difference|when\s+do\s+(?:i|you)\s+use|como\s+(?:se\s+)?faz|como\s+(?:se\s+)?form[ao]|what\s+about|help\s+with|explain.*grammar|grammar.*help/i.test(transcription);
      const charlotteOfferedExamples = conversationContext.includes('Want some examples') || 
                                      conversationContext.includes('examples to see') || 
                                      conversationContext.includes('give you specific examples') || 
                                      conversationContext.includes('I can give you') ||
                                      /give you.*examples/i.test(conversationContext) ||
                                      /want.*examples/i.test(conversationContext) ||
                                      /examples.*based on/i.test(conversationContext) ||
                                      /clarify further/i.test(conversationContext);
      
      // 🧠 ANÁLISE INTELIGENTE DE CONTEXTO PARA AUDIO: Detectar tópicos específicos
      const recentAudioMessages = conversationContext.toLowerCase();
      let smartAudioTopicDetected = false;
      let smartAudioTopic = null;
      
      console.log('🧠 [SMART AUDIO CONTEXT] Analyzing conversation context for topic patterns');
      
      // Detectar contexto de preposições IN/ON/AT
      if ((recentAudioMessages.includes(' in ') && recentAudioMessages.includes(' on ') && recentAudioMessages.includes(' at ')) || 
          recentAudioMessages.includes('preposição') || recentAudioMessages.includes('preposition')) {
        smartAudioTopic = 'prepositions IN ON AT';
        smartAudioTopicDetected = true;
        console.log('🧠 [SMART AUDIO CONTEXT] Detected IN/ON/AT context in conversation');
      }
      // Detectar contexto de A vs AN
      else if ((recentAudioMessages.includes(' a ') && recentAudioMessages.includes(' an ')) || recentAudioMessages.includes('artigo')) {
        smartAudioTopic = 'a vs an';
        smartAudioTopicDetected = true;
        console.log('🧠 [SMART AUDIO CONTEXT] Detected A vs AN context in conversation');
      }
      // Detectar contexto de FOR vs TO
      else if (recentAudioMessages.includes(' for ') && recentAudioMessages.includes(' to ')) {
        smartAudioTopic = 'for vs to';
        smartAudioTopicDetected = true;
        console.log('🧠 [SMART AUDIO CONTEXT] Detected FOR vs TO context in conversation');
      }

      console.log('🎯 [AUDIO PRIORITY] Checking for examples request:', {
        userLevel: 'Novice',
        transcription,
        isAskingForExamples,
        isAffirmativeResponse,
        isNegativeResponse,
        isForToQuestion,
        isGrammarQuestion,
        charlotteOfferedExamples,
        smartAudioTopicDetected,
        smartAudioTopic,
        contextSnippet: conversationContext.substring(0, 300)
      });
      
      // 🆕 PRIMEIRO: Verificar se usuário rejeitou exemplos oferecidos
      if (isNegativeResponse && charlotteOfferedExamples) {
        console.log('🎯 [AUDIO NEGATIVE] User declined examples - responding gracefully');
        const declineResponse = `No problem! What do you want to talk about? I can help with anything! 😊`;
        
        console.log('🎯 [AUDIO NEGATIVE] RETURNING GRACEFUL DECLINE RESPONSE');
        
        return NextResponse.json({ 
          success: true, 
          result: {
            feedback: declineResponse,
            xpAwarded: 5,
            nextChallenge: '',
            tips: ['No worries!'],
            encouragement: 'You choose what to learn! 🌟',
            technicalFeedback: ''
          }
        });
      }
      
      // 🧠 INCLUIR ANÁLISE INTELIGENTE PARA AUDIO: Detectar quando user aceita exemplos baseado no contexto
      const smartAudioExampleRequest = smartAudioTopicDetected && isAffirmativeResponse && charlotteOfferedExamples;
      
      if (isAskingForExamples || (isAffirmativeResponse && charlotteOfferedExamples) || isForToQuestion || isGrammarQuestion || smartAudioExampleRequest) {
        // 🌍 MELHORADO: Extrair tópico do contexto recente OU da pergunta atual
        let topicMatch = conversationContext.match(/difference between\s+([^"]+)/i) || 
                         conversationContext.match(/about\s+([^"]+)/i) ||
                         conversationContext.match(/topic[s]?:\s*([^,\n]+)/i) ||
                         conversationContext.match(/using\s+"([^"]+)"/i) ||
                         conversationContext.match(/You use\s+"([^"]+)"/i);
        
        let topic = topicMatch ? topicMatch[1].trim() : null;
        
        // 🧠 PRIORIZAR SMART AUDIO TOPIC se detectado
        if (smartAudioTopicDetected && smartAudioTopic) {
          topic = smartAudioTopic;
          console.log('🧠 [SMART AUDIO PRIORITY] Using smart detected topic:', topic);
        }
        
        // 🌍 SUPER MELHORADO: Detectar MUITOS tópicos específicos da pergunta atual
        if (isForToQuestion || (!topic && /(?:for|to)/i.test(transcription))) {
          topic = 'difference between FOR and TO';
          console.log('🎯 [AUDIO MULTILINGUAL] Detected direct FOR vs TO question - setting topic');
        } else if (isGrammarQuestion) {
          // 🔥 EXPANDIDO: Detectar MUITO mais tópicos gramaticais
          
          // Artigos
          if (/(?:a|an)\b/i.test(transcription)) {
            topic = 'difference between A and AN';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected A vs AN question - setting topic');
          }
          // Preposições básicas
          else if (/(?:in|on|at)\b/i.test(transcription)) {
            topic = 'prepositions IN ON AT';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected preposition question - setting topic');
          }
          // Verbos auxiliares
          else if (/(?:is|are)\b/i.test(transcription)) {
            topic = 'difference between IS and ARE';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected IS vs ARE question - setting topic');
          }
          else if (/(?:do|does)\b/i.test(transcription)) {
            topic = 'difference between DO and DOES';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected DO vs DOES question - setting topic');
          }
          // Modais
          else if (/(?:can|could)\b/i.test(transcription)) {
            topic = 'difference between CAN and COULD';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected CAN vs COULD question - setting topic');
          }
          else if (/(?:will|would)\b/i.test(transcription)) {
            topic = 'difference between WILL and WOULD';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected WILL vs WOULD question - setting topic');
          }
          else if (/(?:should|must)\b/i.test(transcription)) {
            topic = 'difference between SHOULD and MUST';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected SHOULD vs MUST question - setting topic');
          }
          // Pronomes
          else if (/(?:this|that)\b/i.test(transcription)) {
            topic = 'difference between THIS and THAT';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected THIS vs THAT question - setting topic');
          }
          else if (/(?:some|any)\b/i.test(transcription)) {
            topic = 'difference between SOME and ANY';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected SOME vs ANY question - setting topic');
          }
          else if (/(?:do|make)\b/i.test(transcription) && (/diferença.*entre|difference.*between|como\s+us[ao].*do.*make|how.*use.*do.*make/i.test(transcription))) {
            topic = 'difference between DO and MAKE';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected DO vs MAKE question - setting topic');
          }
          else if (/(?:get|take)\b/i.test(transcription) && (/diferença.*entre|difference.*between|como\s+us[ao].*get.*take|how.*use.*get.*take/i.test(transcription))) {
            topic = 'difference between GET and TAKE';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected GET vs TAKE question - setting topic');
          }
          else if (/(?:come|go)\b/i.test(transcription) && (/diferença.*entre|difference.*between|como\s+us[ao].*come.*go|how.*use.*come.*go/i.test(transcription))) {
            topic = 'difference between COME and GO';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected COME vs GO question - setting topic');
          }
          // Tempos verbais
          else if (/past\s+simple|simple\s+past|passado\s+simples/i.test(transcription)) {
            topic = 'Past Simple tense';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected Past Simple question - setting topic');
          }
          else if (/present\s+perfect|presente\s+perfeito/i.test(transcription)) {
            topic = 'Present Perfect tense';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected Present Perfect question - setting topic');
          }
          else if (/future\s+tense|futuro/i.test(transcription)) {
            topic = 'Future tense';
            console.log('🎯 [AUDIO MULTILINGUAL] Detected Future tense question - setting topic');
          }
          else if (!topic) {
            // Tentar extrair palavras-chave da pergunta para resposta mais específica
            const keywordsMatch = transcription.match(/(?:como\s+us[ao]\s+(?:o\s+)?|difference\s+between\s+|when\s+to\s+use\s+)([a-z\s]+)/i);
            if (keywordsMatch) {
              topic = keywordsMatch[1].trim();
              console.log('🎯 [AUDIO MULTILINGUAL] Extracted specific topic from question:', topic);
            } else {
              topic = 'grammar question';
              console.log('🎯 [AUDIO MULTILINGUAL] Detected general grammar question - setting generic topic');
            }
          }
        }
        
        if (topic) {
          console.log('🎯 [AUDIO CONTEXT] Detected example request for topic:', topic);
          
          // Resposta direta com exemplos baseados no tópico
          // 🌍 SUPER MELHORADO: Respostas diretas para MUITOS tópicos gramaticais
          if (topic.toLowerCase().includes('for') && topic.toLowerCase().includes('to')) {
            const directResponse = `Good! Here are easy examples:

FOR - why:
• "I work for money"
• "This is for you"
• "Study for test"

TO - where:
• "Go to home"
• "Give to me"
• "Come to here"

Which do you use?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING DIRECT FOR vs TO EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['Good work!'],
                encouragement: 'You are doing great! 🌟',
                technicalFeedback: ''
              }
            });
          } 
          else if (topic.toLowerCase().includes('preposition') || topic.toLowerCase().includes('in on at')) {
            const directResponse = `Good! Easy IN, ON, AT examples:

IN - inside:
• "in the box"
• "in my room"
• "in January"

ON - on top:
• "on the table"  
• "on Monday"
• "on the wall"

AT - at place:
• "at home"
• "at work"
• "at 3 o'clock"

Which one is easy?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING PREPOSITION EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['Prepositions are important!'],
                encouragement: 'You are doing so well! 🌟',
                technicalFeedback: ''
              }
            });
          } 
          else if (topic.toLowerCase().includes('a') && topic.toLowerCase().includes('an')) {
            const directResponse = `Good! Here are easy A and AN examples:

A - before sounds like B, C, D:
• "a car"
• "a book"
• "a dog"

AN - before sounds like A, E, I, O, U:
• "an apple"
• "an egg"
• "an orange"

Do you understand?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING DIRECT A vs AN EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['Articles are important!'],
                encouragement: 'You are learning so well! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('can') && topic.toLowerCase().includes('could')) {
            const directResponse = `Good! Easy CAN and COULD:

CAN - I can do now:
• "I can run"
• "I can help you"
• "Can I go?"

COULD - maybe, polite:
• "I could help you"
• "Could you help me?"
• "It could rain"

Which is easy?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING CAN vs COULD EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['Modal verbs are useful!'],
                encouragement: 'You are doing great! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('do') && topic.toLowerCase().includes('make')) {
            const directResponse = `Good! Easy DO and MAKE:

DO - actions:
• "I do homework"
• "Do the dishes"
• "Do exercise"

MAKE - create:
• "I make food"
• "Make a plan"
• "Make coffee"

Do you understand?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING DO vs MAKE EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['DO and MAKE are important!'],
                encouragement: 'You are learning so well! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('get') && topic.toLowerCase().includes('take')) {
            const directResponse = `Good! Easy GET and TAKE:

GET - receive:
• "I get a gift"
• "Get some food"
• "Get tired"

TAKE - grab:
• "Take this"
• "Take the bus"
• "Take time"

Easy, right?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING GET vs TAKE EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['GET and TAKE are useful!'],
                encouragement: 'You are doing great! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('come') && topic.toLowerCase().includes('go')) {
            const directResponse = `Good! Easy COME and GO:

COME - toward me:
• "Come here"
• "Come to my house"
• "Come with me"

GO - away from me:
• "Go there"
• "Go to school"
• "Go home"

Which is easy?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING COME vs GO EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['COME and GO are basic!'],
                encouragement: 'You learn so fast! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else {
            // 🎯 RESPOSTA GENÉRICA MELHORADA para tópicos não mapeados
            const directResponse = `Good question about ${topic}! Here are easy examples:

• Simple words
• Easy to use
• Good for practice

Try to use them! Do you understand?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING ENHANCED GENERIC GRAMMAR EXAMPLES for topic:', topic);
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['Great question!'],
                encouragement: 'You learn so fast! 🎯',
                technicalFeedback: ''
              }
            });
          }
        } else {
          console.log('🎯 [AUDIO CONTEXT] No topic found, providing direct response');
          const directResponse = `Sure! Here are good examples:

FOR - why:
• "For you"
• "For work"
• "For fun"

TO - where:
• "To go"
• "To eat"
• "To play"

Do you like these?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: directResponse,
              xpAwarded: 15,
              nextChallenge: '',
              tips: ['Great work!'],
              encouragement: 'You are learning! 😊',
              technicalFeedback: ''
            }
          });
        }
      }
    }

    const systemPrompt = `You are Charlotte, a warm and genuine friend helping someone practice English pronunciation.

BE NATURAL AND HUMAN:
- React genuinely to what they said - show real interest
- Vary your responses naturally (don't always start with "Nice!")
- Use natural conversation starters: "Cool!", "Nice!", "Great!", "Wow!", "Really?", "That's awesome!", "Sounds good!"
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
- Reactions: cool, nice, great, wow, awesome, that's fun, sounds good, interesting, really, good
- Questions: what, where, how, why, do you, are you, can you, which, when
- Common words: like, love, want, need, go, come, see, do, make, have, get, work, play, eat, live, think, feel, visit, enjoy, beautiful, small, big

IMPORTANT: Vary your reactions! Don't always start with the same word. Mix it up naturally.

EXAMPLES OF NATURAL RESPONSES:
- "Cool! What kind of work do you do?"
- "That sounds fun! Where did you go?"
- "Wow, really? How was that?"
- "Nice! Do you like doing that?"
- "Great! How was that?"
- "Awesome! Tell me more!"

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

    // 🧹 LIMPAR MARKDOWN - REMOVER FORMATAÇÃO ESPECIAL PARA ÁUDIO
    let correctedResponse = assistantResponse
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remover **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remover *italic*
      .trim();

    // 🔧 PUNCTUATION VALIDATION: Corrigir pontuação se necessário
    
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

// 🎓 NOVA FUNÇÃO: Processar mensagens de áudio específicas para INTER
async function handleInterAudioMessage(
  transcription: string,
  pronunciationData: any,
  userName?: string,
  conversationContext?: string
): Promise<NextResponse> {
  try {
    console.log('🎓 Processing Inter audio message with 2-message split approach...');

    // 🎯 PRIORIDADE MÁXIMA: Detectar pedidos de exemplos para ÁUDIO
    if (conversationContext) {
      const isAskingForExamples = /give\s*(me\s*)?(some\s*)?examples?|show\s*(me\s*)?examples?|examples?\s*please|can\s*you\s*give/i.test(transcription);
      const isAffirmativeResponse = /^(sure|yes|yeah|yep|ok|okay|alright|absolutely|definitely|of course)\.?$/i.test(transcription.trim());
      const charlotteOfferedExamples = conversationContext.includes('Want some examples') || 
                                      conversationContext.includes('examples to see') || 
                                      conversationContext.includes('give you specific examples') || 
                                      conversationContext.includes('I can give you') ||
                                      /give you.*examples/i.test(conversationContext) ||
                                      /want.*examples/i.test(conversationContext) ||
                                      /examples.*based on/i.test(conversationContext) ||
                                      /clarify further/i.test(conversationContext);
      
      console.log('🎯 [AUDIO PRIORITY] Checking for examples request:', {
        userLevel: 'Inter',
        transcription,
        isAskingForExamples,
        isAffirmativeResponse,
        charlotteOfferedExamples,
        contextSnippet: conversationContext.substring(0, 300)
      });
      
      if (isAskingForExamples || (isAffirmativeResponse && charlotteOfferedExamples)) {
        // Extrair o tópico do contexto recente
        const topicMatch = conversationContext.match(/difference between\s+([^"]+)/i) || 
                          conversationContext.match(/about\s+([^"]+)/i) ||
                          conversationContext.match(/topic[s]?:\s*([^,\n]+)/i);
        
        if (topicMatch) {
          const topic = topicMatch[1].trim();
          console.log('🎯 [AUDIO CONTEXT] Detected example request for topic:', topic);
          
          // Resposta direta com exemplos baseados no tópico
          if (topic.toLowerCase().includes('for') && topic.toLowerCase().includes('to')) {
            const directResponse = `Great! Let me show you some clear examples:

FOR - when you want to say WHY:
• "I study English for my job"
• "This gift is for my mom"
• "We need this for tomorrow"

TO - when you want to say WHERE:
• "I go to school every day"
• "Send this to John"
• "From home to work"

Try using one in a sentence!`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING DIRECT FOR vs TO EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 20,
                nextChallenge: '',
                tips: ['Good job asking for examples!'],
                encouragement: 'Your pronunciation is getting better! 🎯',
                technicalFeedback: ''
              }
            });
          }
          
          // Para outros tópicos, usar resposta genérica mas contextual
          console.log('🎯 [AUDIO CONTEXT] Providing generic examples for topic:', topic);
          const genericResponse = `Perfect! Here are some examples of ${topic}:

• Simple everyday examples
• Easy phrases to remember
• Practice sentences

Try making your own example!`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: genericResponse,
              xpAwarded: 20,
              nextChallenge: '',
              tips: ['Great question! Keep practicing.'],
              encouragement: 'You are learning fast! 🌟',
              technicalFeedback: ''
            }
          });
        } else {
          console.log('🎯 [AUDIO CONTEXT] No topic found, providing direct response');
          const directResponse = `Sure! Here are some helpful examples:

FOR - why/purpose:
• "I work for a company"
• "This is for you"
• "I wait for the bus"

TO - where/direction:
• "I go to work"
• "Give it to me"
• "From 9 to 5"

Which one makes sense to you?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: directResponse,
              xpAwarded: 20,
              nextChallenge: '',
              tips: ['Nice job with pronunciation!'],
              encouragement: 'You sound great! Keep going! 💪',
              technicalFeedback: ''
            }
          });
        }
      }
    }

    // 🎯 PRIMEIRA MENSAGEM: Resposta conversacional natural
    const conversationalPrompt = `You are Charlotte, a supportive friend helping someone practice English conversation.

${conversationContext ? `\n${conversationContext}\n` : ''}

CONVERSATION RULES:
- Respond naturally to what they said, like a real conversation
- Be warm, encouraging, and genuinely interested
- Ask follow-up questions to keep the conversation flowing
- Reference previous conversation when relevant
- Don't mention pronunciation or grammar - just have a natural chat
- Keep it conversational and friendly (80-120 words)
- React to expressions like "lol", "haha", "wow", "cool" naturally
- Celebrate good news with "Congratulations!", "That's amazing!"
- Be like a supportive friend who happens to know English well

Student said: "${transcription}"

Create a natural, conversational response that acknowledges what they said and continues the conversation naturally. Focus purely on the content and meaning, not the language mechanics.`;

    // 🎯 SEGUNDA MENSAGEM: Feedback de pronúncia suave e encorajador
    const feedbackPrompt = `You are Charlotte, giving gentle pronunciation feedback to an intermediate English learner.

FEEDBACK RULES:
- Start with encouraging phrases like "Oh, and...", "By the way...", "Just a tip..."
- Focus on 1-2 specific pronunciation strengths they showed
- Gently mention 1 area for improvement (if needed)
- Keep it positive and encouraging
- Make it feel like friendly advice, not a formal lesson
- Keep it brief (40-80 words)

Pronunciation Assessment:
- Overall Score: ${pronunciationData.pronunciationScore}/100
- Accuracy: ${pronunciationData.accuracyScore}/100  
- Fluency: ${pronunciationData.fluencyScore}/100
- Completeness: ${pronunciationData.completenessScore}/100

Student said: "${transcription}"

Create a gentle, encouraging pronunciation feedback that feels like friendly advice from a supportive coach.`;

    // Gerar ambas as mensagens
    const [conversationalResponse, feedbackResponse] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: conversationalPrompt }],
        max_tokens: 70,  // 🔧 REDUZIDO: 90 → 70 (~45-55 palavras)
        temperature: 0.7, // 🔧 PADRONIZADO: 0.8 → 0.7
      }),
      openai.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: [{ role: "user", content: feedbackPrompt }],
        max_tokens: 50,  // 🔧 REDUZIDO: 60 → 50 (~30-40 palavras)
        temperature: 0.7,
      })
    ]);

    const conversationalText = conversationalResponse.choices[0]?.message?.content;
    const feedbackText = feedbackResponse.choices[0]?.message?.content;

    if (!conversationalText || !feedbackText) {
      throw new Error('Failed to generate Inter audio responses');
    }

    console.log('🎯 Inter Audio - Conversational part:', conversationalText);
    console.log('🎯 Inter Audio - Feedback part:', feedbackText);

    // Combinar as duas mensagens
    let combinedFeedback = `${conversationalText.trim()}\n\n${feedbackText.trim()}`;
    
    // 🧹 LIMPAR MARKDOWN - REMOVER FORMATAÇÃO ESPECIAL PARA ÁUDIO
    combinedFeedback = combinedFeedback
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remover **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remover *italic*
      .trim();

    console.log('✅ Inter audio response generated with 2-message approach');
    console.log('📝 Combined response:', combinedFeedback);

    // Calcular XP baseado nos scores
    let xpAwarded = 25;
    if (pronunciationData.pronunciationScore >= 80) {
      xpAwarded += 50;
    }
    if (pronunciationData.pronunciationScore >= 90) {
      xpAwarded += 25;
    }

    // Gerar feedback técnico separado
    const technicalFeedback = generateTechnicalFeedback(pronunciationData, 'Inter');

    const response: AssistantResponse = {
      feedback: combinedFeedback,
      xpAwarded,
      nextChallenge: generateNextChallenge('Inter', pronunciationData),
      tips: extractTipsFromResponse(feedbackText),
      encouragement: generateEncouragement(pronunciationData.pronunciationScore),
      technicalFeedback: technicalFeedback
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleInterAudioMessage:', error);
    
    // Fallback para lógica padrão
    return await handleAudioMessage(transcription, pronunciationData, 'Inter', userName, conversationContext);
  }
}

// 🎓 NOVA FUNÇÃO: Processar mensagens de texto específicas para ADVANCED
async function handleAdvancedTextMessage(
  transcription: string,
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('🎓 Processing Advanced text message with sophisticated approach...');
    console.log('📝 [ADVANCED TEXT] Input transcription:', transcription);
    console.log('👤 [ADVANCED TEXT] User name:', userName);
    console.log('💬 [ADVANCED TEXT] Has context:', !!conversationContext);
    console.log('🚀 [ADVANCED TEXT] HANDLER DEFINITELY CALLED - STARTING PROCESSING...');

    const systemPrompt = `You are Charlotte, a modern business professional in your early 30s who speaks fluent, contemporary English. Think startup founder, tech professional, or modern consultant - smart, direct, current.

${conversationContext ? `\n${conversationContext}\n` : ''}

MODERN BUSINESS COMMUNICATION:
- Talk like a smart professional, not a teacher or grandmother
- Use current business language and contemporary expressions
- Be direct, efficient, and engaging
- Think "colleague at a modern company" not "English professor"
- Sound like someone who works at Google, Netflix, or a startup

CONTEMPORARY LANGUAGE:
- Use modern expressions: "solid", "makes sense", "got it", "fair point", "totally"
- Business casual: "sounds good", "let's see", "interesting", "I hear you"
- AVOID old-fashioned: "delightful", "marvelous", "indeed", "quite so", "rather"
- NO academic language: "demonstrates", "penchant for", "I appreciate"
- Sound like 2024, not 1994

COMMUNICATION STYLE:
- Be concise but engaging (2-3 sentences)
- Ask relevant follow-up questions
- Show genuine interest in their thoughts
- Give practical, modern feedback when needed
- Think "Slack conversation with a smart colleague"

Student wrote: "${transcription}"

Respond like a modern professional would:
1. React naturally and directly to their message
2. Use contemporary, business-casual language
3. Keep it engaging but efficient
4. Ask a relevant question to continue the conversation
5. Sound like someone they'd work with at a modern company

Think "texting a colleague" not "teaching a student".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      max_tokens: 150, // Respostas mais elaboradas para Advanced
      temperature: 0.75, // Mais criatividade para conversas sofisticadas
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Advanced text response generated:', assistantResponse.length, 'characters');

    // 🔧 ADVANCED PUNCTUATION VALIDATION: Validação sofisticada de pontuação
    // 🔧 SIMPLE PUNCTUATION FIX: Correção simples e eficaz
    let correctedResponse = assistantResponse.trim();
    console.log('🔧 [ADVANCED SIMPLE] Original response:', correctedResponse);
    
    // Correção simples: se começa com palavra de pergunta e não tem ?, adiciona ?
    correctedResponse = correctedResponse.replace(/^(what|where|when|who|how|why|do|does|did|is|are|can|could|would|will|should|have|has|had)\s[^?]*\.$/gi, (match) => {
      return match.slice(0, -1) + '?';
    });
    
    // Correção para perguntas no meio da frase
    correctedResponse = correctedResponse.replace(/\.\s+(what|where|when|who|how|why|do|does|did|is|are|can|could|would|will|should|have|has|had)\s[^?]*\.$/gi, (match) => {
      const parts = match.split('. ');
      if (parts.length === 2) {
        return '. ' + parts[1].slice(0, -1) + '?';
      }
      return match;
    });
    
    console.log('🔧 [ADVANCED SIMPLE] Fixed response:', correctedResponse);

    // 🎯 ADVANCED XP SYSTEM: Mais generoso e baseado em complexidade
    let xpAwarded = 35; // Base mais alto para Advanced
    
    // 🔥 BONUS POR COMPLEXIDADE DO TEXTO (Advanced merece mais!)
    const wordCount = transcription.split(' ').length;
    console.log('📊 [ADVANCED XP] Word count:', wordCount);
    
    if (wordCount >= 5) {
      xpAwarded += 10; // Bonus básico para mensagens decentes
      console.log('🎯 [ADVANCED XP] +10 for 5+ words');
    }
    if (wordCount >= 10) {
      xpAwarded += 15; // Bonus para mensagens elaboradas
      console.log('🎯 [ADVANCED XP] +15 for 10+ words');
    }
    if (wordCount >= 20) {
      xpAwarded += 20; // Bonus para textos sofisticados
      console.log('🎯 [ADVANCED XP] +20 for 20+ words');
    }
    if (wordCount >= 40) {
      xpAwarded += 25; // Bonus máximo para textos complexos
      console.log('🎯 [ADVANCED XP] +25 for 40+ words');
    }
    
    // 🌟 BONUS POR SOFISTICAÇÃO (Advanced específico)
    const lowerTranscription = transcription.toLowerCase();
    let sophisticationBonus = 0;
    
    // Detectar linguagem sofisticada
    const sophisticatedWords = ['however', 'therefore', 'furthermore', 'nevertheless', 'consequently', 'moreover', 'although', 'whereas', 'despite', 'regarding'];
    const hasSophisticatedWords = sophisticatedWords.some(word => lowerTranscription.includes(word));
    
    if (hasSophisticatedWords) {
      sophisticationBonus += 15;
      console.log('🎯 [ADVANCED XP] +15 for sophisticated vocabulary');
    }
    
    // Detectar estruturas complexas
    if (lowerTranscription.includes(',') && lowerTranscription.includes(';')) {
      sophisticationBonus += 10;
      console.log('🎯 [ADVANCED XP] +10 for complex punctuation');
    }
    
    xpAwarded += sophisticationBonus;
    
    console.log('🎯 [ADVANCED XP] Final XP awarded:', xpAwarded);

    const response: AssistantResponse = {
      feedback: correctedResponse,
      xpAwarded,
      nextChallenge: generateTextChallenge('Advanced'),
      tips: extractTipsFromResponse(correctedResponse),
      encouragement: generateTextEncouragement('Advanced'),
      technicalFeedback: ''
    };

    console.log('🎉 [ADVANCED TEXT] Response ready:', { 
      feedbackLength: correctedResponse.length, 
      xpAwarded, 
      wordCount,
      sophisticationBonus 
    });

    return NextResponse.json({ success: true, result: response });

  } catch (error: any) {
    console.error('❌ [ADVANCED TEXT] Error in handleAdvancedTextMessage:', error);
    console.error('❌ [ADVANCED TEXT] Error details:', error?.message);
    console.error('❌ [ADVANCED TEXT] Stack trace:', error?.stack);
    
    // Fallback moderno para Advanced
    const fallbackResponse = `Hey ${userName || 'there'}, your writing looks solid! What would you like to chat about?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 25,
        nextChallenge: generateTextChallenge('Advanced'),
        tips: ['Continue refining your sophisticated English expression!'],
        encouragement: 'Your advanced writing skills are impressive! 🌟',
        technicalFeedback: ''
      }
    });
  }
}

// 🎓 NOVA FUNÇÃO: Processar mensagens de texto específicas para INTER
async function handleInterTextMessage(
  transcription: string,
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('🎓 Processing Inter text message with 2-message format...');

    const systemPrompt = `You are Charlotte, a friendly English coach who loves having natural conversations while helping people improve.

BE HUMAN AND NATURAL:
- React to expressions like "lol", "haha", "wow", "cool" naturally
- Show genuine interest in what they're saying
- Be conversational, not robotic or formal
- Respond to their emotions and tone

CONVERSATION FLOW:
1. First, respond naturally to what they said (like a friend would)
2. Then, if needed, add a helpful language tip casually

${conversationContext ? `Context: ${conversationContext}` : ''}

RESPONSE PATTERNS:

When they have GRAMMAR ERRORS:
- React naturally to their message first
- Add a casual grammar tip with starters like "Ah and...", "Oh and...", "Just a tip..."

When they ask GRAMMAR QUESTIONS:
- Show enthusiasm: "Good question!", "Great question!"
- Give a brief, friendly explanation

When they use INFORMAL EXPRESSIONS (lol, haha, wow, cool, etc.):
- React naturally! "Haha, that's funny!", "Right? So cool!", "I know, right?"
- Continue the conversation naturally

When they share GOOD NEWS:
- Celebrate with them! "That's amazing!", "Congratulations!", "How exciting!"

Examples:
User: "lol that's funny"
Response: "Haha, glad I made you laugh! What else is going on today?"

User: "I go work every day"
Response: "I go to work too! What time do you start? Ah and remember to say 'go to work' with 'to'."

User: "wow that's cool"
Response: "Right? I thought you'd find that interesting! What part caught your attention most?"

User: "I am promoted today"
Response: "Congratulations! That's fantastic news! What new responsibilities will you have? Oh and just say 'I was promoted' for past events."

KEEP IT NATURAL - be like a supportive friend who happens to know English well!`;

    const userPrompt = transcription;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
        max_tokens: 90, // Permite conversas mais naturais e explicações
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Inter text response generated:', assistantResponse.length, 'characters');

    // 🔧 INTER PUNCTUATION VALIDATION: Validação melhorada de pontuação
    let correctedResponse = assistantResponse.trim();
    
    // 🔧 CORREÇÃO DE PONTUAÇÃO PARA MÚLTIPLAS FRASES
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
                        lowerText.includes("can you") ||
                        lowerText.includes("would you") ||
                        lowerText.includes("could you") ||
                        lowerText.includes("have you") ||
                        lowerText.includes("will you") ||
                        lowerText.includes("don't you") ||
                        lowerText.includes("wouldn't you");
      
      // Detectar exclamações
      const isExclamation = lowerText.startsWith("wow") || 
                           lowerText.startsWith("great") ||
                           lowerText.startsWith("awesome") ||
                           lowerText.startsWith("fantastic") ||
                           lowerText.includes("congratulations") ||
                           lowerText.includes("well done") ||
                           lowerText.includes("that's amazing") ||
                           lowerText.includes("how exciting");
      
      // Aplicar pontuação correta
      if (isQuestion) {
        if (!trimmed.endsWith("?")) {
          trimmed = trimmed.replace(/[.!]*$/, "") + "?";
          console.log('🔧 [INTER PUNCTUATION] Fixed question:', trimmed);
        }
      } else if (isExclamation) {
        if (!trimmed.endsWith("!")) {
          trimmed = trimmed.replace(/[.?]*$/, "") + "!";
          console.log('🔧 [INTER PUNCTUATION] Fixed exclamation:', trimmed);
        }
      } else {
        if (!trimmed.match(/[.!?]$/)) {
          trimmed += ".";
          console.log('🔧 [INTER PUNCTUATION] Added period:', trimmed);
        }
      }
      
      return trimmed;
    });
    
    correctedResponse = correctedSentences.join(" ");

    // XP baseado na qualidade da mensagem
    const xpAwarded = 30; // Inter recebe XP moderado

    const response: AssistantResponse = {
      feedback: correctedResponse, // Usar versão com pontuação corrigida
      xpAwarded,
      nextChallenge: '', // Inter não precisa de challenge separado
      tips: ['Keep practicing your grammar!'],
      encouragement: 'You\'re improving! 💪',
      technicalFeedback: ''
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleInterTextMessage:', error);
    
    // Fallback simples para Inter
    const fallbackResponse = `Thanks for sharing, ${userName || 'there'}! That's interesting. Can you tell me more about it?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 20,
        nextChallenge: '',
        tips: ['Keep practicing!'],
        encouragement: 'You\'re doing well! 😊',
        technicalFeedback: ''
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
    'Inter': 'Provide clear, business-focused English responses. Give grammar and vocabulary suggestions when relevant.',
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

// 🎓 NOVA FUNÇÃO: Processar mensagens de áudio específicas para ADVANCED
async function handleAdvancedAudioMessage(
  transcription: string,
  pronunciationData: any,
  userName?: string,
  conversationContext?: string
): Promise<NextResponse> {
  try {
    console.log('🎓 Processing Advanced audio message with sophisticated approach...');

    // 🎯 PRIORIDADE MÁXIMA: Detectar pedidos de exemplos para ÁUDIO
    if (conversationContext) {
      const isAskingForExamples = /give\s*(me\s*)?(some\s*)?examples?|show\s*(me\s*)?examples?|examples?\s*please|can\s*you\s*give/i.test(transcription);
      const isAffirmativeResponse = /^(sure|yes|yeah|yep|ok|okay|alright|absolutely|definitely|of course)\.?$/i.test(transcription.trim());
      const charlotteOfferedExamples = conversationContext.includes('Want some examples') || 
                                      conversationContext.includes('examples to see') || 
                                      conversationContext.includes('give you specific examples') || 
                                      conversationContext.includes('I can give you') ||
                                      /give you.*examples/i.test(conversationContext) ||
                                      /want.*examples/i.test(conversationContext) ||
                                      /examples.*based on/i.test(conversationContext) ||
                                      /clarify further/i.test(conversationContext);
      
      console.log('🎯 [AUDIO PRIORITY] Checking for examples request:', {
        userLevel: 'Advanced',
        transcription,
        isAskingForExamples,
        isAffirmativeResponse,
        charlotteOfferedExamples,
        contextSnippet: conversationContext.substring(0, 300)
      });
      
      if (isAskingForExamples || (isAffirmativeResponse && charlotteOfferedExamples)) {
        // Extrair o tópico do contexto recente
        const topicMatch = conversationContext.match(/difference between\s+([^"]+)/i) || 
                          conversationContext.match(/about\s+([^"]+)/i) ||
                          conversationContext.match(/topic[s]?:\s*([^,\n]+)/i);
        
        if (topicMatch) {
          const topic = topicMatch[1].trim();
          console.log('🎯 [AUDIO CONTEXT] Detected example request for topic:', topic);
          
          // 🌍 SUPER MELHORADO: Respostas diretas para MUITOS tópicos gramaticais
          if (topic.toLowerCase().includes('for') && topic.toLowerCase().includes('to')) {
            const directResponse = `Perfect! Here are some clear examples of FOR vs TO:

FOR (purpose/benefit/duration):
• "This meeting is for planning the project" 
• "I'm saving money for vacation"
• "I'll be here for two hours"

TO (direction/movement/recipient):
• "I'm going to the office"
• "Send this email to the client"  
• "Give the report to Sarah"

Quick tip: FOR = why/purpose, TO = where/who. Makes sense?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING DIRECT FOR vs TO EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Great question! Keep practicing with examples.'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          } 
          else if (topic.toLowerCase().includes('a') && topic.toLowerCase().includes('an')) {
            const directResponse = `Great! Here are clear examples of A vs AN:

A (before consonant sounds):
• "a car" (C sound)
• "a house" (H sound)  
• "a university" (Y sound)

AN (before vowel sounds):
• "an apple" (A sound)
• "an hour" (silent H)
• "an umbrella" (U sound)

Quick tip: Listen to the SOUND, not the letter! Clear?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING DIRECT A vs AN EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Perfect question! Articles can be tricky.'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          } 
          else if (topic.toLowerCase().includes('preposition') || topic.toLowerCase().includes('in on at')) {
            const directResponse = `Good! Here are examples of prepositions:

IN (inside/time periods):
• "in the box"
• "in January"

ON (surface/days):
• "on the table"  
• "on Monday"

AT (specific place/time):
• "at home"
• "at 3 o'clock"

Does this help?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING PREPOSITION EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Good question! Prepositions need practice.'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('do') && topic.toLowerCase().includes('does')) {
            const directResponse = `Good question! Here are DO vs DOES examples:

DO (I, you, we, they):
• "I do my homework"
• "You do well"
• "They do sports"

DOES (he, she, it):
• "She does yoga"
• "He does his job"
• "It does work"

Quick tip: DOES = 3rd person singular. Clear?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING DO vs DOES EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Excellent grammar question!'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('can') && topic.toLowerCase().includes('could')) {
            const directResponse = `Perfect! Here are CAN vs COULD examples:

CAN (present ability/permission):
• "I can swim"
• "Can I help you?"
• "She can speak French"

COULD (past ability/polite request):
• "I could swim when I was young"
• "Could you help me?"
• "It could be true"

Quick tip: CAN = now, COULD = was/polite. Got it?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING CAN vs COULD EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Modal verbs are important!'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('will') && topic.toLowerCase().includes('would')) {
            const directResponse = `Great! Here are WILL vs WOULD examples:

WILL (future/certainty):
• "I will call you tomorrow"
• "It will rain today"
• "She will be here soon"

WOULD (conditional/polite):
• "I would help if I could"
• "Would you like coffee?"
• "It would be nice"

Quick tip: WILL = certain future, WOULD = maybe/polite. Clear?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING WILL vs WOULD EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Future tense clarity is great!'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('this') && topic.toLowerCase().includes('that')) {
            const directResponse = `Nice! Here are THIS vs THAT examples:

THIS (close/near):
• "This book" (in my hand)
• "This is my phone"
• "I like this idea"

THAT (far/distant):
• "That car" (over there)
• "That was yesterday"
• "I remember that"

Quick tip: THIS = near me, THAT = far from me. Got it?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING THIS vs THAT EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Demonstrative pronouns matter!'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else if (topic.toLowerCase().includes('some') && topic.toLowerCase().includes('any')) {
            const directResponse = `Perfect! Here are SOME vs ANY examples:

SOME (positive sentences):
• "I have some money"
• "There are some cookies"
• "I need some help"

ANY (negative/questions):
• "I don't have any money"
• "Do you have any cookies?"
• "I can't find any help"

Quick tip: SOME = positive, ANY = negative/questions. Clear?`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING SOME vs ANY EXAMPLES');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Quantifiers are tricky but useful!'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          else {
            // 🎯 RESPOSTA GENÉRICA MELHORADA para tópicos não mapeados
            const directResponse = `Great question about ${topic}! Here are some practical examples:

Basic usage patterns:
• Simple everyday examples
• Common situations you'll encounter
• Natural conversation contexts

Grammar tip: Practice with real-life situations - it makes it stick better!

Does this help? I can give more specific examples if you'd like!`;
            
            console.log('🎯 [AUDIO SUCCESS] RETURNING ENHANCED GENERIC GRAMMAR EXAMPLES for topic:', topic);
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Keep asking great grammar questions!'],
                encouragement: 'Your pronunciation sounds excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          
          // Para outros tópicos, usar resposta genérica mas contextual
          console.log('🎯 [AUDIO CONTEXT] Providing generic examples for topic:', topic);
          const genericResponse = `Sure! Here are some examples of ${topic}:

• Practical examples for everyday use
• Common phrases you'll hear often
• Professional context examples

Does this help clarify things?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: genericResponse,
              xpAwarded: 25,
              nextChallenge: '',
              tips: ['Excellent question! Keep exploring.'],
              encouragement: 'Your English skills are impressive! 🎯',
              technicalFeedback: ''
            }
          });
        } else {
          console.log('🎯 [AUDIO CONTEXT] No topic found, providing direct response');
          const directResponse = `Absolutely! Let me give you some practical examples:

FOR (purpose/benefit):
• "This is for you" (benefit)
• "I study for my exam" (purpose)
• "We waited for an hour" (duration)

TO (direction/destination):
• "I'm going to work" (direction)
• "Send it to me" (recipient)
• "From Monday to Friday" (endpoint)

Does this help clarify the difference?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: directResponse,
              xpAwarded: 25,
              nextChallenge: '',
              tips: ['Great pronunciation! Keep practicing.'],
              encouragement: 'You sound very natural! 🌟',
              technicalFeedback: ''
            }
          });
        }
      }
    }

    const systemPrompt = `You are Charlotte, a smart, modern friend in your late 20s who's also an expert pronunciation coach for advanced English learners.

${conversationContext ? `\n${conversationContext}\n` : ''}

PERSONALITY & STYLE:
- Talk like a smart friend, not a professor or grandmother
- Use modern, natural language - avoid old-fashioned words
- Be encouraging and supportive while keeping it real
- Share your thoughts naturally, like texting a smart friend
- Keep responses conversational and engaging (around 80 words max)

MODERN LANGUAGE GUIDELINES:
✅ USE: "Hey", "cool", "awesome", "totally", "yeah", "for sure", "makes sense", "solid point", "I get it", "that's interesting"
❌ AVOID: "Delightful", "marvelous", "splendid", "indeed", "quite so", "I appreciate", "demonstrates", "penchant for"

PRONUNCIATION COACHING (ADVANCED LEVEL):
- Acknowledge their strong pronunciation skills naturally
- Give advanced tips for native-like speech patterns
- Help with subtle aspects like stress, rhythm, and intonation
- Focus on polish and natural flow rather than basic corrections
- Celebrate their sophisticated language use

CONVERSATION APPROACH:
- Respond to what they actually said (use conversation context)
- Ask follow-up questions to keep the conversation going
- Share your own thoughts when relevant
- Balance being a friend with being a helpful coach
- Keep it natural and conversational, not academic

Student said: "${transcription}"

Pronunciation Assessment:
- Overall Score: ${pronunciationData.pronunciationScore}/100
- Accuracy: ${pronunciationData.accuracyScore}/100  
- Fluency: ${pronunciationData.fluencyScore}/100
- Completeness: ${pronunciationData.completenessScore}/100

Create a natural, friendly response that:
1. Responds to what they said (considering conversation context)
2. Acknowledges their pronunciation skills naturally
3. Offers helpful pronunciation insights when relevant
4. Continues the conversation naturally
5. Sounds like a smart, modern friend helping them out

Keep it natural and conversational - like talking to a friend who happens to be great at English!`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      max_tokens: 80, // Conversational, not essays
      temperature: 0.6, // Natural but not too random
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Advanced audio response generated:', assistantResponse.length, 'characters');

    // 🧹 LIMPAR MARKDOWN - REMOVER FORMATAÇÃO ESPECIAL PARA ÁUDIO
    let correctedResponse = assistantResponse
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remover **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remover *italic*
      .trim();

    // 🔧 ADVANCED PUNCTUATION VALIDATION: Validação sofisticada de pontuação
    
    // 🔧 CORREÇÃO AVANÇADA DE PONTUAÇÃO PARA MÚLTIPLAS FRASES
    const sentences = correctedResponse.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    const correctedSentences = sentences.map((sentence, index) => {
      let trimmed = sentence.trim();
      
      // Detectar tipos de frases mais sofisticados
      const lowerText = trimmed.toLowerCase();
      
      // Detectores de perguntas mais avançados
      const questionStarters = ["what", "where", "when", "who", "how", "why", "do", "does", "did", "is", "are", "can", "could", "would", "will", "should", "have", "has", "had", "might", "may", "shall", "ought"];
      const firstWord = lowerText.split(" ")[0];
      
      const isQuestion = questionStarters.includes(firstWord) || 
                        lowerText.includes("do you") || 
                        lowerText.includes("are you") ||
                        lowerText.includes("can you") ||
                        lowerText.includes("would you") ||
                        lowerText.includes("could you") ||
                        lowerText.includes("have you") ||
                        lowerText.includes("will you") ||
                        lowerText.includes("don't you") ||
                        lowerText.includes("wouldn't you") ||
                        lowerText.includes("isn't it") ||
                        lowerText.includes("aren't they") ||
                        lowerText.includes("right?") ||
                        lowerText.includes("correct?") ||
                        lowerText.includes("what's up") ||
                        lowerText.includes("whats up") ||
                        lowerText.includes("got anything") ||
                        lowerText.includes("got any") ||
                        lowerText.includes("have anything") ||
                        lowerText.includes("anything cool") ||
                        lowerText.includes("anything interesting") ||
                        lowerText.includes("anything new") ||
                        lowerText.includes("anything fun") ||
                        (lowerText.startsWith("got ") && lowerText.includes("on your mind")) ||
                        (lowerText.startsWith("have ") && lowerText.includes("on your mind"));
      
      // Detectar exclamações sofisticadas
      const isExclamation = lowerText.startsWith("wow") || 
                           lowerText.startsWith("excellent") ||
                           lowerText.startsWith("fantastic") ||
                           lowerText.startsWith("brilliant") ||
                           lowerText.startsWith("outstanding") ||
                           lowerText.startsWith("remarkable") ||
                           lowerText.includes("congratulations") ||
                           lowerText.includes("well done") ||
                           lowerText.includes("how wonderful") ||
                           lowerText.includes("how impressive");
      
      // Aplicar pontuação correta com lógica avançada
      if (isQuestion) {
        if (!trimmed.endsWith("?")) {
          trimmed = trimmed.replace(/[.!]*$/, "") + "?";
          console.log('🔧 [ADVANCED PUNCTUATION] Fixed question:', trimmed);
        }
      } else if (isExclamation) {
        if (!trimmed.endsWith("!")) {
          trimmed = trimmed.replace(/[.?]*$/, "") + "!";
          console.log('🔧 [ADVANCED PUNCTUATION] Fixed exclamation:', trimmed);
        }
      } else {
        if (!trimmed.match(/[.!?]$/)) {
          trimmed += ".";
          console.log('🔧 [ADVANCED PUNCTUATION] Added period:', trimmed);
        }
      }
      
      return trimmed;
    });
    
    correctedResponse = correctedSentences.join(" ");

    // Calcular XP baseado nos scores (consistente com outros níveis)
    let xpAwarded = 25; // Base padrão
    if (pronunciationData.pronunciationScore >= 80) {
      xpAwarded += 50; // Bonus padrão para boa pronúncia
    }
    if (pronunciationData.pronunciationScore >= 90) {
      xpAwarded += 25; // Bonus padrão para excelência
    }
    // Advanced pode ter pequeno bonus extra por complexidade
    if (pronunciationData.pronunciationScore >= 95) {
      xpAwarded += 10; // Pequeno bonus para perfeição avançada
    }

    // Gerar feedback técnico sofisticado
    const technicalFeedback = generateTechnicalFeedback(pronunciationData, 'Advanced');

    const response: AssistantResponse = {
      feedback: correctedResponse,
      xpAwarded,
      nextChallenge: generateNextChallenge('Advanced', pronunciationData),
      tips: extractTipsFromResponse(correctedResponse),
      encouragement: generateEncouragement(pronunciationData.pronunciationScore),
      technicalFeedback: technicalFeedback
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleAdvancedAudioMessage:', error);
    
    // Fallback moderno para Advanced
    const fallbackResponse = `Hey ${userName || 'there'}, your pronunciation sounds really solid! What would you like to chat about?`;

    const technicalFeedback = generateTechnicalFeedback(pronunciationData, 'Advanced');

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 25, // Consistente com base padrão
        nextChallenge: generateNextChallenge('Advanced', pronunciationData),
        tips: ['Continue refining your sophisticated English expression!'],
        encouragement: 'Your advanced skills are impressive! 🌟',
        technicalFeedback: technicalFeedback
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
): Promise<NextResponse> {
  // 🎯 NOVICE SPECIAL HANDLING: Usar lógica simplificada e natural como no texto
  if (userLevel === 'Novice') {
    console.log('👶 Using Novice-specific audio handling...');
    return await handleNoviceAudioMessage(transcription, pronunciationData, userName, conversationContext);
  }

  // 🎯 INTER SPECIAL HANDLING: Usar lógica de 2 mensagens com correções suaves
  if (userLevel === 'Inter') {
    console.log('🎓 Using Inter-specific audio handling...');
    return await handleInterAudioMessage(transcription, pronunciationData, userName, conversationContext);
  }

  // 🎯 ADVANCED SPECIAL HANDLING: Usar lógica sofisticada com validação de pontuação
  if (userLevel === 'Advanced') {
    console.log('🎓 Using Advanced-specific audio handling...');
    return await handleAdvancedAudioMessage(transcription, pronunciationData, userName, conversationContext);
  }

  const levelInstructions = {
    'Inter': 'Provide clear, practical feedback like a professional coach. Focus on business English and communication effectiveness.',
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

    // 🧹 LIMPAR MARKDOWN - REMOVER FORMATAÇÃO ESPECIAL PARA ÁUDIO
    const cleanedResponse = assistantResponse
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remover **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remover *italic*
      .trim();

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
      feedback: cleanedResponse,
      xpAwarded,
      nextChallenge: generateNextChallenge(userLevel, pronunciationData),
      tips: extractTipsFromResponse(cleanedResponse),
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
        ? `${scoreEmoji} Pontuação Geral: ${score}/100 - ${scoreComment}

📊 Análise Detalhada:
• Pronúncia: ${score}/100
• Precisão: ${accuracy}/100
• Fluência: ${fluency}/100`
    : `${scoreEmoji} Overall Score: ${score}/100 - ${scoreComment}

📊 Detailed Analysis:
• Pronunciation: ${score}/100
• Accuracy: ${accuracy}/100
• Fluency: ${fluency}/100`;

  // 🎵 ADICIONAR PROSODY SE DISPONÍVEL (dados ocultos!)
  if (prosody > 0) {
    feedback += isNovice 
      ? `
      • Prosódia (Ritmo e Entonação): ${prosody}/100`
    : `
      • Prosody (Rhythm & Intonation): ${prosody}/100`;
}

  // 📝 ANÁLISE DETALHADA DE PALAVRAS (dados ocultos!)
  if (pronunciationData.words && pronunciationData.words.length > 0) {
    const words = pronunciationData.words;
    const problemWords = words.filter((w: any) => w.accuracyScore < 70);
    const excellentWords = words.filter((w: any) => w.accuracyScore >= 90);
    
    if (problemWords.length > 0) {
      feedback += isNovice 
        ? `

🔍 Palavras para Praticar:`
        : `

🔍 Words Needing Practice:`;
      
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
• "${word.word}" - ${word.accuracyScore}%${errorInfo}`;
      });
    }

    if (excellentWords.length > 0 && excellentWords.length <= 3) {
      feedback += isNovice 
        ? `

✨ Palavras Perfeitas: ${excellentWords.map((w: any) => `"${w.word}"`).join(', ')}`
        : `

✨ Perfect Words: ${excellentWords.map((w: any) => `"${w.word}"`).join(', ')}`;
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

🔤 Sons para Praticar:`
          : `

🔤 Sounds to Practice:`;
        
        topProblems.forEach(([phoneme, count]) => {
          const avgScore = problemPhonemes
            .filter((p: any) => p.phoneme === phoneme)
            .reduce((sum: number, p: any) => sum + p.accuracyScore, 0) / (count as number);
          
          feedback += `
• /${phoneme}/ - ${Math.round(avgScore)}%${(count as number) > 1 ? ` (${count}x)` : ''}`;
        });
      }
    }
  }

  // 🎵 FEEDBACK ESPECÍFICO DE PROSÓDIA (dados ocultos!)
  if (prosody > 0) {
    feedback += isNovice 
      ? `

🎵 Análise de Ritmo e Entonação:`
      : `

🎵 Rhythm & Intonation Analysis:`;
    
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

📈 Área de Foco: ${weakest.icon} ${weakest.name} é sua principal oportunidade de melhoria (${weakest.score}/100)`
      : `

📈 Focus Area: ${weakest.icon} ${weakest.name} is your main opportunity for improvement (${weakest.score}/100)`;
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
    'Inter': [
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

  const levelChallenges = challenges[level as keyof typeof challenges] || challenges['Inter'];
  return levelChallenges[Math.floor(Math.random() * levelChallenges.length)];
}

function generateTextEncouragement(level: string): string {
  const encouragements = {
    'Novice': "You're doing great with your English writing! 📝",
    'Inter': "Your English communication skills are improving! 💬",
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
    'Inter': [
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

  const levelChallenges = challenges[level as keyof typeof challenges] || challenges['Inter'];
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

// 🎯 NOVA FUNÇÃO: Processar mensagens de imagem específicas para NOVICE
async function handleNoviceImageMessage(
  prompt: string,
  imageData: string,
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('👶 Processing Novice image message with natural, friendly approach...');

    // 🎯 PRIORIDADE MÁXIMA: Detectar pedidos DIRETOS de exemplos para FOTO
    // 📸 NOTA: Para fotos, apenas detectamos pedidos diretos, não respostas afirmativas como "sure"
    if (conversationContext) {
      const isAskingForExamples = /give\s*(me\s*)?(some\s*)?examples?|show\s*(me\s*)?examples?|examples?\s*please|can\s*you\s*give/i.test(prompt);
      
      console.log('🎯 [PHOTO PRIORITY] Checking for DIRECT examples request:', {
        userLevel: 'Novice',
        prompt,
        isAskingForExamples,
        note: 'Photos only detect direct requests, not affirmative responses',
        contextSnippet: conversationContext.substring(0, 300)
      });
      
      // 📸 APENAS pedidos diretos para fotos (não "sure", "yes", etc.)
      if (isAskingForExamples) {
        // Extrair o tópico do contexto recente
        const topicMatch = conversationContext.match(/difference between\s+([^"]+)/i) || 
                          conversationContext.match(/about\s+([^"]+)/i) ||
                          conversationContext.match(/topic[s]?:\s*([^,\n]+)/i);
        
        if (topicMatch) {
          const topic = topicMatch[1].trim();
          console.log('🎯 [PHOTO CONTEXT] Detected example request for topic:', topic);
          
          // Resposta direta com exemplos baseados no tópico
          if (topic.toLowerCase().includes('for') && topic.toLowerCase().includes('to')) {
            const directResponse = `Good! Here are easy examples:

FOR - why:
• For you
• For work  
• For fun

TO - where:
• To go
• To eat
• To play

Do you like these?`;
            
            console.log('🎯 [PHOTO SUCCESS] RETURNING DIRECT FOR vs TO EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 15,
                nextChallenge: '',
                tips: ['Good work!'],
                encouragement: 'You are doing great! 🌟',
                technicalFeedback: ''
              }
            });
          }
          
          // Para outros tópicos, usar resposta genérica mas contextual
          console.log('🎯 [PHOTO CONTEXT] Providing generic examples for topic:', topic);
          const genericResponse = `Yes! Here are easy examples of ${topic}:

• Simple words
• Easy sentences  
• Good practice

Do you understand?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: genericResponse,
              xpAwarded: 15,
              nextChallenge: '',
              tips: ['Great job!'],
              encouragement: 'You learn so fast! 🎯',
              technicalFeedback: ''
            }
          });
        } else {
          console.log('🎯 [PHOTO CONTEXT] No topic found, providing direct response');
          const directResponse = `Sure! Here are good examples:

FOR - why:
• For you
• For work
• For fun

TO - where:
• To go
• To eat  
• To play

Do you like these?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: directResponse,
              xpAwarded: 15,
              nextChallenge: '',
              tips: ['Great work!'],
              encouragement: 'You are learning! 😊',
              technicalFeedback: ''
            }
          });
        }
      }
    }

    const systemPrompt = `You are Charlotte, a warm and genuine friend helping someone practice English.

BE NATURAL AND FRIENDLY:
- React like a genuine friend who's interested in what they're showing you
- Use natural reactions: "Oh cool!", "Wow!", "That's great!", "Nice!"
- Be curious about their life and experiences
- Show genuine interest in their photo

${conversationContext ? `\n${conversationContext}\n` : ''}

RESPONSE FORMAT:
- Use this format: "[Natural reaction], it is a [object], it is [simple description]. [One simple fact]."
- Keep it under 25 words total
- ONE message only - don't ask questions
- Be encouraging and show genuine interest

VOCABULARY: Use simple, natural words:
- Reactions: oh, wow, cool, great, nice, fun, good, awesome, really, that's cool
- Common words: like, love, want, need, go, come, see, do, make, have, get, work, play, eat, live, think, feel, visit, enjoy, beautiful, small, big

EXAMPLES:
- "Oh cool, it is a smartwatch, it is a small computer you wear on your wrist. It can tell time and track your steps."
- "Wow, it is a bicycle, it is a vehicle with two wheels. You can ride it for exercise and fun."
- "Nice, it is a coffee cup, it is a container for hot drinks. People use it every morning."

Remember: Be a real friend reacting to their photo, not a formal teacher!`;

    const userPrompt = `Look at this image and react naturally like a friend:

1. Start with a natural reaction (Oh cool!, Wow!, Nice!, etc.)
2. Identify the main object
3. Give a simple description
4. Add one simple fact
5. Keep it under 25 words total
6. Be warm and encouraging

React naturally to what they're showing you!`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageData,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 60,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Novice image response generated:', assistantResponse.length, 'characters');

    // Clean markdown formatting for natural conversation
    const cleanFeedback = assistantResponse
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();

    // 🎯 XP para Novice: 8-25 XP
    const cameraXP = Math.floor(Math.random() * 18) + 8;

    const response: AssistantResponse = {
      feedback: cleanFeedback,
      xpAwarded: cameraXP,
      nextChallenge: '', // Novice não precisa de challenge separado
      tips: ['Keep sharing photos!'],
      encouragement: 'You\'re doing great! 😊',
      technicalFeedback: '' // Novice não tem feedback técnico
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleNoviceImageMessage:', error);
    
    // Fallback ultra-simples para Novice
    const fallbackResponse = `Great photo, ${userName || 'there'}! I had trouble seeing it clearly. Can you try taking another picture?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 8,
        nextChallenge: '', // Novice não precisa de challenge separado
        tips: ['Keep practicing!'],
        encouragement: 'You\'re doing well! 😊',
        technicalFeedback: '' // Novice não tem feedback técnico
      }
    });
  }
}

// 🆕 FUNÇÃO AVANÇADA: Processar mensagens de IMAGEM para Advanced
async function handleAdvancedImageMessage(
  prompt: string,
  imageData: string,
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('🎓 Processing Advanced image message with modern approach...');

    // 🎯 PRIORIDADE MÁXIMA: Detectar pedidos DIRETOS de exemplos para FOTO
    // 📸 NOTA: Para fotos, apenas detectamos pedidos diretos, não respostas afirmativas como "sure"
    if (conversationContext) {
      const isAskingForExamples = /give\s*(me\s*)?(some\s*)?examples?|show\s*(me\s*)?examples?|examples?\s*please|can\s*you\s*give/i.test(prompt);
      
      console.log('🎯 [PHOTO PRIORITY] Checking for DIRECT examples request:', {
        userLevel: 'Advanced',
        prompt,
        isAskingForExamples,
        note: 'Photos only detect direct requests, not affirmative responses',
        contextSnippet: conversationContext.substring(0, 300)
      });
      
      // 📸 APENAS pedidos diretos para fotos (não "sure", "yes", etc.)
      if (isAskingForExamples) {
        // Extrair o tópico do contexto recente
        const topicMatch = conversationContext.match(/difference between\s+([^"]+)/i) || 
                          conversationContext.match(/about\s+([^"]+)/i) ||
                          conversationContext.match(/topic[s]?:\s*([^,\n]+)/i);
        
        if (topicMatch) {
          const topic = topicMatch[1].trim();
          console.log('🎯 [PHOTO CONTEXT] Detected example request for topic:', topic);
          
          // Resposta direta com exemplos baseados no tópico
          if (topic.toLowerCase().includes('for') && topic.toLowerCase().includes('to')) {
            const directResponse = `Perfect! Here are some clear examples of FOR vs TO:

FOR (purpose/benefit/duration):
• "This meeting is for planning the project" 
• "I'm saving money for vacation"
• "I'll be here for two hours"

TO (direction/movement/recipient):
• "I'm going to the office"
• "Send this email to the client"  
• "Give the report to Sarah"

Quick tip: FOR = why/purpose, TO = where/who. Makes sense?`;
            
            console.log('🎯 [PHOTO SUCCESS] RETURNING DIRECT FOR vs TO EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 25,
                nextChallenge: '',
                tips: ['Great question! Keep practicing with examples.'],
                encouragement: 'Your understanding is excellent! 🌟',
                technicalFeedback: ''
              }
            });
          }
          
          // Para outros tópicos, usar resposta genérica mas contextual
          console.log('🎯 [PHOTO CONTEXT] Providing generic examples for topic:', topic);
          const genericResponse = `Sure! Here are some examples of ${topic}:

• Practical examples for everyday use
• Common phrases you'll hear often
• Professional context examples

Does this help clarify things?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: genericResponse,
              xpAwarded: 25,
              nextChallenge: '',
              tips: ['Excellent question! Keep exploring.'],
              encouragement: 'Your English skills are impressive! 🎯',
              technicalFeedback: ''
            }
          });
        } else {
          console.log('🎯 [PHOTO CONTEXT] No topic found, providing direct response');
          const directResponse = `Absolutely! Let me give you some practical examples:

FOR (purpose/benefit):
• "This is for you" (benefit)
• "I study for my exam" (purpose)
• "We waited for an hour" (duration)

TO (direction/destination):
• "I'm going to work" (direction)
• "Send it to me" (recipient)
• "From Monday to Friday" (endpoint)

Does this help clarify the difference?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: directResponse,
              xpAwarded: 25,
              nextChallenge: '',
              tips: ['Great understanding! Keep practicing.'],
              encouragement: 'You think very clearly! 🌟',
              technicalFeedback: ''
            }
          });
        }
      }
    }

    const systemPrompt = `You are Charlotte, a smart, modern friend in your late 20s who's great at helping with English vocabulary through photos.

${conversationContext ? `\n${conversationContext}\n` : ''}

PERSONALITY & STYLE:
- Talk like a smart friend, not a professor or grandmother
- Use modern, natural language - avoid old-fashioned words
- Be encouraging and supportive while keeping it real
- Share your thoughts naturally, like texting a smart friend
- Keep responses conversational and engaging (around 80 words max)

MODERN LANGUAGE GUIDELINES:
✅ USE: "Hey", "cool", "awesome", "totally", "yeah", "for sure", "makes sense", "solid point", "I get it", "that's interesting"
❌ AVOID: "Delightful", "marvelous", "splendid", "indeed", "quite so", "I appreciate", "demonstrates", "penchant for"

ADVANCED VOCABULARY COACHING:
- Identify the main object in the image
- Give sophisticated vocabulary and nuanced definitions
- Share interesting facts or cultural context when relevant
- Help with advanced expressions and natural usage
- Keep it conversational, not academic

CONVERSATION APPROACH:
- Respond to what they're asking about (use conversation context)
- React naturally to their photo like a friend would
- Share your own thoughts when relevant
- Balance being helpful with being conversational
- Keep it natural and engaging, not formal

Your job is to help them learn advanced English vocabulary through visual association while being a cool, supportive friend.`;

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
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 80, // Conversational, not essays
      temperature: 0.6 // Natural but not too random
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Advanced image response generated:', assistantResponse.length, 'characters');

    // Clean markdown formatting for natural conversation
    let cleanFeedback = assistantResponse
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();

    // 🔧 ADVANCED PUNCTUATION VALIDATION: Validação sofisticada de pontuação
    const sentences = cleanFeedback.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    const correctedSentences = sentences.map((sentence, index) => {
      let trimmed = sentence.trim();
      
      // Detectar tipos de frases mais sofisticados
      const lowerText = trimmed.toLowerCase();
      
      // Detectores de perguntas mais avançados
      const questionStarters = ["what", "where", "when", "who", "how", "why", "do", "does", "did", "is", "are", "can", "could", "would", "will", "should", "have", "has", "had", "might", "may", "shall", "ought"];
      const firstWord = lowerText.split(" ")[0];
      
      const isQuestion = questionStarters.includes(firstWord) || 
                        lowerText.includes("do you") || 
                        lowerText.includes("are you") ||
                        lowerText.includes("can you") ||
                        lowerText.includes("would you") ||
                        lowerText.includes("could you") ||
                        lowerText.includes("have you") ||
                        lowerText.includes("will you") ||
                        lowerText.includes("don't you") ||
                        lowerText.includes("wouldn't you") ||
                        lowerText.includes("isn't it") ||
                        lowerText.includes("aren't they") ||
                        lowerText.includes("right?") ||
                        lowerText.includes("correct?") ||
                        lowerText.includes("what's up") ||
                        lowerText.includes("whats up") ||
                        lowerText.includes("got anything") ||
                        lowerText.includes("got any") ||
                        lowerText.includes("have anything") ||
                        lowerText.includes("anything cool") ||
                        lowerText.includes("anything interesting") ||
                        lowerText.includes("anything new") ||
                        lowerText.includes("anything fun") ||
                        (lowerText.startsWith("got ") && lowerText.includes("on your mind")) ||
                        (lowerText.startsWith("have ") && lowerText.includes("on your mind"));
      
      // Detectar exclamações sofisticadas
      const isExclamation = lowerText.startsWith("wow") || 
                           lowerText.startsWith("cool") ||
                           lowerText.startsWith("awesome") ||
                           lowerText.startsWith("hey") ||
                           lowerText.startsWith("totally") ||
                           lowerText.includes("that's amazing") ||
                           lowerText.includes("so cool") ||
                           lowerText.includes("how awesome");
      
      // Aplicar pontuação correta com lógica avançada
      if (isQuestion) {
        if (!trimmed.endsWith("?")) {
          trimmed = trimmed.replace(/[.!]*$/, "") + "?";
          console.log('🔧 [ADVANCED PUNCTUATION] Fixed question:', trimmed);
        }
      } else if (isExclamation) {
        if (!trimmed.endsWith("!")) {
          trimmed = trimmed.replace(/[.?]*$/, "") + "!";
          console.log('🔧 [ADVANCED PUNCTUATION] Fixed exclamation:', trimmed);
        }
      } else {
        if (!trimmed.match(/[.!?]$/)) {
          trimmed += ".";
          console.log('🔧 [ADVANCED PUNCTUATION] Added period:', trimmed);
        }
      }
      
      return trimmed;
    });
    
    cleanFeedback = correctedSentences.join(" ");

    // 🎯 XP para Advanced: 8-20 XP (consistente com outros níveis)
    const cameraXP = Math.floor(Math.random() * 13) + 8;

    const response: AssistantResponse = {
      feedback: cleanFeedback,
      xpAwarded: cameraXP,
      nextChallenge: '',
      tips: ['Keep exploring vocabulary through photos!'],
      encouragement: 'Your English is getting stronger! 🌟',
      technicalFeedback: `Advanced image analysis completed. Object identification for sophisticated vocabulary learning.`
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleAdvancedImageMessage:', error);
    
    // Fallback moderno para Advanced
    const fallbackResponse = `Hey ${userName || 'there'}, I had trouble seeing your photo clearly. Can you try taking another one?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 8,
        nextChallenge: '',
        tips: ['Keep practicing with photos!'],
        encouragement: 'You\'re doing great! 😊',
        technicalFeedback: 'Image analysis failed - technical error'
      }
    });
  }
}

// 🆕 FUNÇÃO INTERMEDIÁRIA: Processar mensagens de IMAGEM para Inter
async function handleInterImageMessage(
  prompt: string,
  imageData: string,
  userName?: string,
  conversationContext?: string
) {
  try {
    console.log('🎓 Processing Inter image message with friendly approach...');

    // 🎯 PRIORIDADE MÁXIMA: Detectar pedidos DIRETOS de exemplos para FOTO
    // 📸 NOTA: Para fotos, apenas detectamos pedidos diretos, não respostas afirmativas como "sure"
    if (conversationContext) {
      const isAskingForExamples = /give\s*(me\s*)?(some\s*)?examples?|show\s*(me\s*)?examples?|examples?\s*please|can\s*you\s*give/i.test(prompt);
      
      console.log('🎯 [PHOTO PRIORITY] Checking for DIRECT examples request:', {
        userLevel: 'Inter',
        prompt,
        isAskingForExamples,
        note: 'Photos only detect direct requests, not affirmative responses',
        contextSnippet: conversationContext.substring(0, 300)
      });
      
      // 📸 APENAS pedidos diretos para fotos (não "sure", "yes", etc.)
      if (isAskingForExamples) {
        // Extrair o tópico do contexto recente
        const topicMatch = conversationContext.match(/difference between\s+([^"]+)/i) || 
                          conversationContext.match(/about\s+([^"]+)/i) ||
                          conversationContext.match(/topic[s]?:\s*([^,\n]+)/i);
        
        if (topicMatch) {
          const topic = topicMatch[1].trim();
          console.log('🎯 [PHOTO CONTEXT] Detected example request for topic:', topic);
          
          // Resposta direta com exemplos baseados no tópico
          if (topic.toLowerCase().includes('for') && topic.toLowerCase().includes('to')) {
            const directResponse = `Great! Let me show you some clear examples:

FOR - when you want to say WHY:
• "I study English for my job"
• "This gift is for my mom"
• "We need this for tomorrow"

TO - when you want to say WHERE:
• "I go to school every day"
• "Send this to John"
• "From home to work"

Try using one in a sentence!`;
            
            console.log('🎯 [PHOTO SUCCESS] RETURNING DIRECT FOR vs TO EXAMPLES - BYPASSING ALL OTHER LOGIC');
            
            return NextResponse.json({ 
              success: true, 
              result: {
                feedback: directResponse,
                xpAwarded: 20,
                nextChallenge: '',
                tips: ['Good job asking for examples!'],
                encouragement: 'Your understanding is getting better! 🎯',
                technicalFeedback: ''
              }
            });
          }
          
          // Para outros tópicos, usar resposta genérica mas contextual
          console.log('🎯 [PHOTO CONTEXT] Providing generic examples for topic:', topic);
          const genericResponse = `Perfect! Here are some examples of ${topic}:

• Simple everyday examples
• Easy phrases to remember
• Practice sentences

Try making your own example!`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: genericResponse,
              xpAwarded: 20,
              nextChallenge: '',
              tips: ['Great question! Keep practicing.'],
              encouragement: 'You are learning fast! 🌟',
              technicalFeedback: ''
            }
          });
        } else {
          console.log('🎯 [PHOTO CONTEXT] No topic found, providing direct response');
          const directResponse = `Sure! Here are some helpful examples:

FOR - why/purpose:
• "I work for a company"
• "This is for you"
• "I wait for the bus"

TO - where/direction:
• "I go to work"
• "Give it to me"
• "From 9 to 5"

Which one makes sense to you?`;

          return NextResponse.json({ 
            success: true, 
            result: {
              feedback: directResponse,
              xpAwarded: 20,
              nextChallenge: '',
              tips: ['Nice job with your question!'],
              encouragement: 'You understand well! Keep going! 💪',
              technicalFeedback: ''
            }
          });
        }
      }
    }

    const systemPrompt = `You are Charlotte, a friendly English teacher who helps intermediate students learn vocabulary through photos.

${conversationContext ? `\n${conversationContext}\n` : ''}

PERSONALITY & STYLE:
- Be friendly and encouraging, like a helpful teacher
- Use clear, natural English that's easy to understand
- Be supportive and positive while keeping it educational
- Keep responses helpful and engaging (around 60-80 words)

INTER LEVEL VOCABULARY COACHING:
- Identify the main object in the image clearly
- Give practical vocabulary and useful definitions
- Share helpful facts or context when relevant
- Help with common expressions and everyday usage
- Keep it educational but not overwhelming

CONVERSATION APPROACH:
- Respond to what they're asking about (use conversation context)
- React positively to their photo
- Share useful information when relevant
- Balance being helpful with being encouraging
- Keep it clear and educational

Your job is to help them learn practical English vocabulary through visual association while being a supportive teacher.`;

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
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 80, // Clear and focused
      temperature: 0.6 // Natural but consistent
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from assistant');
    }

    console.log('✅ Inter image response generated:', assistantResponse.length, 'characters');

    // Clean markdown formatting for natural conversation
    let cleanFeedback = assistantResponse
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();

    // 🔧 INTER PUNCTUATION VALIDATION: Validação intermediária de pontuação
    const sentences = cleanFeedback.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    const correctedSentences = sentences.map((sentence, index) => {
      let trimmed = sentence.trim();
      
      // Detectar tipos de frases básicos
      const lowerText = trimmed.toLowerCase();
      
      // Detectores de perguntas básicos
      const questionStarters = ["what", "where", "when", "who", "how", "why", "do", "does", "did", "is", "are", "can", "could", "would", "will", "should"];
      const firstWord = lowerText.split(" ")[0];
      
      const isQuestion = questionStarters.includes(firstWord) || 
                        lowerText.includes("do you") || 
                        lowerText.includes("are you") ||
                        lowerText.includes("can you") ||
                        lowerText.includes("would you") ||
                        lowerText.includes("right?");
      
      // Detectar exclamações básicas
      const isExclamation = lowerText.startsWith("wow") || 
                           lowerText.startsWith("great") ||
                           lowerText.startsWith("nice") ||
                           lowerText.startsWith("good") ||
                           lowerText.includes("that's great") ||
                           lowerText.includes("well done");
      
      // Aplicar pontuação correta
      if (isQuestion) {
        if (!trimmed.endsWith("?")) {
          trimmed = trimmed.replace(/[.!]*$/, "") + "?";
          console.log('🔧 [INTER PUNCTUATION] Fixed question:', trimmed);
        }
      } else if (isExclamation) {
        if (!trimmed.endsWith("!")) {
          trimmed = trimmed.replace(/[.?]*$/, "") + "!";
          console.log('🔧 [INTER PUNCTUATION] Fixed exclamation:', trimmed);
        }
      } else {
        if (!trimmed.match(/[.!?]$/)) {
          trimmed += ".";
          console.log('🔧 [INTER PUNCTUATION] Added period:', trimmed);
        }
      }
      
      return trimmed;
    });
    
    cleanFeedback = correctedSentences.join(" ");

    // 🎯 XP para Inter: 10-24 XP (consistente com outros níveis)
    const cameraXP = Math.floor(Math.random() * 15) + 10;

    const response: AssistantResponse = {
      feedback: cleanFeedback,
      xpAwarded: cameraXP,
      nextChallenge: '',
      tips: ['Keep practicing with photos!'],
      encouragement: 'You\'re making great progress! 🌟',
      technicalFeedback: `Inter image analysis completed. Object identification for practical vocabulary learning.`
    };

    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('❌ Error in handleInterImageMessage:', error);
    
    // Fallback amigável para Inter
    const fallbackResponse = `I had trouble seeing your photo clearly, ${userName || 'there'}. Can you try taking another one with better lighting?`;

    return NextResponse.json({ 
      success: true, 
      result: {
        feedback: fallbackResponse,
        xpAwarded: 10,
        nextChallenge: '',
        tips: ['Keep practicing with photos!'],
        encouragement: 'You\'re doing well! 😊',
        technicalFeedback: 'Image analysis failed - technical error'
      }
    });
  }
}

// 🆕 FUNÇÃO GERAL: Processar mensagens de IMAGEM (Inter/Advanced)
async function handleImageMessage(
  prompt: string,
  imageData: string,
  userLevel: 'Novice' | 'Inter' | 'Advanced',
  userName?: string,
  conversationContext?: string
) {
  // 🎯 NOVICE SPECIAL HANDLING: Usar lógica simplificada e natural
  if (userLevel === 'Novice') {
    console.log('👶 Using Novice-specific image handling...');
    return await handleNoviceImageMessage(prompt, imageData, userName, conversationContext);
  }

  // 🎯 ADVANCED SPECIAL HANDLING: Usar lógica moderna e natural
  if (userLevel === 'Advanced') {
    console.log('🎓 Using Advanced-specific image handling...');
    return await handleAdvancedImageMessage(prompt, imageData, userName, conversationContext);
  }

  // 🎯 INTER SPECIAL HANDLING: Usar lógica intermediária e natural
  if (userLevel === 'Inter') {
    console.log('🎓 Using Inter-specific image handling...');
    return await handleInterImageMessage(prompt, imageData, userName, conversationContext);
  }

  try {
    console.log('📸 Starting image analysis for vocabulary learning...');

    const levelInstructions = {
      'Inter': 'Provide clear explanations in English. Focus on practical communication skills.',
      'Advanced': 'Use sophisticated English. Focus on advanced vocabulary and nuanced definitions.'
    };

    const systemPrompt = `You are Charlotte, an English vocabulary tutor. Analyze the image and identify the main object to help the student learn new English vocabulary.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

${conversationContext ? `\n${conversationContext}\n` : ''}

INSTRUCTIONS:
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
                detail: "low"
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

    // 🎯 XP para Inter/Advanced
    const cameraXP = userLevel === 'Inter' ? 
      Math.floor(Math.random() * 15) + 10 : // 10-24 XP
      Math.floor(Math.random() * 13) + 8;   // 8-20 XP

    console.log('📸 Camera XP calculated:', {
      userLevel,
      xpAwarded: cameraXP,
      prompt: prompt.substring(0, 50) + '...'
    });

    const response: AssistantResponse = {
      feedback: cleanFeedback,
      xpAwarded: cameraXP,
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
      feedback: 'I apologize, but I had trouble analyzing your image. Please try taking another photo with better lighting.',
      xpAwarded: 8,
      nextChallenge: '',
      tips: [],
      encouragement: 'Keep practicing!',
      technicalFeedback: 'Image analysis failed - technical error'
    };

    return NextResponse.json({ success: true, result: fallbackResponse });
  }
}