// app/api/audio-pipeline-test/route.ts - Teste completo do pipeline de áudio

import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/transcribe';
import { assessPronunciation } from '@/lib/pronunciation';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Testing complete audio pipeline...');
    
    // Verificar se recebeu arquivo de áudio
    let audioFile: File | null = null;
    let audioBlob: Blob;
    
    try {
      const formData = await request.formData();
      audioFile = formData.get('audio') as File;
    } catch (error) {
      // Se não conseguir ler FormData, criar áudio sintético para teste
      console.log('📝 No FormData received, creating synthetic audio for testing...');
    }
    
    if (!audioFile) {
      // Criar áudio sintético para teste
      console.log('🎵 Creating synthetic audio for pipeline test...');
      
      const sampleRate = 16000;
      const duration = 2;
      const numSamples = sampleRate * duration;
      const dataSize = numSamples * 2; // 16-bit samples
      const fileSize = 44 + dataSize;
      
      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, fileSize - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);

      // Generate synthetic audio data
      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const freq = 440 + Math.sin(t * 2) * 100; // Varying frequency
        const sample = Math.sin(2 * Math.PI * freq * t) * 0.3;
        const intSample = Math.round(sample * 32767);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
      
      audioBlob = new Blob([buffer], { type: 'audio/wav' });
      
      console.log('✅ Synthetic audio created for testing:', {
        size: audioBlob.size,
        type: audioBlob.type,
        duration: `${duration}s`
      });
    } else {
      console.log('📁 Audio file received:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });
      
      // Converter para Blob
      audioBlob = new Blob([await audioFile.arrayBuffer()], { 
        type: audioFile.type 
      });
    }
    
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