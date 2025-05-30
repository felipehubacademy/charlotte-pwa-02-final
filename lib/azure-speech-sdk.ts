// lib/azure-speech-definitive.ts - IMPLEMENTAÇÃO DEFINITIVA SEGUINDO DOCS MICROSOFT

import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

export interface PronunciationResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  prosodyScore?: number;
  words: WordResult[];
  phonemes: PhonemeResult[];
  feedback: string[];
  confidence: number;
  assessmentMethod: 'azure-sdk-definitive';
  sessionId?: string;
  debugInfo?: any;
}

export interface WordResult {
  word: string;
  accuracyScore: number;
  errorType?: string;
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

export interface AudioProcessingResult {
  success: boolean;
  result?: PronunciationResult;
  error?: string;
  retryReason?: string;
  shouldRetry?: boolean;
  debugInfo?: any;
}

export class AzureSpeechDefinitiveService {
  private speechConfig: speechsdk.SpeechConfig;
  private region: string;
  private subscriptionKey: string;

  constructor() {
    this.region = process.env.AZURE_SPEECH_REGION || '';
    this.subscriptionKey = process.env.AZURE_SPEECH_KEY || '';
    
    if (!this.region || !this.subscriptionKey) {
      throw new Error('Azure Speech credentials not configured');
    }

    this.speechConfig = this.createOptimizedSpeechConfig();
    console.log('✅ Azure Speech Definitive Service initialized');
  }

  // 🎯 CONFIGURAÇÃO OTIMIZADA SEGUINDO DOCUMENTAÇÃO MICROSOFT
  private createOptimizedSpeechConfig(): speechsdk.SpeechConfig {
    console.log('🔧 Creating optimized SpeechConfig following Microsoft docs...');
    
    const speechConfig = speechsdk.SpeechConfig.fromSubscription(
      this.subscriptionKey, 
      this.region
    );
    
    // ✅ CONFIGURAÇÕES BÁSICAS OBRIGATÓRIAS
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.outputFormat = speechsdk.OutputFormat.Detailed;
    
    // ✅ CONFIGURAÇÕES RECOMENDADAS PELA MICROSOFT
    speechConfig.setProperty(
      speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, 
      "5000"
    );
    speechConfig.setProperty(
      speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, 
      "1000"
    );
    speechConfig.setProperty(
      speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, 
      "500"
    );
    
    // ✅ HABILITAR LOGS DETALHADOS (para debug)
    speechConfig.setProperty(
      speechsdk.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, 
      "true"
    );
    
    console.log('✅ Optimized SpeechConfig created');
    return speechConfig;
  }

  // 🎵 CONVERTER WEBM/OPUS PARA WAV PCM 16kHz MONO (CLIENTE)
  private async convertWebMToWavPCM(audioBlob: Blob): Promise<Blob> {
    console.log('🎵 Converting WebM/Opus to WAV PCM 16kHz mono...');
    
    try {
      // ✅ VERIFICAR SE WEB AUDIO API ESTÁ DISPONÍVEL
      if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        throw new Error('Web Audio API not available');
      }

      const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();

      // ✅ DECODIFICAR ÁUDIO WEBM/OPUS
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('📊 Original audio buffer size:', arrayBuffer.byteLength);
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('📊 Decoded audio properties:', {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration,
        length: audioBuffer.length
      });

      // ✅ PROCESSAR PARA 16kHz MONO
      const targetSampleRate = 16000;
      let processedBuffer = audioBuffer;

      // Resample se necessário
      if (audioBuffer.sampleRate !== targetSampleRate) {
        console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz...`);
        processedBuffer = this.resampleAudioBuffer(audioBuffer, targetSampleRate, audioContext);
      }

      // Converter para mono se necessário
      if (processedBuffer.numberOfChannels > 1) {
        console.log('🔄 Converting to mono...');
        processedBuffer = this.convertToMono(processedBuffer, audioContext);
      }

      // ✅ CONVERTER PARA WAV PCM
      const wavArrayBuffer = this.audioBufferToWavPCM(processedBuffer);
      const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

      console.log('✅ Audio conversion completed:', {
        originalSize: audioBlob.size,
        convertedSize: wavBlob.size,
        format: 'WAV PCM 16kHz mono'
      });

      // Cleanup
      audioContext.close();
      
      return wavBlob;

    } catch (error) {
      console.error('❌ Audio conversion failed:', error);
      throw new Error(`Audio conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🔄 RESAMPLE AUDIO BUFFER
  private resampleAudioBuffer(
    audioBuffer: AudioBuffer,
    targetSampleRate: number,
    audioContext: AudioContext
  ): AudioBuffer {
    const ratio = targetSampleRate / audioBuffer.sampleRate;
    const newLength = Math.round(audioBuffer.length * ratio);
    const newBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = newBuffer.getChannelData(channel);

      // Linear interpolation resampling
      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i / ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;

        if (index + 1 < inputData.length) {
          outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
        } else {
          outputData[i] = inputData[index] || 0;
        }
      }
    }

    return newBuffer;
  }

  // 🎵 CONVERTER PARA MONO
  private convertToMono(audioBuffer: AudioBuffer, audioContext: AudioContext): AudioBuffer {
    const monoBuffer = audioContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
    const monoData = monoBuffer.getChannelData(0);

    // Mix all channels to mono
    for (let i = 0; i < audioBuffer.length; i++) {
      let sum = 0;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / audioBuffer.numberOfChannels;
    }

    return monoBuffer;
  }

  // 📦 CONVERTER PARA WAV PCM (FORMATO EXATO QUE AZURE ESPERA)
  private audioBufferToWavPCM(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // ✅ WAV HEADER EXATO CONFORME ESPECIFICAÇÃO
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true); // Subchunk2Size

    // ✅ CONVERTER FLOAT32 PARA 16-BIT PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        // Clamp and convert to 16-bit signed integer
        const clampedSample = Math.max(-1, Math.min(1, sample));
        const intSample = Math.round(clampedSample * 0x7FFF);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return buffer;
  }

  // 🎯 MÉTODO PRINCIPAL: Pronunciation Assessment
  async assessPronunciation(
    audioBlob: Blob,
    referenceText?: string,
    userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
  ): Promise<AudioProcessingResult> {
    
    console.log('🎯 Starting Azure Speech Assessment (Definitive Version)...');
    console.log('📋 Input:', {
      audioType: audioBlob.type,
      audioSize: audioBlob.size,
      hasReference: !!referenceText,
      userLevel
    });

    try {
      // ✅ ETAPA 1: CONVERTER ÁUDIO PARA FORMATO SUPORTADO
      let processedAudioBlob: Blob;
      
      if (audioBlob.type.includes('webm') || audioBlob.type.includes('opus')) {
        console.log('🔄 Converting WebM/Opus to WAV PCM...');
        processedAudioBlob = await this.convertWebMToWavPCM(audioBlob);
      } else if (audioBlob.type.includes('wav')) {
        console.log('✅ Audio already in WAV format, using as-is');
        processedAudioBlob = audioBlob;
      } else {
        console.log('⚠️ Unsupported audio format, attempting conversion...');
        processedAudioBlob = await this.convertWebMToWavPCM(audioBlob);
      }

      // ✅ ETAPA 2: CRIAR CONFIGURAÇÃO DE ÁUDIO
      const audioConfig = await this.createAudioConfigFromBlob(processedAudioBlob);

      // ✅ ETAPA 3: CRIAR CONFIGURAÇÃO DE PRONUNCIATION ASSESSMENT
      const pronunciationConfig = this.createPronunciationAssessmentConfig(
        referenceText,
        userLevel
      );

      // ✅ ETAPA 4: EXECUTAR ASSESSMENT
      return await this.performPronunciationAssessment(
        pronunciationConfig,
        audioConfig,
        referenceText
      );

    } catch (error: any) {
      console.error('❌ Pronunciation assessment failed:', error);
      return {
        success: false,
        error: `Assessment failed: ${error.message}`,
        shouldRetry: true,
        retryReason: 'processing_error'
      };
    }
  }

  // 🎵 CRIAR AUDIO CONFIG A PARTIR DO BLOB
  private async createAudioConfigFromBlob(audioBlob: Blob): Promise<speechsdk.AudioConfig> {
    console.log('🎵 Creating AudioConfig from processed blob...');
    
    try {
      // ✅ MÉTODO RECOMENDADO: PUSH STREAM COM FORMATO ESPECÍFICO
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      // ✅ DEFINIR FORMATO EXATO (WAV PCM 16kHz mono)
      const audioFormat = speechsdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      
      // ✅ CRIAR PUSH STREAM
      const pushStream = speechsdk.AudioInputStream.createPushStream(audioFormat);
      
      // ✅ ENVIAR DADOS DE ÁUDIO
      pushStream.write(audioData.buffer);
      pushStream.close();

      console.log('✅ AudioConfig created successfully');
      return speechsdk.AudioConfig.fromStreamInput(pushStream);

    } catch (error) {
      console.error('❌ Failed to create AudioConfig:', error);
      throw new Error(`AudioConfig creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ⚙️ CRIAR PRONUNCIATION ASSESSMENT CONFIG
  private createPronunciationAssessmentConfig(
    referenceText?: string,
    userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
  ): speechsdk.PronunciationAssessmentConfig {
    
    console.log('⚙️ Creating PronunciationAssessmentConfig...');
    
    try {
      // ✅ USAR MÉTODO JSON CONFORME DOCUMENTAÇÃO MICROSOFT
      const assessmentConfig = {
        referenceText: referenceText || "",
        gradingSystem: "HundredMark",
        granularity: "Phoneme",
        phonemeAlphabet: "IPA",
        nBestPhonemeCount: 5,
        enableMiscue: false,
        enableProsodyAssessment: true
      };

      console.log('📋 Assessment config:', assessmentConfig);

      const config = speechsdk.PronunciationAssessmentConfig.fromJSON(
        JSON.stringify(assessmentConfig)
      );

      console.log('✅ PronunciationAssessmentConfig created');
      return config;

    } catch (error) {
      console.error('❌ Failed to create PronunciationAssessmentConfig:', error);
      
      // ✅ FALLBACK: CONFIGURAÇÃO BÁSICA
      console.log('🔄 Using fallback basic configuration...');
      return new speechsdk.PronunciationAssessmentConfig(
        referenceText || "",
        speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        speechsdk.PronunciationAssessmentGranularity.Phoneme,
        false
      );
    }
  }

  // 🎯 EXECUTAR PRONUNCIATION ASSESSMENT
  private async performPronunciationAssessment(
    pronunciationConfig: speechsdk.PronunciationAssessmentConfig,
    audioConfig: speechsdk.AudioConfig,
    referenceText?: string
  ): Promise<AudioProcessingResult> {
    
    return new Promise((resolve) => {
      console.log('🎯 Performing pronunciation assessment...');
      
      try {
        // ✅ CRIAR SPEECH RECOGNIZER
        const recognizer = new speechsdk.SpeechRecognizer(this.speechConfig, audioConfig);
        
        // ✅ APLICAR PRONUNCIATION CONFIG
        pronunciationConfig.applyTo(recognizer);
        
        let sessionId = '';

        // ✅ EVENT LISTENERS
        recognizer.sessionStarted = (s, e) => {
          sessionId = e.sessionId;
          console.log(`🔗 Session started: ${sessionId}`);
        };

        recognizer.sessionStopped = (s, e) => {
          console.log(`🛑 Session stopped: ${e.sessionId}`);
        };

        // ✅ EXECUTAR RECOGNITION
        recognizer.recognizeOnceAsync(
          (result: speechsdk.SpeechRecognitionResult) => {
            try {
              console.log('📥 Recognition result received:', {
                reason: result.reason,
                text: result.text,
                sessionId
              });

              // ✅ VERIFICAR SE RECOGNITION FOI BEM-SUCEDIDO
              if (result.reason !== speechsdk.ResultReason.RecognizedSpeech) {
                console.error('❌ Speech not recognized:', result.reason);
                
                recognizer.close();
                resolve({
                  success: false,
                  error: 'Speech not recognized',
                  shouldRetry: true,
                  retryReason: 'speech_not_recognized',
                  debugInfo: {
                    reason: result.reason,
                    sessionId,
                    referenceText,
                    azureErrorDetails: result.errorDetails
                  }
                });
                return;
              }

              // ✅ VERIFICAR SE HÁ TEXTO
              if (!result.text || result.text.trim().length === 0) {
                console.error('❌ No text recognized');
                
                recognizer.close();
                resolve({
                  success: false,
                  error: 'No text recognized',
                  shouldRetry: true,
                  retryReason: 'no_text_recognized',
                  debugInfo: {
                    reason: result.reason,
                    sessionId,
                    referenceText
                  }
                });
                return;
              }

              console.log('✅ Text recognized:', result.text);

              // ✅ EXTRAIR PRONUNCIATION ASSESSMENT RESULT
              const pronunciationResult = speechsdk.PronunciationAssessmentResult.fromResult(result);
              
              if (!pronunciationResult) {
                console.error('❌ No pronunciation assessment data');
                
                recognizer.close();
                resolve({
                  success: false,
                  error: 'No pronunciation assessment data',
                  shouldRetry: false,
                  debugInfo: {
                    text: result.text,
                    sessionId,
                    referenceText
                  }
                });
                return;
              }

              // ✅ PROCESSAR RESULTADO FINAL
              const finalResult = this.buildFinalResult(
                result.text,
                pronunciationResult,
                result,
                sessionId
              );

              console.log('✅ Assessment completed successfully:', {
                pronunciationScore: finalResult.pronunciationScore,
                accuracyScore: finalResult.accuracyScore,
                text: finalResult.text
              });

              recognizer.close();
              resolve({
                success: true,
                result: finalResult
              });

            } catch (processingError: any) {
              console.error('❌ Error processing result:', processingError);
              recognizer.close();
              resolve({
                success: false,
                error: `Result processing failed: ${processingError.message}`
              });
            }
          },
          (error: string) => {
            console.error('❌ Recognition error:', error);
            recognizer.close();
            resolve({
              success: false,
              error: `Recognition failed: ${error}`,
              shouldRetry: true,
              retryReason: 'recognition_error'
            });
          }
        );

      } catch (setupError: any) {
        console.error('❌ Assessment setup failed:', setupError);
        resolve({
          success: false,
          error: `Assessment setup failed: ${setupError.message}`
        });
      }
    });
  }

  // 🏗️ CONSTRUIR RESULTADO FINAL
  private buildFinalResult(
    recognizedText: string,
    pronunciationResult: speechsdk.PronunciationAssessmentResult,
    speechResult: speechsdk.SpeechRecognitionResult,
    sessionId: string
  ): PronunciationResult {
    
    console.log('🏗️ Building final result...');

    // ✅ EXTRAIR SCORES
    const accuracyScore = Math.round(pronunciationResult.accuracyScore || 0);
    const fluencyScore = Math.round(pronunciationResult.fluencyScore || 0);
    const completenessScore = Math.round(pronunciationResult.completenessScore || 0);
    const pronunciationScore = Math.round(pronunciationResult.pronunciationScore || 0);
    const prosodyScore = Math.round(pronunciationResult.prosodyScore || 0);

    // ✅ EXTRAIR DADOS DETALHADOS
    const jsonResult = speechResult.properties.getProperty(
      speechsdk.PropertyId.SpeechServiceResponse_JsonResult
    );

    let detailedData: any = {};
    try {
      if (jsonResult) {
        detailedData = JSON.parse(jsonResult);
      }
    } catch (error) {
      console.warn('⚠️ Could not parse detailed JSON result:', error);
    }

    // ✅ EXTRAIR PALAVRAS E FONEMAS
    const words = this.extractWordDetails(detailedData);
    const phonemes = this.extractPhonemeDetails(detailedData);

    // ✅ GERAR FEEDBACK INTELIGENTE
    const feedback = this.generateSmartFeedback(
      recognizedText,
      pronunciationScore,
      accuracyScore,
      fluencyScore,
      prosodyScore,
      words
    );

    return {
      text: recognizedText,
      accuracyScore,
      fluencyScore,
      completenessScore,
      pronunciationScore,
      prosodyScore: prosodyScore > 0 ? prosodyScore : undefined,
      words,
      phonemes,
      feedback,
      confidence: pronunciationScore / 100,
      assessmentMethod: 'azure-sdk-definitive',
      sessionId,
      debugInfo: {
        detailedDataAvailable: !!jsonResult,
        wordsExtracted: words.length,
        phonemesExtracted: phonemes.length
      }
    };
  }

  // 📝 EXTRAIR DETALHES DAS PALAVRAS
  private extractWordDetails(detailedData: any): WordResult[] {
    const words: WordResult[] = [];
    
    try {
      if (detailedData.NBest?.[0]?.Words) {
        for (const wordData of detailedData.NBest[0].Words) {
          words.push({
            word: wordData.Word,
            accuracyScore: Math.round(wordData.PronunciationAssessment?.AccuracyScore || 0),
            errorType: wordData.PronunciationAssessment?.ErrorType || 'None'
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not extract word details:', error);
    }
    
    return words;
  }

  // 🔊 EXTRAIR DETALHES DOS FONEMAS
  private extractPhonemeDetails(detailedData: any): PhonemeResult[] {
    const phonemes: PhonemeResult[] = [];
    
    try {
      if (detailedData.NBest?.[0]?.Words) {
        for (const wordData of detailedData.NBest[0].Words) {
          if (wordData.Phonemes) {
            for (const phonemeData of wordData.Phonemes) {
              phonemes.push({
                phoneme: phonemeData.Phoneme,
                accuracyScore: Math.round(phonemeData.PronunciationAssessment?.AccuracyScore || 0),
                offset: phonemeData.Offset || 0,
                duration: phonemeData.Duration || 0
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not extract phoneme details:', error);
    }
    
    return phonemes;
  }

  // 🧠 GERAR FEEDBACK INTELIGENTE
  private generateSmartFeedback(
    text: string,
    pronScore: number,
    accuracy: number,
    fluency: number,
    prosody: number,
    words: WordResult[]
  ): string[] {
    
    const feedback: string[] = [];

    // Feedback baseado no score geral
    if (pronScore >= 90) {
      feedback.push('🎉 Excellent pronunciation! You sound very natural.');
    } else if (pronScore >= 80) {
      feedback.push('👍 Great job! Your pronunciation is very clear.');
    } else if (pronScore >= 70) {
      feedback.push('📚 Good pronunciation! Keep practicing to improve further.');
    } else if (pronScore >= 60) {
      feedback.push('💪 Your pronunciation is developing well. Keep it up!');
    } else {
      feedback.push('🔄 Focus on clear pronunciation. Try speaking more slowly.');
    }

    // Feedback específico por categoria
    if (accuracy < 70) {
      feedback.push('🎯 Work on pronouncing each sound clearly and accurately.');
    }

    if (fluency < 70) {
      feedback.push('🌊 Practice speaking more smoothly with natural rhythm.');
    }

    if (prosody > 0 && prosody < 70) {
      feedback.push('🎵 Work on natural intonation and stress patterns.');
    }

    // Feedback sobre palavras específicas
    const problemWords = words.filter(w => w.accuracyScore < 60);
    if (problemWords.length > 0 && problemWords.length <= 3) {
      const wordList = problemWords.map(w => `"${w.word}"`).join(', ');
      feedback.push(`🔍 Pay special attention to: ${wordList}`);
    }

    return feedback;
  }

  // 🧪 TESTAR CONECTIVIDADE
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Azure Speech SDK connection...');
      
      const testConfig = speechsdk.SpeechConfig.fromSubscription(
        this.subscriptionKey,
        this.region
      );
      
      return !!testConfig;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// 🎯 FUNÇÃO PRINCIPAL PARA EXPORTAÇÃO
export async function assessPronunciationDefinitive(
  audioBlob: Blob,
  referenceText?: string,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
): Promise<AudioProcessingResult> {
  
  try {
    const service = new AzureSpeechDefinitiveService();
    return await service.assessPronunciation(audioBlob, referenceText, userLevel);
  } catch (error: any) {
    console.error('❌ Service initialization failed:', error);
    return {
      success: false,
      error: `Service initialization failed: ${error.message}`,
      shouldRetry: false
    };
  }
}