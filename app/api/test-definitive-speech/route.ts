// app/api/test-definitive-speech/route.ts - Teste da implementação definitiva

import { NextRequest, NextResponse } from 'next/server';
import { assessPronunciationOfficial } from '@/lib/azure-speech-sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing DEFINITIVE Azure Speech SDK implementation...');
    
    // Verificar credenciais
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      return NextResponse.json({
        success: false,
        error: 'Azure Speech credentials not configured',
        credentials: {
          hasKey: !!process.env.AZURE_SPEECH_KEY,
          hasRegion: !!process.env.AZURE_SPEECH_REGION,
          region: process.env.AZURE_SPEECH_REGION
        }
      }, { status: 500 });
    }

    console.log('🔑 Azure credentials verified:', {
      hasKey: !!process.env.AZURE_SPEECH_KEY,
      keyLength: process.env.AZURE_SPEECH_KEY?.length,
      region: process.env.AZURE_SPEECH_REGION
    });

    // Processar FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const referenceText = formData.get('referenceText') as string || 'Hello world';

    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided for testing'
      }, { status: 400 });
    }

    console.log('📁 Testing with audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      referenceText
    });

    // Converter para blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type
    });

    console.log('🎯 Starting definitive assessment test...');
    const startTime = Date.now();

    // 🔍 CAPTURAR LOGS DETALHADOS DO AZURE
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    const capturedLogs: string[] = [];
    
    console.log = (...args) => {
      capturedLogs.push(`[LOG] ${args.join(' ')}`);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      capturedLogs.push(`[ERROR] ${args.join(' ')}`);
      originalConsoleError(...args);
    };
    
    console.warn = (...args) => {
      capturedLogs.push(`[WARN] ${args.join(' ')}`);
      originalConsoleWarn(...args);
    };

    // Executar teste da implementação definitiva
    const result = await assessPronunciationOfficial(
      audioBlob,
      referenceText?.trim() || undefined,
      'Intermediate'
    );
    
    // Restaurar console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log('📊 Definitive test completed:', {
      success: result.success,
      processingTime,
      hasResult: !!result.result,
      error: result.error
    });

    // Preparar resposta detalhada
    const testResponse = {
      success: result.success,
      processingTime,
      implementation: 'definitive-azure-speech-sdk',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelRegion: process.env.VERCEL_REGION,
        azureRegion: process.env.AZURE_SPEECH_REGION
      },
      input: {
        audioType: audioFile.type,
        audioSize: audioFile.size,
        referenceText,
        hasReferenceText: !!referenceText
      },
      result: result.success ? {
        text: result.result?.text,
        pronunciationScore: result.result?.pronunciationScore,
        accuracyScore: result.result?.accuracyScore,
        fluencyScore: result.result?.fluencyScore,
        completenessScore: result.result?.completenessScore,
        prosodyScore: result.result?.prosodyScore,
        wordsCount: result.result?.words?.length || 0,
        phonemesCount: result.result?.phonemes?.length || 0,
        feedbackCount: result.result?.feedback?.length || 0,
        assessmentMethod: result.result?.assessmentMethod,
        sessionId: result.result?.sessionId
      } : null,
      error: result.error,
      shouldRetry: result.shouldRetry,
      retryReason: result.retryReason,
      debugInfo: result.debugInfo,
      capturedLogs: capturedLogs.slice(-50), // Últimos 50 logs
      recommendations: generateTestRecommendations(result, audioFile.type)
    };

    return NextResponse.json(testResponse);

  } catch (error: any) {
    console.error('❌ Definitive test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Definitive test failed',
      implementation: 'definitive-azure-speech-sdk',
      details: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// Método GET para instruções
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Definitive Azure Speech SDK Test Endpoint',
    description: 'Tests the definitive implementation with audio conversion',
    instructions: [
      'Send a POST request with an audio file in FormData (key: "audio")',
      'Optionally include reference text (key: "referenceText")',
      'Supports WebM/Opus (will be converted to WAV PCM 16kHz mono)',
      'Tests the complete pipeline including audio conversion'
    ],
    supportedFormats: [
      'audio/webm;codecs=opus (recommended for browser recording)',
      'audio/wav (direct support)',
      'Other formats (will attempt conversion)'
    ],
    example: 'curl -X POST -F "audio=@recording.webm" -F "referenceText=Hello world" /api/test-definitive-speech',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      azureRegion: process.env.AZURE_SPEECH_REGION,
      hasCredentials: !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION)
    }
  });
}

// Gerar recomendações baseadas no resultado do teste
function generateTestRecommendations(result: any, audioType: string): string[] {
  const recommendations: string[] = [];

  if (result.success) {
    recommendations.push('✅ Definitive implementation working correctly');
    
    if (result.result?.pronunciationScore >= 80) {
      recommendations.push('🎉 High quality pronunciation assessment achieved');
    } else if (result.result?.pronunciationScore >= 60) {
      recommendations.push('👍 Good pronunciation assessment quality');
    } else {
      recommendations.push('📚 Assessment working but consider audio quality');
    }

    if (result.result?.wordsCount > 0) {
      recommendations.push(`📝 Word-level analysis working (${result.result.wordsCount} words analyzed)`);
    }

    if (result.result?.phonemesCount > 0) {
      recommendations.push(`🔤 Phoneme-level analysis working (${result.result.phonemesCount} phonemes analyzed)`);
    }

    if (result.result?.prosodyScore !== undefined) {
      recommendations.push('🎵 Prosody assessment feature active');
    }

  } else {
    recommendations.push('❌ Definitive implementation needs attention');
    
    if (result.error?.includes('credentials')) {
      recommendations.push('🔑 Check Azure Speech Service credentials');
    }

    if (result.error?.includes('not recognized')) {
      recommendations.push('🎤 Check audio quality and format compatibility');
    }

    if (result.error?.includes('conversion')) {
      recommendations.push('🔄 Audio conversion process needs debugging');
    }

    if (audioType.includes('webm')) {
      recommendations.push('🎵 WebM conversion is being attempted - check Web Audio API availability');
    }

    if (result.shouldRetry) {
      recommendations.push('🔄 System suggests retry - likely temporary issue');
    }
  }

  // Recomendações gerais
  if (audioType.includes('webm') || audioType.includes('opus')) {
    recommendations.push('💡 WebM/Opus detected - conversion to WAV PCM is automatic');
  }

  recommendations.push('🧪 Run multiple tests with different audio samples for comprehensive validation');
  recommendations.push('📊 Check Azure Portal logs for detailed service information');

  return recommendations;
} 