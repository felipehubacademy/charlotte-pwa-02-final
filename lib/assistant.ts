// lib/assistant.ts - ATUALIZADO para aceitar messageType

export interface AssistantRequest {
  transcription: string;
  pronunciationData?: { // ✅ Agora opcional
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number;
  } | null; // ✅ Pode ser null
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
  userName?: string;
  messageType?: 'text' | 'audio'; // ✅ Novo campo
}

export interface AssistantResponse {
  feedback: string;
  nextChallenge?: string;
  tips: string[];
  encouragement: string;
  xpAwarded: number;
}

export interface AssistantResult {
  success: boolean;
  result?: AssistantResponse;
  error?: string;
}

// ✅ FUNÇÃO ATUALIZADA para aceitar messageType e pronunciationData opcional
export async function getAssistantFeedback(
  transcription: string,
  pronunciationData: {
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number;
  } | null, // ✅ Pode ser null
  userLevel: 'Novice' | 'Intermediate' | 'Advanced',
  userName?: string,
  messageType: 'text' | 'audio' = 'audio' // ✅ Novo parâmetro com default
): Promise<AssistantResult> {
  try {
    const requestData: AssistantRequest = {
      transcription,
      pronunciationData,
      userLevel,
      userName,
      messageType // ✅ Incluir messageType
    };

    console.log('Requesting assistant feedback:', {
      transcription,
      userLevel,
      messageType,
      pronunciationScore: pronunciationData?.pronunciationScore
    });

    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    console.log('Assistant feedback received:', {
      hasResult: !!data.result,
      xpAwarded: data.result?.xpAwarded,
      messageType
    });

    return {
      success: true,
      result: data.result
    };

  } catch (error: any) {
    console.error('Assistant feedback failed:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to get assistant feedback'
    };
  }
}

// ✅ NOVA FUNÇÃO para mensagens de texto (sem pronunciationData)
export async function getTextAssistantFeedback(
  transcription: string,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced',
  userName?: string
): Promise<AssistantResult> {
  return getAssistantFeedback(
    transcription,
    null, // ✅ Sem dados de pronúncia
    userLevel,
    userName,
    'text' // ✅ Tipo texto
  );
}

// Função para formatar a resposta da Charlotte para o chat
export function formatAssistantMessage(
  transcription: string,
  assistantResponse: AssistantResponse
): string {
  // Retorna apenas o feedback limpo da Charlotte (sem XP)
  return assistantResponse.feedback;
}

// Função de fallback caso o Assistant falhe
export function createFallbackResponse(
  transcription: string,
  pronunciationScore: number,
  userLevel: string
): string {
  const emoji = pronunciationScore >= 80 ? '🎉' : pronunciationScore >= 70 ? '👍' : '💪';
  
  let message = `🎤 I heard: "${transcription}"\n\n`;
  message += `${emoji} Pronunciation Score: ${pronunciationScore}/100\n\n`;
  
  if (userLevel === 'Novice') {
    message += "Bom trabalho! Keep practicing your English pronunciation!\n\n";
  } else {
    message += "Great job! Your pronunciation is improving with each practice!\n\n";
  }
  
  message += `✨ **XP Earned:** +25 points!`;
  
  return message;
}

// ✅ NOVA FUNÇÃO de fallback para texto
export function createTextFallbackResponse(
  transcription: string,
  userLevel: string,
  userName?: string
): string {
  const userFirstName = userName || 'there';
  
  if (userLevel === 'Novice') {
    return `Muito bem, ${userFirstName}! I can see you're practicing your English writing. Keep it up - every message helps you improve! What would you like to talk about next? 😊`;
  } else if (userLevel === 'Intermediate') {
    return `That's a good point, ${userFirstName}! Your English communication skills are developing well. I appreciate you sharing that with me. What aspects of English would you like to focus on today?`;
  } else {
    return `Thank you for that thoughtful message, ${userFirstName}! Your written English shows good command of the language. I'd love to continue our conversation - what challenging topics interest you most?`;
  }
}