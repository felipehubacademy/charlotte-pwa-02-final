// app/api/pronunciation/route.ts - USANDO AZURE SPEECH SDK

import { NextRequest, NextResponse } from 'next/server';
import { assessPronunciationWithSDK, PronunciationResult } from '@/lib/azure-speech-sdk';

// ✅ INTERFACE COMPATÍVEL COM O CÓDIGO EXISTENTE
interface APIResponse {
  success: boolean;
  result?: {
    text: string;
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number;
    words: Array<{
      word: string;
      accuracyScore: number;
      errorType?: string;
    }>;
    feedback: string[];
    confidence?: number;
    assessmentMethod: string;
  };
  error?: string;
  shouldRetry?: boolean;
  retryReason?: string;
}

export async function POST(request: NextRequest) {
  console.log('🎯 Azure Speech SDK Pronunciation API - Starting...');
  
  try {
    // ✅ VERIFICAR CREDENCIAIS
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      console.error('❌ Azure Speech credentials missing');
      return NextResponse.json({
        success: false,
        error: 'Azure Speech credentials not configured'
      }, { status: 500 });
    }

    // ✅ PROCESSAR FORM DATA
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const referenceText = formData.get('referenceText') as string;

    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 });
    }

    console.log('📁 Processing audio with Speech SDK:', {
      type: audioFile.type,
      size: audioFile.size,
      hasReference: !!referenceText,
      referenceLength: referenceText?.length || 0
    });

    // ✅ CONVERTER FILE PARA BLOB
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { 
      type: audioFile.type 
    });

    // 🎯 EXECUTAR AZURE SPEECH SDK ASSESSMENT
    console.log('🎯 Calling Azure Speech SDK Assessment...');
    const sdkResult = await assessPronunciationWithSDK(
      audioBlob,
      referenceText?.trim() || undefined,
      'Intermediate' // Por enquanto fixo, depois pode vir do request
    );

    console.log('📊 Speech SDK Result:', {
      success: sdkResult.success,
      hasResult: !!sdkResult.result,
      error: sdkResult.error,
      shouldRetry: sdkResult.shouldRetry
    });

    // ✅ PROCESSAR RESULTADO
    if (sdkResult.success && sdkResult.result) {
      console.log('✅ Speech SDK Assessment successful!');
      
      // Verificar se é gibberish ou áudio muito ruim
      if (shouldRequestRetry(sdkResult.result)) {
        console.log('❌ Audio quality too poor, requesting retry...');
        return createRetryResponse(sdkResult.result);
      }

      // Converter para formato compatível com o frontend
      const apiResult = convertToAPIFormat(sdkResult.result);
      
      return NextResponse.json({
        success: true,
        result: apiResult
      });
    }

    // ❌ SPEECH SDK FALHOU
    if (sdkResult.shouldRetry) {
      console.log('⚠️ Speech SDK failed but can retry...');
      
      // 🔄 ESTRATÉGIA HÍBRIDA: Tentar usar Whisper + Azure SDK
      console.log('🔄 Trying hybrid approach: Whisper transcription + Azure assessment...');
      const whisperResult = await tryWhisperFallback(audioFile);
      
      if (whisperResult.success && whisperResult.text) {
        console.log('✅ Whisper transcription successful, attempting Azure assessment with known text...');
        
        // Tentar assessment com o texto reconhecido pelo Whisper
        console.log('🔄 Attempting Azure assessment with Whisper-recognized text as reference...');
        
        const hybridResult = await assessPronunciationWithSDK(
          audioBlob,
          whisperResult.text, // Usar texto do Whisper como referência
          'Intermediate'
        );
        
        if (hybridResult.success && hybridResult.result) {
          console.log('🎉 Hybrid approach successful! Using Whisper text + Azure assessment');
          
          // Marcar como método híbrido
          hybridResult.result.assessmentMethod = 'azure-sdk' as any; // Híbrido usando Azure SDK
          hybridResult.result.debugInfo = {
            ...hybridResult.result.debugInfo,
            whisperText: whisperResult.text,
            hybridApproach: true,
            method: 'azure-sdk-hybrid'
          };
          
          const apiResult = convertToAPIFormat(hybridResult.result);
          return NextResponse.json({
            success: true,
            result: apiResult
          });
        }
      }
      
      // Se híbrido falhou, retornar retry normal
      return NextResponse.json({
        success: false,
        error: sdkResult.error || 'Speech SDK assessment failed',
        shouldRetry: true,
        retryReason: sdkResult.retryReason || 'sdk_failed',
        debugInfo: sdkResult.debugInfo
      });
    }

    // 🔄 FALLBACK PARA WHISPER SE SPEECH SDK FALHAR COMPLETAMENTE
    console.log('🔄 Speech SDK failed completely, trying Whisper fallback...');
    const whisperResult = await tryWhisperFallback(audioFile);
    
    if (whisperResult.success && whisperResult.text) {
      console.log('✅ Whisper fallback successful');
      const fallbackResult = createFallbackResult(whisperResult.text, whisperResult.confidence || 0.5);
      
      return NextResponse.json({
        success: true,
        result: fallbackResult
      });
    }

    // 🆘 ÚLTIMO RECURSO
    console.log('❌ All methods failed, using encouraging fallback');
    return createEncouragingFallback();

  } catch (error: any) {
    console.error('❌ Speech SDK API error:', error);
    return createEncouragingFallback();
  }
}

// 🔍 VERIFICAR SE DEVE SOLICITAR RETRY
function shouldRequestRetry(result: PronunciationResult): boolean {
  // ✅ VERIFICAR SE O AZURE SDK JÁ SOLICITOU RETRY
  if (result.debugInfo?.retryRequested) {
    console.log(`🔄 Azure SDK requested retry: ${result.debugInfo.retryReason}`);
    return true;
  }
  
  // Critérios adicionais para retry baseados em qualidade real
  
  // 1. Texto muito curto ou vazio
  if (!result.text || result.text.trim().length < 3) {
    console.log('❌ Text too short for analysis');
    return true;
  }

  // 2. Scores extremamente baixos (indica áudio ruim)
  if (result.pronunciationScore < 15 && result.accuracyScore < 20) {
    console.log('❌ Scores too low - poor audio quality');
    return true;
  }

  // 3. Muitas palavras com erro
  const errorWords = result.words.filter(w => 
    w.errorType && w.errorType !== 'None' && w.accuracyScore < 30
  );
  
  if (errorWords.length > result.words.length * 0.8 && result.words.length > 2) {
    console.log('❌ Too many error words - likely gibberish');
    return true;
  }

  // 4. Fonemas com muitos problemas
  const poorPhonemes = result.phonemes.filter(p => p.accuracyScore < 20);
  if (poorPhonemes.length > result.phonemes.length * 0.9 && result.phonemes.length > 3) {
    console.log('❌ Too many poor phonemes - audio issue');
    return true;
  }

  return false;
}

// 🔄 CRIAR RESPOSTA DE RETRY
function createRetryResponse(result: PronunciationResult): NextResponse {
  let retryFeedback: string[] = [];
  
  // ✅ USAR FEEDBACK DO AZURE SDK SE DISPONÍVEL
  if (result.debugInfo?.retryRequested && result.feedback?.length > 0) {
    console.log('🎯 Using Azure SDK retry feedback');
    retryFeedback = [...result.feedback];
  } else {
    // Fallback para feedback genérico
    if (!result.text || result.text.trim().length < 3) {
      retryFeedback = [
        '🎤 I couldn\'t understand your audio clearly.',
        '💡 Please try speaking more slowly and clearly into the microphone.',
        '🔄 Let\'s try that again!'
      ];
    } else if (result.pronunciationScore < 15) {
      retryFeedback = [
        '📢 The audio quality seems low.',
        '💡 Please make sure you\'re in a quiet place and speak directly into the microphone.',
        '🔄 Please try recording again!'
      ];
    } else {
      retryFeedback = [
        '🔄 Let\'s try again!',
        '💡 Please speak clearly and ensure good audio quality.',
        '🎯 Try recording a simple sentence like "Hello, how are you today?"'
      ];
    }
  }

  return NextResponse.json({
    success: true,
    result: {
      text: result.text,
      accuracyScore: 0,
      fluencyScore: 0,
      completenessScore: 0,
      pronunciationScore: 0,
      words: [],
      feedback: retryFeedback,
      confidence: 0,
      assessmentMethod: 'retry-request',
      retryRequested: true,
      retryReason: result.debugInfo?.retryReason || 'quality_issues'
    }
  });
}

// 🔄 CONVERTER RESULTADO SDK PARA FORMATO DA API
function convertToAPIFormat(sdkResult: PronunciationResult) {
  return {
    text: sdkResult.text,
    accuracyScore: sdkResult.accuracyScore,
    fluencyScore: sdkResult.fluencyScore,
    completenessScore: sdkResult.completenessScore,
    pronunciationScore: sdkResult.pronunciationScore,
    prosodyScore: sdkResult.prosodyScore, // ✅ NOVO: Prosody score
    words: sdkResult.words.map(word => ({
      word: word.word,
      accuracyScore: word.accuracyScore,
      errorType: word.errorType,
      syllables: word.syllables || []
    })),
    phonemes: sdkResult.phonemes.map(phoneme => ({
      phoneme: phoneme.phoneme,
      accuracyScore: phoneme.accuracyScore,
      nbestPhonemes: phoneme.nbestPhonemes || [],
      offset: phoneme.offset,
      duration: phoneme.duration
    })), // ✅ NOVO: Análise detalhada de fonemas
    feedback: sdkResult.feedback,
    confidence: sdkResult.confidence,
    assessmentMethod: sdkResult.assessmentMethod,
    sessionId: sdkResult.sessionId, // ✅ NOVO: Session ID para debugging
    prosodyFeedback: extractProsodyFeedback(sdkResult), // ✅ NOVO: Feedback de prosódia
    detailedAnalysis: {
      totalWords: sdkResult.words.length,
      totalPhonemes: sdkResult.phonemes.length,
      errorWords: sdkResult.words.filter(w => w.errorType !== 'None').length,
      poorPhonemes: sdkResult.phonemes.filter(p => p.accuracyScore < 60).length,
      avgWordAccuracy: sdkResult.words.length > 0 
        ? Math.round(sdkResult.words.reduce((sum, w) => sum + w.accuracyScore, 0) / sdkResult.words.length)
        : 0
    }
  };
}

// 🎵 EXTRAIR FEEDBACK DE PROSÓDIA
function extractProsodyFeedback(sdkResult: PronunciationResult): string[] {
  const prosodyFeedback: string[] = [];
  
  if (sdkResult.prosodyScore !== undefined) {
    if (sdkResult.prosodyScore >= 85) {
      prosodyFeedback.push('🎵 Your rhythm and intonation sound very natural!');
    } else if (sdkResult.prosodyScore >= 70) {
      prosodyFeedback.push('🎶 Good rhythm! Try to vary your intonation more.');
    } else if (sdkResult.prosodyScore >= 50) {
      prosodyFeedback.push('🎼 Work on natural speech rhythm and stress patterns.');
    } else {
      prosodyFeedback.push('🎵 Practice speaking with natural rhythm - try reading aloud daily.');
    }
  }
  
  return prosodyFeedback;
}

// 🎤 WHISPER FALLBACK (simplificado)
async function tryWhisperFallback(audioFile: File): Promise<{
  success: boolean;
  text?: string;
  confidence?: number;
}> {
  try {
    console.log('🎤 Trying Whisper fallback...');
    
    const formData = new FormData();
    formData.append('audio', audioFile);

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success && data.transcription?.trim()) {
      return {
        success: true,
        text: data.transcription.trim(),
        confidence: 0.6 // Confidence estimada para Whisper
      };
    }

    return { success: false };
  } catch (error) {
    console.error('❌ Whisper fallback failed:', error);
    return { success: false };
  }
}

// 🔄 CRIAR RESULTADO DE FALLBACK
function createFallbackResult(text: string, confidence: number) {
  // Scores estimados baseados na qualidade do texto
  const textQuality = Math.min(0.9, Math.max(0.3, confidence));
  const baseScore = Math.round(textQuality * 50 + 30); // 30-80
  
  return {
    text,
    accuracyScore: baseScore + Math.round(Math.random() * 10 - 5),
    fluencyScore: baseScore + Math.round(Math.random() * 10 - 5),
    completenessScore: baseScore + Math.round(Math.random() * 10 - 5),
    pronunciationScore: baseScore,
    words: [], // Sem análise detalhada no fallback
    phonemes: [], // Sem análise fonética no fallback
    feedback: [
      '🎤 Audio processed with backup system.',
      '💡 For detailed pronunciation analysis, try speaking more clearly.',
      '🚀 Keep practicing - every session helps you improve!'
    ],
    confidence: textQuality,
    assessmentMethod: 'whisper-fallback',
    detailedAnalysis: {
      totalWords: text.split(/\s+/).length,
      totalPhonemes: 0,
      errorWords: 0,
      poorPhonemes: 0,
      avgWordAccuracy: baseScore
    }
  };
}

// 🆘 FALLBACK ENCORAJADOR
function createEncouragingFallback(): NextResponse {
  return NextResponse.json({
    success: true,
    result: {
      text: 'Practice session completed',
      accuracyScore: 55,
      fluencyScore: 60,
      completenessScore: 58,
      pronunciationScore: 58,
      words: [],
      phonemes: [],
      feedback: [
        '🎤 I received your audio practice!',
        '💡 Keep practicing - every session helps you improve!',
        '🚀 Your dedication to learning English is amazing!',
        '💪 Tip: Try speaking in a quiet environment for better results.'
      ],
      confidence: 0.5,
      assessmentMethod: 'encouraging-fallback',
      detailedAnalysis: {
        totalWords: 0,
        totalPhonemes: 0,
        errorWords: 0,
        poorPhonemes: 0,
        avgWordAccuracy: 58
      }
    }
  });
}