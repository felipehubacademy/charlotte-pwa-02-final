// lib/pronunciation.ts - INTERFACE ATUALIZADA PARA SPEECH SDK

export interface PronunciationResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  prosodyScore?: number; // ✅ NOVO: Prosody assessment
  words: WordResult[];
  phonemes?: PhonemeResult[]; // ✅ NOVO: Análise detalhada de fonemas
  feedback: string[];
  confidence?: number;
  assessmentMethod: string;
  sessionId?: string; // ✅ NOVO: Para debugging
  prosodyFeedback?: string[]; // ✅ NOVO: Feedback específico de prosódia
  detailedAnalysis?: { // ✅ NOVO: Estatísticas detalhadas
    totalWords: number;
    totalPhonemes: number;
    errorWords: number;
    poorPhonemes: number;
    avgWordAccuracy: number;
  };
}

export interface WordResult {
  word: string;
  accuracyScore: number;
  errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation' | 'UnexpectedBreak' | 'MissingBreak' | 'Monotone';
  syllables?: SyllableResult[]; // ✅ NOVO: Análise de sílabas
}

export interface SyllableResult {
  syllable: string;
  accuracyScore: number;
  offset: number;
  duration: number;
}

export interface PhonemeResult {
  phoneme: string;
  accuracyScore: number;
  nbestPhonemes?: Array<{ phoneme: string; score: number }>; // ✅ NOVO: Alternativas fonéticas
  offset: number;
  duration: number;
}

export interface PronunciationResponse {
  success: boolean;
  result?: PronunciationResult;
  error?: string;
  shouldRetry?: boolean;
  retryReason?: string;
}

// ✅ FUNÇÃO PRINCIPAL ATUALIZADA
export async function assessPronunciation(
  audioBlob: Blob, 
  referenceText?: string
): Promise<PronunciationResponse> {
  try {
    // Criar FormData para enviar arquivo e texto de referência
    const formData = new FormData();
    
    // Converter blob para arquivo
    const audioFile = new File([audioBlob], 'audio.wav', {
      type: audioBlob.type || 'audio/wav'
    });
    
    formData.append('audio', audioFile);
    
    // Adicionar texto de referência se fornecido
    if (referenceText && referenceText.trim()) {
      formData.append('referenceText', referenceText.trim());
    }

    // Determinar URL base
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Cliente: URL relativa
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL.replace(/-[a-z0-9]+\.vercel\.app$/, '.vercel.app')}` 
        : 'http://localhost:3000'; // Servidor: URL absoluta

    const apiUrl = `${baseUrl}/api/pronunciation`;

    // ✅ USAR NOVA API COM SPEECH SDK
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    // ✅ VERIFICAR SE DEVE FAZER RETRY
    if (data.shouldRetry) {
      return {
        success: false,
        error: data.error,
        shouldRetry: true,
        retryReason: data.retryReason
      };
    }

    return {
      success: true,
      result: data.result
    };

  } catch (error: any) {
    console.error('❌ Pronunciation assessment failed:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to assess pronunciation'
    };
  }
}

// ✅ FUNÇÕES AUXILIARES ATUALIZADAS

export function getScoreEmoji(score: number): string {
  if (score >= 90) return '🎉';
  if (score >= 80) return '⭐';
  if (score >= 70) return '👍';
  if (score >= 60) return '📚';
  if (score >= 50) return '💪';
  return '🔄';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 80) return 'text-blue-500';
  if (score >= 70) return 'text-yellow-500';
  if (score >= 60) return 'text-orange-500';
  return 'text-red-500';
}

// ✅ NOVA FUNÇÃO: Formatar mensagem detalhada
export function formatDetailedScoreMessage(result: PronunciationResult): string {
  const emoji = getScoreEmoji(result.pronunciationScore);
  
  let message = `${emoji} **Pronunciation Score: ${result.pronunciationScore}/100**\n\n`;
  
  // Scores principais
  message += `📊 **Detailed Analysis:**\n`;
  message += `• **Accuracy:** ${result.accuracyScore}/100\n`;
  message += `• **Fluency:** ${result.fluencyScore}/100\n`;
  message += `• **Completeness:** ${result.completenessScore}/100\n`;
  
  // Prosody se disponível
  if (result.prosodyScore !== undefined) {
    message += `• **Prosody:** ${result.prosodyScore}/100\n`;
  }
  
  message += `\n`;
  
  // Análise detalhada se disponível
  if (result.detailedAnalysis) {
    const analysis = result.detailedAnalysis;
    message += `🔍 **Word Analysis:**\n`;
    message += `• **Total words:** ${analysis.totalWords}\n`;
    if (analysis.errorWords > 0) {
      message += `• **Words needing work:** ${analysis.errorWords}\n`;
    }
    message += `• **Average word accuracy:** ${analysis.avgWordAccuracy}/100\n\n`;
  }
  
  // Feedback principal
  if (result.feedback.length > 0) {
    message += `💡 **Feedback:**\n`;
    result.feedback.forEach(feedback => {
      message += `${feedback}\n`;
    });
    message += `\n`;
  }
  
  // Feedback de prosódia se disponível
  if (result.prosodyFeedback && result.prosodyFeedback.length > 0) {
    message += `🎵 **Rhythm & Intonation:**\n`;
    result.prosodyFeedback.forEach(feedback => {
      message += `${feedback}\n`;
    });
    message += `\n`;
  }
  
  // Método de assessment
  message += `🔬 **Assessment method:** ${result.assessmentMethod}\n`;
  
  // Session ID se disponível (para debugging)
  if (result.sessionId) {
    message += `🔗 **Session:** ${result.sessionId.substring(0, 8)}...\n`;
  }
  
  return message;
}

// ✅ NOVA FUNÇÃO: Analisar problemas específicos
export function analyzePronunciationProblems(result: PronunciationResult): {
  problemWords: string[];
  problemPhonemes: string[];
  suggestions: string[];
} {
  const problemWords: string[] = [];
  const problemPhonemes: string[] = [];
  const suggestions: string[] = [];
  
  // Analisar palavras problemáticas
  if (result.words) {
    result.words.forEach(word => {
      if (word.accuracyScore < 60 || (word.errorType && word.errorType !== 'None')) {
        problemWords.push(word.word);
        
        if (word.errorType === 'Mispronunciation') {
          suggestions.push(`Practice the word "${word.word}" - focus on clear pronunciation`);
        } else if (word.errorType === 'Omission') {
          suggestions.push(`Don't skip the word "${word.word}" - make sure to pronounce it clearly`);
        }
      }
    });
  }
  
  // Analisar fonemas problemáticos
  if (result.phonemes) {
    const phonemeProblems = new Map<string, number>();
    
    result.phonemes.forEach(phoneme => {
      if (phoneme.accuracyScore < 50) {
        const count = phonemeProblems.get(phoneme.phoneme) || 0;
        phonemeProblems.set(phoneme.phoneme, count + 1);
      }
    });
    
    // Pegar os fonemas mais problemáticos
    Array.from(phonemeProblems.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([phoneme, count]) => {
        problemPhonemes.push(phoneme);
        suggestions.push(`Focus on the "${phoneme}" sound - practice words containing this sound`);
      });
  }
  
  return {
    problemWords: problemWords.slice(0, 5), // Top 5 problem words
    problemPhonemes: [...new Set(problemPhonemes)], // Unique phonemes
    suggestions: suggestions.slice(0, 3) // Top 3 suggestions
  };
}

// ✅ NOVA FUNÇÃO: Gerar exercícios personalizados
export function generatePersonalizedExercises(result: PronunciationResult): string[] {
  const exercises: string[] = [];
  const problems = analyzePronunciationProblems(result);
  
  // Exercícios baseados em palavras problemáticas
  if (problems.problemWords.length > 0) {
    exercises.push(`📝 **Word Practice:** Focus on these words: ${problems.problemWords.join(', ')}`);
    exercises.push(`🔄 **Repetition:** Say each problem word 5 times slowly, then at normal speed`);
  }
  
  // Exercícios baseados em fonemas problemáticos
  if (problems.problemPhonemes.length > 0) {
    exercises.push(`🔤 **Sound Practice:** Work on these sounds: ${problems.problemPhonemes.join(', ')}`);
    exercises.push(`👄 **Mouth Position:** Look up how to position your mouth for these sounds`);
  }
  
  // Exercícios baseados nos scores
  if (result.fluencyScore < 70) {
    exercises.push(`🌊 **Fluency:** Read a paragraph aloud daily to improve natural flow`);
  }
  
  if (result.prosodyScore && result.prosodyScore < 70) {
    exercises.push(`🎵 **Rhythm:** Listen to native speakers and mimic their intonation patterns`);
  }
  
  if (result.accuracyScore < 70) {
    exercises.push(`🎯 **Precision:** Practice tongue twisters to improve articulation`);
  }
  
  return exercises;
}

// Manter compatibilidade com código existente
export function prepareAudioForAssessment(audioBlob: Blob): Blob {
  return audioBlob;
}