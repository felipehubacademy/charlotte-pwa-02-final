// lib/pronunciation.ts

export interface PronunciationResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  words: WordResult[];
  feedback: string[];
}

export interface WordResult {
  word: string;
  accuracyScore: number;
  errorType?: string;
}

export interface PronunciationResponse {
  success: boolean;
  result?: PronunciationResult;
  error?: string;
}

export async function assessPronunciation(
  audioBlob: Blob, 
  referenceText?: string
): Promise<PronunciationResponse> {
  try {
    // Criar FormData para enviar arquivo e texto de referência
    const formData = new FormData();
    
    // Converter blob para arquivo WAV se necessário
    const audioFile = new File([audioBlob], 'audio.wav', {
      type: 'audio/wav'
    });
    
    formData.append('audio', audioFile);
    
    // Se não tem texto de referência, usa uma string vazia (free-form assessment)
    if (referenceText) {
      formData.append('referenceText', referenceText);
    }

    console.log('Sending audio for pronunciation assessment:', {
      audioType: audioFile.type,
      audioSize: audioFile.size,
      hasReferenceText: !!referenceText
    });

    // Fazer requisição para nossa API principal
    const response = await fetch('/api/pronunciation', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    console.log('Pronunciation assessment successful:', data.result);

    return {
      success: true,
      result: data.result
    };

  } catch (error: any) {
    console.error('Pronunciation assessment failed:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to assess pronunciation'
    };
  }
}

// Função auxiliar para converter scores em feedback visual
export function getScoreEmoji(score: number): string {
  if (score >= 90) return '🎉';
  if (score >= 80) return '👍';
  if (score >= 70) return '📚';
  if (score >= 60) return '💪';
  return '🔄';
}

// Função para gerar mensagem de score formatada
export function formatScoreMessage(result: PronunciationResult): string {
  const emoji = getScoreEmoji(result.pronunciationScore);
  
  return `${emoji} Pronunciation Score: ${result.pronunciationScore}/100

📊 Detailed Analysis:
• Accuracy: ${result.accuracyScore}/100
• Fluency: ${result.fluencyScore}/100  
• Completeness: ${result.completenessScore}/100

${result.feedback.join('\n')}`;
}

// Função para detectar se o áudio precisa ser convertido
export function prepareAudioForAssessment(audioBlob: Blob): Blob {
  // Por enquanto retorna o blob original
  // No futuro podemos adicionar conversão de formato se necessário
  return audioBlob;
}