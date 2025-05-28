// app/api/azure-force-log/route.ts - FORÇAR LOG ESPECÍFICO DO SPEECH

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Forcing Azure Speech Service log generation...');
    
    const region = process.env.AZURE_SPEECH_REGION;
    const key = process.env.AZURE_SPEECH_KEY;
    
    if (!region || !key) {
      return NextResponse.json({ error: 'Missing credentials' });
    }

    // 🎯 TESTE COM ÁUDIO MUITO SIMPLES para garantir que chegue no Azure
    
    // Criar um áudio WAV mínimo (1 segundo de silêncio)
    const sampleRate = 16000;
    const duration = 1; // 1 segundo
    const numSamples = sampleRate * duration;
    
    // WAV header (44 bytes) + dados PCM
    const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(wavBuffer);
    
    // WAV header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true); // File size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels (mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, numSamples * 2, true); // Subchunk2Size
    
    // Dados de áudio (silêncio)
    for (let i = 0; i < numSamples; i++) {
      view.setInt16(44 + i * 2, 0, true); // Silêncio
    }

    console.log('🎵 Created minimal WAV:', {
      size: wavBuffer.byteLength,
      duration: duration,
      sampleRate: sampleRate
    });

    // 🎯 MÚLTIPLAS TENTATIVAS SIMULTÂNEAS para forçar logs
    
    const tests = [
      testSpeechRecognition(region, key, wavBuffer, 'Test 1: Basic Recognition'),
      testSpeechRecognition(region, key, wavBuffer, 'Test 2: Detailed Format'),
      testTokenBasedRecognition(region, key, wavBuffer, 'Test 3: Token Auth'),
      testPronunciationAssessment(region, key, wavBuffer, 'Test 4: Pronunciation'),
      testDifferentContentTypes(region, key, wavBuffer, 'Test 5: Content Types')
    ];

    console.log('🚀 Running 5 simultaneous tests to force Azure logs...');
    
    const results = await Promise.allSettled(tests);
    
    const summary = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          test: `Test ${index + 1}`,
          success: result.value.success,
          status: result.value.status,
          hasResponse: !!result.value.response,
          responsePreview: typeof result.value.response === 'string' 
            ? result.value.response.substring(0, 100)
            : JSON.stringify(result.value.response).substring(0, 100)
        };
      } else {
        return {
          test: `Test ${index + 1}`,
          success: false,
          error: result.reason.message
        };
      }
    });

    console.log('📊 All tests completed');

    return NextResponse.json({
      success: true,
      message: 'Multiple Azure Speech API calls sent - check Azure portal logs now!',
      timestamp: new Date().toISOString(),
      results: summary,
      instructions: 'Check Azure Portal > Speech Service > Logs/Monitoring for new entries'
    });

  } catch (error: any) {
    console.error('❌ Force log error:', error);
    return NextResponse.json({
      error: 'Failed to force logs',
      details: error.message
    });
  }
}

// 🎯 TESTE 1: Basic Speech Recognition
async function testSpeechRecognition(region: string, key: string, audioBuffer: ArrayBuffer, testName: string) {
  try {
    console.log(`🔍 ${testName}...`);
    
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    const params = new URLSearchParams({
      'language': 'en-US',
      'format': 'simple'
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav; codecs=pcm',
        'Accept': 'application/json',
        'User-Agent': 'Charlotte-Test/1.0'
      },
      body: audioBuffer
    });

    const responseText = await response.text();
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    console.log(`📥 ${testName} result:`, {
      status: response.status,
      hasContent: responseText.length > 0
    });

    return {
      success: response.ok,
      status: response.status,
      response: parsedResponse,
      testName
    };

  } catch (error: any) {
    console.error(`❌ ${testName} failed:`, error.message);
    return {
      success: false,
      error: error.message,
      testName
    };
  }
}

// 🎯 TESTE 2: Token-based Recognition
async function testTokenBasedRecognition(region: string, key: string, audioBuffer: ArrayBuffer, testName: string) {
  try {
    console.log(`🔍 ${testName}...`);
    
    // Primeiro obter token
    const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Length': '0'
      }
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token failed: ${tokenResponse.status}`);
    }

    const token = await tokenResponse.text();
    
    // Usar token para STT
    const sttUrl = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
    
    const response = await fetch(sttUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'audio/wav',
        'Accept': 'application/json'
      },
      body: audioBuffer
    });

    const responseText = await response.text();
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    console.log(`📥 ${testName} result:`, {
      tokenObtained: true,
      status: response.status
    });

    return {
      success: response.ok,
      status: response.status,
      response: parsedResponse,
      testName
    };

  } catch (error: any) {
    console.error(`❌ ${testName} failed:`, error.message);
    return {
      success: false,
      error: error.message,
      testName
    };
  }
}

// 🎯 TESTE 3: Pronunciation Assessment
async function testPronunciationAssessment(region: string, key: string, audioBuffer: ArrayBuffer, testName: string) {
  try {
    console.log(`🔍 ${testName}...`);
    
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    const params = new URLSearchParams({
      'language': 'en-US',
      'format': 'detailed'
    });

    const pronunciationConfig = {
      ReferenceText: "hello",
      GradingSystem: "HundredMark",
      Granularity: "Word"
    };

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav',
        'Accept': 'application/json',
        'Pronunciation-Assessment': JSON.stringify(pronunciationConfig)
      },
      body: audioBuffer
    });

    const responseText = await response.text();
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    console.log(`📥 ${testName} result:`, {
      status: response.status
    });

    return {
      success: response.ok,
      status: response.status,
      response: parsedResponse,
      testName
    };

  } catch (error: any) {
    console.error(`❌ ${testName} failed:`, error.message);
    return {
      success: false,
      error: error.message,
      testName
    };
  }
}

// 🎯 TESTE 4: Different Content Types
async function testDifferentContentTypes(region: string, key: string, audioBuffer: ArrayBuffer, testName: string) {
  try {
    console.log(`🔍 ${testName}...`);
    
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav; rate=16000',
        'Accept': 'application/json'
      },
      body: audioBuffer
    });

    const responseText = await response.text();
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    console.log(`📥 ${testName} result:`, {
      status: response.status
    });

    return {
      success: response.ok,
      status: response.status,
      response: parsedResponse,
      testName
    };

  } catch (error: any) {
    console.error(`❌ ${testName} failed:`, error.message);
    return {
      success: false,
      error: error.message,
      testName
    };
  }
}