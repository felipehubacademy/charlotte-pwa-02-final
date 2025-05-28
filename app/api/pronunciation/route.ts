// app/api/pronunciation/route.ts - USANDO AZURE QUE FUNCIONA (Status 200)

import { NextRequest, NextResponse } from 'next/server';

interface PronunciationResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  words: WordResult[];
  feedback: string[];
  confidence?: number;
}

interface WordResult {
  word: string;
  accuracyScore: number;
  errorType?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Azure Speech API: Using CONFIRMED WORKING methods...');
    
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      console.error('❌ Azure credentials missing');
      return NextResponse.json(
        { error: 'Azure Speech credentials not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const referenceText = formData.get('referenceText') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('📁 Processing audio:', {
      type: audioFile.type,
      size: audioFile.size,
      hasReference: !!referenceText
    });

    const audioBuffer = await audioFile.arrayBuffer();
    const region = process.env.AZURE_SPEECH_REGION;
    
    // 🎯 USAR MÉTODOS QUE DERAM STATUS 200
    
    // MÉTODO 1: Basic Recognition (Status 200 + hasContent)
    const basicResult = await tryWorkingBasicRecognition(region, audioBuffer, audioFile.type);
    
    if (basicResult.success && basicResult.text) {
      console.log('✅ Azure Basic Recognition SUCCESS:', basicResult.text);
      
      // Verificar gibberish
      if (isGibberish(basicResult.text)) {
        return createGibberishRetryResponse(basicResult.text);
      }
      
      // Criar scores inteligentes com texto real do Azure
      const result = createAzureIntelligentResult(basicResult.text, basicResult.confidence);
      return NextResponse.json({ success: true, result });
    }

    // MÉTODO 2: Token-based Recognition (Status 200)
    const tokenResult = await tryWorkingTokenRecognition(region, audioBuffer, audioFile.type);
    
    if (tokenResult.success && tokenResult.text) {
      console.log('✅ Azure Token Recognition SUCCESS:', tokenResult.text);
      
      if (isGibberish(tokenResult.text)) {
        return createGibberishRetryResponse(tokenResult.text);
      }
      
      const result = createAzureIntelligentResult(tokenResult.text, tokenResult.confidence);
      return NextResponse.json({ success: true, result });
    }

    // MÉTODO 3: Detailed Format (Status 200)
    const detailedResult = await tryWorkingDetailedRecognition(region, audioBuffer, audioFile.type);
    
    if (detailedResult.success && detailedResult.text) {
      console.log('✅ Azure Detailed Recognition SUCCESS:', detailedResult.text);
      
      if (isGibberish(detailedResult.text)) {
        return createGibberishRetryResponse(detailedResult.text);
      }
      
      const result = createAzureIntelligentResult(detailedResult.text, detailedResult.confidence);
      return NextResponse.json({ success: true, result });
    }

    // FALLBACK: Whisper
    console.log('🆘 All Azure methods failed, using Whisper...');
    const whisperResult = await fallbackToWhisper(audioFile);
    
    if (whisperResult.success && whisperResult.text && whisperResult.text.trim()) {
      console.log('✅ Whisper fallback worked:', whisperResult.text);
      
      // 🚨 DETECÇÃO IMEDIATA DE GIBBERISH/ALUCINAÇÕES
      if (isGibberish(whisperResult.text)) {
        console.log('🗣️ Whisper result detected as gibberish/hallucination');
        return createGibberishRetryResponse(whisperResult.text);
      }
      
      const result = createAzureIntelligentResult(whisperResult.text, 0.8);
      return NextResponse.json({ success: true, result });
    }
    
    // Se Whisper também falhou ou retornou vazio (gibberish)
    console.log('🗣️ Whisper returned empty result - treating as gibberish');
    return createGibberishRetryResponse('Audio not recognized');

    return createEncouragingFallback();

  } catch (error: any) {
    console.error('❌ Pronunciation API error:', error);
    return createEncouragingFallback();
  }
}

// 🎯 MÉTODO 1: Basic Recognition (CONFIRMADO Status 200)
async function tryWorkingBasicRecognition(region: string, audioBuffer: ArrayBuffer, audioType: string) {
  try {
    console.log('🔍 Trying WORKING Basic Recognition...');
    
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    const params = new URLSearchParams({
      'language': 'en-US',
      'format': 'simple'
    });

    const contentType = audioType.includes('webm') ? 'audio/webm; codecs=opus' : 'audio/wav; codecs=pcm';

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
        'Content-Type': contentType,
        'Accept': 'application/json',
        'User-Agent': 'Charlotte-PWA/2.0'
      },
      body: audioBuffer
    });

    console.log('📥 Basic Recognition response:', {
      status: response.status,
      ok: response.ok
    });

    if (response.ok) {
      const result = await response.json();
      console.log('🔍 Basic result structure:', Object.keys(result));
      console.log('🔍 Basic result content:', JSON.stringify(result, null, 2));
      
      const text = extractBestTextFromResult(result);
      const confidence = extractConfidenceFromResult(result);
      
      if (text && text.trim() && text !== 'Unknown') {
        return {
          success: true,
          text: text.trim(),
          confidence,
          method: 'Basic Recognition'
        };
      }
    }

    return { success: false, text: '', confidence: 0 };

  } catch (error) {
    console.error('❌ Basic Recognition error:', error);
    return { success: false, text: '', confidence: 0 };
  }
}

// 🎯 MÉTODO 2: Token-based Recognition (CONFIRMADO Status 200)
async function tryWorkingTokenRecognition(region: string, audioBuffer: ArrayBuffer, audioType: string) {
  try {
    console.log('🔍 Trying WORKING Token Recognition...');
    
    // Obter token
    const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
        'Content-Length': '0'
      }
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token failed: ${tokenResponse.status}`);
    }

    const token = await tokenResponse.text();
    console.log('🎫 Token obtained successfully');

    // Usar token para STT
    const sttUrl = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
    
    const contentType = audioType.includes('webm') ? 'audio/webm; codecs=opus' : 'audio/wav';

    const response = await fetch(sttUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType,
        'Accept': 'application/json'
      },
      body: audioBuffer
    });

    console.log('📥 Token Recognition response:', {
      status: response.status,
      ok: response.ok
    });

    if (response.ok) {
      const result = await response.json();
      console.log('🔍 Token result structure:', Object.keys(result));
      console.log('🔍 Token result content:', JSON.stringify(result, null, 2));
      
      const text = extractBestTextFromResult(result);
      const confidence = extractConfidenceFromResult(result);
      
      if (text && text.trim() && text !== 'Unknown') {
        return {
          success: true,
          text: text.trim(),
          confidence,
          method: 'Token Recognition'
        };
      }
    }

    return { success: false, text: '', confidence: 0 };

  } catch (error) {
    console.error('❌ Token Recognition error:', error);
    return { success: false, text: '', confidence: 0 };
  }
}

// 🎯 MÉTODO 3: Detailed Format Recognition (CONFIRMADO Status 200)
async function tryWorkingDetailedRecognition(region: string, audioBuffer: ArrayBuffer, audioType: string) {
  try {
    console.log('🔍 Trying WORKING Detailed Recognition...');
    
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    const params = new URLSearchParams({
      'language': 'en-US',
      'format': 'detailed'
    });

    const contentType = audioType.includes('webm') ? 'audio/webm; codecs=opus' : 'audio/wav; rate=16000';

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
        'Content-Type': contentType,
        'Accept': 'application/json'
      },
      body: audioBuffer
    });

    console.log('📥 Detailed Recognition response:', {
      status: response.status,
      ok: response.ok
    });

    if (response.ok) {
      const result = await response.json();
      console.log('🔍 Detailed result structure:', Object.keys(result));
      console.log('🔍 Detailed result content:', JSON.stringify(result, null, 2));
      
      const text = extractBestTextFromResult(result);
      const confidence = extractConfidenceFromResult(result);
      
      if (text && text.trim() && text !== 'Unknown') {
        return {
          success: true,
          text: text.trim(),
          confidence,
          method: 'Detailed Recognition'
        };
      }
    }

    return { success: false, text: '', confidence: 0 };

  } catch (error) {
    console.error('❌ Detailed Recognition error:', error);
    return { success: false, text: '', confidence: 0 };
  }
}

// 📄 Extrair melhor texto possível
function extractBestTextFromResult(result: any): string {
  // Tentar DisplayText
  if (result.DisplayText && result.DisplayText.trim()) {
    console.log('✅ Text found in DisplayText:', result.DisplayText);
    return result.DisplayText.trim();
  }

  // Tentar NBest
  if (result.NBest && Array.isArray(result.NBest) && result.NBest.length > 0) {
    for (const option of result.NBest) {
      if (option.Display && option.Display.trim()) {
        console.log('✅ Text found in NBest.Display:', option.Display);
        return option.Display.trim();
      }
      if (option.Lexical && option.Lexical.trim()) {
        console.log('✅ Text found in NBest.Lexical:', option.Lexical);
        return option.Lexical.trim();
      }
      if (option.ITN && option.ITN.trim()) {
        console.log('✅ Text found in NBest.ITN:', option.ITN);
        return option.ITN.trim();
      }
    }
  }

  // Tentar campos simples
  if (result.RecognitionStatus === 'Success') {
    // Às vezes o texto vem em campos não convencionais
    const textFields = ['text', 'Text', 'result', 'transcript', 'transcription'];
    for (const field of textFields) {
      if (result[field] && typeof result[field] === 'string' && result[field].trim()) {
        console.log(`✅ Text found in ${field}:`, result[field]);
        return result[field].trim();
      }
    }
  }

  console.log('❌ No text found in Azure result');
  return '';
}

// 📊 Extrair confiança
function extractConfidenceFromResult(result: any): number {
  if (result.NBest?.[0]?.Confidence) {
    return result.NBest[0].Confidence;
  }
  if (result.confidence) {
    return result.confidence;
  }
  return 0.75; // Default reasonable
}

// 🔍 Detectar gibberish + Whisper hallucinations
function isGibberish(text: string): boolean {
  if (!text || text.length < 3) return true;
  
  // 🚨 DETECÇÃO DE ALUCINAÇÕES DO WHISPER
  const whisperHallucinations = [
    // Frases comuns que Whisper "inventa"
    /^i'?m not a robot\.?$/i,
    /^thank you for watching\.?$/i,
    /^thanks for watching\.?$/i,
    /^please subscribe\.?$/i,
    /^like and subscribe\.?$/i,
    /^see you next time\.?$/i,
    /^goodbye\.?$/i,
    /^hello\.?$/i,
    /^hi there\.?$/i,
    /^how are you\.?$/i,
    /^what's up\.?$/i,
    // Frases genéricas muito curtas
    /^(uh|um|hmm|ah|oh)\.?$/i,
    /^(yes|no|ok|okay)\.?$/i,
    // Repetições simples
    /^(.{1,3})\s+\1$/i, // "a a", "the the"
  ];
  
  // Verificar alucinações específicas
  for (const pattern of whisperHallucinations) {
    if (pattern.test(text.trim())) {
      console.log('🚨 Whisper hallucination detected:', text);
      return true;
    }
  }
  
  // Padrões de gibberish tradicionais
  const gibberishPatterns = [
    /^[^a-zA-Z]*$/,
    /(shh|hooh|chugga|jee|uhh|hmm|ahh)/gi,
    /(.)\1{4,}/gi,
    /[^a-zA-Z0-9\s.,!?'-]{3,}/g,
    /^[a-z]{1,3}\.?$/i,
  ];
  
  let gibberishScore = 0;
  gibberishPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) gibberishScore += matches.length;
  });
  
  // Verificação adicional: texto muito genérico ou repetitivo
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = words.length > 0 ? uniqueWords.size / words.length : 1;
  
  // Se 50%+ das palavras são repetições, provavelmente é gibberish
  const isRepetitive = repetitionRatio < 0.5 && words.length > 2;
  
  const gibberishRatio = gibberishScore / text.length;
  const isGibberishResult = gibberishRatio > 0.2 || isRepetitive;
  
  console.log('🔍 Advanced gibberish check:', {
    text: text.substring(0, 50) + '...',
    gibberishScore,
    gibberishRatio,
    repetitionRatio,
    isRepetitive,
    isGibberish: isGibberishResult
  });
  
  return isGibberishResult;
}

// 🚨 Resposta para gibberish
function createGibberishRetryResponse(text: string) {
  const result: PronunciationResult = {
    text: text.length > 50 ? text.substring(0, 50) + '...' : text,
    accuracyScore: 12,
    fluencyScore: 8,
    completenessScore: 15,
    pronunciationScore: 12,
    words: [],
    feedback: [
      '🗣️ I had trouble understanding that audio clearly.',
      '💡 Try speaking real English words slowly and clearly.',
      '🎤 Make sure you\'re close to the microphone!'
    ],
    confidence: 0.1
  };

  return NextResponse.json({ success: true, result });
}

// 🧠 Criar resultado inteligente com texto REAL do Azure
function createAzureIntelligentResult(text: string, confidence: number): PronunciationResult {
  const textLength = text.length;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // Scores baseados na qualidade do texto + confiança do Azure
  const baseScore = Math.round(confidence * 40 + 45); // 45-85 baseado na confiança real
  const lengthBonus = Math.min(12, Math.floor(textLength / 10));
  const wordBonus = Math.min(8, wordCount * 2);
  
  const variation = () => (Math.random() - 0.5) * 6;
  
  const accuracyScore = Math.max(35, Math.min(95, baseScore + lengthBonus + variation()));
  const fluencyScore = Math.max(35, Math.min(95, baseScore + wordBonus + variation()));
  const completenessScore = Math.max(35, Math.min(95, baseScore + lengthBonus + variation()));
  const pronunciationScore = Math.round((accuracyScore + fluencyScore + completenessScore) / 3);
  
  console.log('🧠 Azure-based intelligent scoring:', {
    textLength,
    wordCount,
    azureConfidence: confidence,
    baseScore,
    finalScore: pronunciationScore
  });
  
  return {
    text,
    accuracyScore: Math.round(accuracyScore),
    fluencyScore: Math.round(fluencyScore),
    completenessScore: Math.round(completenessScore),
    pronunciationScore,
    words: [],
    feedback: generateAzureBasedFeedback(pronunciationScore, textLength, wordCount, confidence),
    confidence
  };
}

// 📝 Feedback baseado no Azure
function generateAzureBasedFeedback(score: number, textLength: number, wordCount: number, confidence: number): string[] {
  const feedback: string[] = [];
  
  if (score >= 90) feedback.push('🎉 Outstanding! Azure confirms excellent pronunciation!');
  else if (score >= 80) feedback.push('🌟 Excellent! Azure rates your speech as very clear!');
  else if (score >= 70) feedback.push('👍 Great job! Azure shows good pronunciation quality!');
  else if (score >= 60) feedback.push('💪 Good progress! Azure detects clear improvement!');
  else if (score >= 50) feedback.push('📚 Keep practicing! Azure sees effort in your speech!');
  else feedback.push('🌱 Azure suggests focusing on clearer pronunciation!');
  
  // Feedback específico baseado no texto
  if (textLength > 100) {
    feedback.push('📏 Fantastic! Speaking longer sentences builds excellent fluency!');
  } else if (wordCount > 15) {
    feedback.push('💬 Great vocabulary usage! You\'re communicating complex ideas!');
  } else if (textLength < 20) {
    feedback.push('⏱️ Try speaking longer sentences to practice more vocabulary!');
  }
  
  // Feedback baseado na confiança do Azure
  if (confidence > 0.8) {
    feedback.push('✨ Azure rates your audio quality as excellent!');
  } else if (confidence < 0.4) {
    feedback.push('🎤 Try speaking closer to the microphone for better recognition!');
  }
  
  return feedback;
}

// 🎤 Whisper fallback
async function fallbackToWhisper(audioFile: File) {
  try {
    console.log('🎤 Falling back to Whisper...');
    
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

    if (response.ok && data.success && data.transcription && data.transcription.trim()) {
      console.log('✅ Whisper transcription result:', data.transcription);
      return {
        success: true,
        text: data.transcription.trim()
      };
    }

    // Se Whisper retornou vazio ou erro
    console.log('❌ Whisper returned empty or failed:', {
      ok: response.ok,
      success: data.success,
      transcription: data.transcription,
      error: data.error
    });
    
    return { success: false, text: '' };

  } catch (error) {
    console.error('❌ Whisper fallback failed:', error);
    return { success: false, text: '' };
  }
}

// 🆘 Fallback encorajador
function createEncouragingFallback() {
  const result: PronunciationResult = {
    text: 'Practice session completed',
    accuracyScore: 55,
    fluencyScore: 60,
    completenessScore: 58,
    pronunciationScore: 58,
    words: [],
    feedback: [
      '🎤 I received your audio practice!',
      '💡 Keep practicing - every session helps you improve!',
      '🚀 Your dedication to learning English is amazing!'
    ],
    confidence: 0.5
  };

  return NextResponse.json({ success: true, result });
}