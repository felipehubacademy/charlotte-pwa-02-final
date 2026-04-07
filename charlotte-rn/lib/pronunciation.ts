// lib/pronunciation.ts - Interfaces e funções de avaliação de pronúncia (RN)

import Constants from 'expo-constants';

export interface PronunciationResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  prosodyScore?: number;
  words: WordResult[];
  phonemes?: PhonemeResult[];
  feedback: string[];
  confidence?: number;
  assessmentMethod: string;
  sessionId?: string;
  prosodyFeedback?: string[];
  detailedAnalysis?: {
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
  syllables?: SyllableResult[];
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
  nbestPhonemes?: Array<{ phoneme: string; score: number }>;
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

function getApiBaseUrl(): string {
  return (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://charlotte-pwa-02-final.vercel.app';
}

export async function assessPronunciation(
  audioBlob: Blob,
  referenceText?: string
): Promise<PronunciationResponse> {
  try {
    const formData = new FormData();

    const audioFile = new File([audioBlob], 'audio.m4a', {
      type: audioBlob.type || 'audio/m4a'
    });

    formData.append('audio', audioFile);

    if (referenceText?.trim()) {
      formData.append('referenceText', referenceText.trim());
    }

    const apiUrl = `${getApiBaseUrl()}/api/pronunciation`;
    console.log('🌐 Pronunciation API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    if (data.shouldRetry) {
      return {
        success: false,
        error: data.error,
        shouldRetry: true,
        retryReason: data.retryReason
      };
    }

    return { success: true, result: data.result };

  } catch (error: any) {
    console.error('❌ Pronunciation assessment failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to assess pronunciation'
    };
  }
}

export function getScoreEmoji(score: number): string {
  if (score >= 90) return '🎉';
  if (score >= 80) return '⭐';
  if (score >= 70) return '👍';
  if (score >= 60) return '📚';
  if (score >= 50) return '💪';
  return '🔄';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // green-500
  if (score >= 80) return '#3b82f6'; // blue-500
  if (score >= 70) return '#eab308'; // yellow-500
  if (score >= 60) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

export function formatDetailedScoreMessage(result: PronunciationResult): string {
  const emoji = getScoreEmoji(result.pronunciationScore);

  let message = `${emoji} **Pronunciation Score: ${result.pronunciationScore}/100**\n\n`;
  message += `📊 **Detailed Analysis:**\n`;
  message += `• **Accuracy:** ${result.accuracyScore}/100\n`;
  message += `• **Fluency:** ${result.fluencyScore}/100\n`;
  message += `• **Completeness:** ${result.completenessScore}/100\n`;

  if (result.prosodyScore !== undefined) {
    message += `• **Prosody:** ${result.prosodyScore}/100\n`;
  }

  message += `\n`;

  if (result.detailedAnalysis) {
    const a = result.detailedAnalysis;
    message += `🔍 **Word Analysis:**\n`;
    message += `• **Total words:** ${a.totalWords}\n`;
    if (a.errorWords > 0) message += `• **Words needing work:** ${a.errorWords}\n`;
    message += `• **Average word accuracy:** ${a.avgWordAccuracy}/100\n\n`;
  }

  if (result.feedback.length > 0) {
    message += `💡 **Feedback:**\n`;
    result.feedback.forEach(f => { message += `${f}\n`; });
    message += `\n`;
  }

  if (result.prosodyFeedback?.length) {
    message += `🎵 **Rhythm & Intonation:**\n`;
    result.prosodyFeedback.forEach(f => { message += `${f}\n`; });
    message += `\n`;
  }

  message += `🔬 **Assessment method:** ${result.assessmentMethod}\n`;
  return message;
}

export function analyzePronunciationProblems(result: PronunciationResult): {
  problemWords: string[];
  problemPhonemes: string[];
  suggestions: string[];
} {
  const problemWords: string[] = [];
  const problemPhonemes: string[] = [];
  const suggestions: string[] = [];

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

  if (result.phonemes) {
    const phonemeProblems = new Map<string, number>();
    result.phonemes.forEach(phoneme => {
      if (phoneme.accuracyScore < 50) {
        phonemeProblems.set(phoneme.phoneme, (phonemeProblems.get(phoneme.phoneme) ?? 0) + 1);
      }
    });

    Array.from(phonemeProblems.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([phoneme]) => {
        problemPhonemes.push(phoneme);
        suggestions.push(`Focus on the "${phoneme}" sound - practice words containing this sound`);
      });
  }

  return {
    problemWords: problemWords.slice(0, 5),
    problemPhonemes: [...new Set(problemPhonemes)],
    suggestions: suggestions.slice(0, 3)
  };
}

export function generatePersonalizedExercises(result: PronunciationResult): string[] {
  const exercises: string[] = [];
  const problems = analyzePronunciationProblems(result);

  if (problems.problemWords.length > 0) {
    exercises.push(`📝 **Word Practice:** Focus on these words: ${problems.problemWords.join(', ')}`);
    exercises.push(`🔄 **Repetition:** Say each problem word 5 times slowly, then at normal speed`);
  }

  if (problems.problemPhonemes.length > 0) {
    exercises.push(`🔤 **Sound Practice:** Work on these sounds: ${problems.problemPhonemes.join(', ')}`);
    exercises.push(`👄 **Mouth Position:** Look up how to position your mouth for these sounds`);
  }

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

export function prepareAudioForAssessment(audioBlob: Blob): Blob {
  return audioBlob;
}
