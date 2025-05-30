// app/api/audio-pipeline-test/route.ts - Teste completo do pipeline de áudio

import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/transcribe';
import { assessPronunciation } from '@/lib/pronunciation';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Testing complete audio pipeline...');
    
    // Verificar se recebeu arquivo de áudio
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided for testing'
      }, { status: 400 });
    }
    
    console.log('📁 Audio file received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });
    
    // Converter para Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { 
      type: audioFile.type 
    });
    
    console.log('🔄 Starting parallel processing...');
    
    // Testar o mesmo fluxo que o app usa
    const startTime = Date.now();
    
    const [transcriptionResult, pronunciationResult] = await Promise.allSettled([
      transcribeAudio(audioBlob),
      assessPronunciation(audioBlob)
    ]);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log('⏱️ Processing completed in:', processingTime, 'ms');
    
    // Analisar resultados
    const transcriptionSuccess = transcriptionResult.status === 'fulfilled' && transcriptionResult.value.success;
    const pronunciationSuccess = pronunciationResult.status === 'fulfilled' && pronunciationResult.value.success;
    
    console.log('📊 Results analysis:', {
      transcriptionSuccess,
      pronunciationSuccess,
      processingTime
    });
    
    // Preparar resposta detalhada
    const response = {
      success: transcriptionSuccess && pronunciationSuccess,
      processingTime,
      transcription: {
        success: transcriptionSuccess,
        status: transcriptionResult.status,
        ...(transcriptionResult.status === 'fulfilled' 
          ? { 
              result: transcriptionResult.value,
              text: transcriptionResult.value.transcription 
            }
          : { 
              error: transcriptionResult.reason?.message || 'Unknown error',
              details: transcriptionResult.reason 
            }
        )
      },
      pronunciation: {
        success: pronunciationSuccess,
        status: pronunciationResult.status,
        ...(pronunciationResult.status === 'fulfilled' 
          ? { 
              result: pronunciationResult.value,
              scores: pronunciationResult.value.result ? {
                pronunciation: pronunciationResult.value.result.pronunciationScore,
                accuracy: pronunciationResult.value.result.accuracyScore,
                fluency: pronunciationResult.value.result.fluencyScore,
                completeness: pronunciationResult.value.result.completenessScore
              } : null
            }
          : { 
              error: pronunciationResult.reason?.message || 'Unknown error',
              details: pronunciationResult.reason 
            }
        )
      }
    };
    
    console.log('📋 Final test result:', {
      overallSuccess: response.success,
      transcriptionOK: response.transcription.success,
      pronunciationOK: response.pronunciation.success,
      processingTime: response.processingTime
    });
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Audio pipeline test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Audio pipeline test failed',
      details: {
        message: error.message,
        stack: error.stack,
        environment: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}

// Método GET para instruções
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Audio Pipeline Test Endpoint',
    instructions: 'Send a POST request with an audio file in FormData (key: "audio")',
    example: 'curl -X POST -F "audio=@test.wav" https://your-domain.vercel.app/api/audio-pipeline-test'
  });
} 