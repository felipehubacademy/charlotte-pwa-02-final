// app/api/test-azure-speech/route.ts - Teste específico do Azure Speech SDK

import { NextRequest, NextResponse } from 'next/server';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Testing Azure Speech SDK directly...');
    
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

    // Processar FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const referenceText = formData.get('referenceText') as string || 'Hello world';

    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 });
    }

    console.log('📁 Audio file info:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Configurar Speech SDK
    const speechConfig = speechsdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.outputFormat = speechsdk.OutputFormat.Detailed;

    // Converter arquivo para buffer
    const audioBuffer = await audioFile.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    console.log('🎵 Audio buffer info:', {
      byteLength: audioBuffer.byteLength,
      firstBytes: Array.from(audioData.slice(0, 10))
    });

    // Criar audio config
    const audioConfig = speechsdk.AudioConfig.fromWavFileInput(Buffer.from(audioBuffer));

    // Configurar pronunciation assessment
    const pronunciationConfig = new speechsdk.PronunciationAssessmentConfig(
      referenceText,
      speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
      speechsdk.PronunciationAssessmentGranularity.Phoneme,
      true // enable miscue
    );

    // Criar recognizer
    const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationConfig.applyTo(recognizer);

    console.log('🎯 Starting recognition...');

    return new Promise<NextResponse>((resolve) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          console.log('✅ Recognition completed:', {
            reason: result.reason,
            text: result.text,
            resultId: result.resultId
          });

          if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
            const pronunciationResult = speechsdk.PronunciationAssessmentResult.fromResult(result);
            
            resolve(NextResponse.json({
              success: true,
              result: {
                text: result.text,
                pronunciationScore: pronunciationResult.pronunciationScore,
                accuracyScore: pronunciationResult.accuracyScore,
                fluencyScore: pronunciationResult.fluencyScore,
                completenessScore: pronunciationResult.completenessScore,
                words: (pronunciationResult as any).words?.map((w: any) => ({
                  word: w.word,
                  accuracyScore: w.accuracyScore,
                  errorType: w.errorType
                })) || []
              },
              debug: {
                reason: speechsdk.ResultReason[result.reason],
                resultId: result.resultId,
                offset: result.offset,
                duration: result.duration
              }
            }));
          } else {
            console.log('❌ Recognition failed:', {
              reason: speechsdk.ResultReason[result.reason],
              errorDetails: result.errorDetails
            });

            resolve(NextResponse.json({
              success: false,
              error: `Speech recognition failed: ${speechsdk.ResultReason[result.reason]}`,
              details: {
                reason: speechsdk.ResultReason[result.reason],
                errorDetails: result.errorDetails,
                resultId: result.resultId
              }
            }));
          }

          recognizer.close();
        },
        (error) => {
          console.error('❌ Recognition error:', error);
          
          resolve(NextResponse.json({
            success: false,
            error: `Recognition error: ${error}`,
            details: { error: error.toString() }
          }));

          recognizer.close();
        }
      );
    });

  } catch (error: any) {
    console.error('❌ Azure Speech test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Azure Speech test failed',
      details: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 });
  }
} 