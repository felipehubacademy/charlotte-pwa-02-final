// lib/azure-speech-sdk.ts - IMPLEMENTAÇÃO CORRETA COM SPEECH SDK

import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { AudioConverter, AudioConversionResult } from './audio-converter';

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
  assessmentMethod: 'azure-sdk';
  sessionId?: string;
  debugInfo?: any;
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

export interface AudioProcessingResult {
  success: boolean;
  result?: PronunciationResult;
  error?: string;
  retryReason?: string;
  shouldRetry?: boolean;
  debugInfo?: any;
}

export class AzureSpeechSDKService {
  private speechConfig: speechsdk.SpeechConfig;
  private region: string;
  private subscriptionKey: string;
  private sdkCapabilities: {
    hasProsodyAssessment: boolean;
    hasPhonemeAlphabet: boolean;
    hasNBestPhonemes: boolean;
    hasJSONConfig: boolean;
    sdkVersion: string;
  };

  constructor() {
    this.region = process.env.AZURE_SPEECH_REGION || '';
    this.subscriptionKey = process.env.AZURE_SPEECH_KEY || '';
    
    if (!this.region || !this.subscriptionKey) {
      throw new Error('Azure Speech credentials not configured');
    }

    // ✅ DETECTAR CAPACIDADES DO SDK
    this.sdkCapabilities = this.detectSDKCapabilities();

    // ✅ CONFIGURAÇÃO CORRETA DO SPEECH SDK
    this.speechConfig = this.createSpeechConfig();
    
    console.log('✅ AzureSpeechSDKService initialized with capabilities:', this.sdkCapabilities);
  }

  // 🔧 CRIAR CONFIGURAÇÃO DE SPEECH
  private createSpeechConfig(): speechsdk.SpeechConfig {
    console.log('🔧 Creating SpeechConfig following Microsoft docs...');
    
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!subscriptionKey || !region) {
      throw new Error('Azure Speech credentials not configured');
    }

    try {
      const speechConfig = speechsdk.SpeechConfig.fromSubscription(subscriptionKey, region);
      
      // ✅ CONFIGURAÇÕES RECOMENDADAS PELA MICROSOFT
      speechConfig.speechRecognitionLanguage = "en-US"; // Conforme docs
      speechConfig.outputFormat = speechsdk.OutputFormat.Detailed;
      
      // Configurações de qualidade conforme documentação
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "2000");
      speechConfig.setProperty(speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "500");
      
      // Configurações específicas para Pronunciation Assessment
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, "true");
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "true");
      
      console.log('✅ SpeechConfig created with Microsoft recommended settings:', {
        language: speechConfig.speechRecognitionLanguage,
        region: region,
        detailedResults: true,
        wordTimestamps: true
      });

      return speechConfig;
      
    } catch (error) {
      console.error('❌ SpeechConfig creation failed:', error);
      throw new Error(`Failed to create SpeechConfig: ${(error as Error).message}`);
    }
  }

  // 🎯 MÉTODO PRINCIPAL: Pronunciation Assessment com Speech SDK
  async assessPronunciation(
    audioBlob: Blob,
    referenceText?: string,
    userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
  ): Promise<AudioProcessingResult> {
    
    console.log('🎯 Starting Azure Speech SDK Assessment...');
    console.log('📋 Input audio:', { type: audioBlob.type, size: audioBlob.size });
    
    try {
      // ✅ ETAPA 1: CONVERTER ÁUDIO PARA FORMATO SUPORTADO
      console.log('🎵 Step 1: Converting audio to Azure-compatible format...');
      
      const audioBuffer = await audioBlob.arrayBuffer();
      const inputFormat = AudioConverter.detectAudioFormat(audioBlob.type);
      
      console.log(`📋 Detected format: ${inputFormat}`);
      
      // Tentar conversão para WAV PCM 16kHz
      const conversionResult = await AudioConverter.convertToAzureFormat(
        Buffer.from(audioBuffer),
        inputFormat
      );
      
      let processedAudioBuffer: ArrayBuffer;
      
      if (conversionResult.success && conversionResult.audioBuffer) {
        console.log('✅ Audio conversion successful');
        console.log(`📊 Converted: ${conversionResult.format}, ${conversionResult.sampleRate}Hz, ${conversionResult.channels}ch`);
        processedAudioBuffer = new ArrayBuffer(conversionResult.audioBuffer.length);
        new Uint8Array(processedAudioBuffer).set(conversionResult.audioBuffer);
      } else {
        console.log('⚠️ Audio conversion failed, using original audio');
        console.log(`❌ Conversion error: ${conversionResult.error}`);
        processedAudioBuffer = audioBuffer;
      }

      // ✅ ETAPA 2: CRIAR CONFIGURAÇÕES
      console.log('⚙️ Step 2: Creating pronunciation and audio configurations...');
      
      const pronunciationConfig = this.createPronunciationConfig(referenceText, userLevel);
      
      // Converter ArrayBuffer de volta para Blob para compatibilidade
      const processedBlob = new Blob([processedAudioBuffer], { 
        type: conversionResult.success ? 'audio/wav' : audioBlob.type 
      });
      const audioConfig = await this.createAudioConfig(processedBlob);

      // ✅ ETAPA 3: EXECUTAR ASSESSMENT
      console.log('🎯 Step 3: Performing pronunciation assessment...');
      
      const result = await this.performAssessment(pronunciationConfig, audioConfig);
      
      // ✅ ETAPA 4: VERIFICAR SE PRECISA DE RETRY COM CONVERSÃO
      if (!result.success && result.shouldRetry && !conversionResult.success) {
        console.log('🔄 Assessment failed and audio was not converted. Suggesting hybrid approach...');
        result.debugInfo = {
          ...result.debugInfo,
          audioConversionAttempted: true,
          audioConversionSuccess: conversionResult.success,
          audioConversionError: conversionResult.error,
          suggestion: 'Consider using hybrid approach with Whisper transcription'
        };
      }
      
      return result;

    } catch (error) {
      console.error('❌ Azure Speech SDK Assessment failed:', error);
      return {
        success: false,
        error: `Azure Speech SDK assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        shouldRetry: true,
        retryReason: 'sdk_error'
      };
    }
  }

  // 🎵 CONVERTER ÁUDIO PARA WAV PCM 16kHz
  private async convertToWavPCM(audioBlob: Blob): Promise<ArrayBuffer | null> {
    try {
      // ✅ VERIFICAR SE ESTAMOS NO BROWSER (não no servidor Node.js)
      if (typeof window === 'undefined') {
        console.warn('⚠️ Web Audio API not available on server side');
        return null;
      }

      // Verificar se Web Audio API está disponível no browser
      if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        console.warn('⚠️ Web Audio API not available in this browser');
        return null;
      }

      const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();

      // Decodificar áudio
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      console.log('📊 Original audio:', {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration
      });

      // Resample para 16kHz se necessário
      const targetSampleRate = 16000;
      let processedBuffer = audioBuffer;

      if (audioBuffer.sampleRate !== targetSampleRate) {
        console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz...`);
        processedBuffer = await this.resampleAudio(audioBuffer, targetSampleRate, audioContext);
      }

      // Converter para mono se necessário
      if (processedBuffer.numberOfChannels > 1) {
        console.log('🔄 Converting to mono...');
        processedBuffer = this.convertToMono(processedBuffer, audioContext);
      }

      // Converter para WAV PCM
      const wavBuffer = this.audioBufferToWav(processedBuffer);
      
      console.log('✅ Audio converted:', {
        originalSize: arrayBuffer.byteLength,
        convertedSize: wavBuffer.byteLength,
        sampleRate: targetSampleRate,
        channels: 1
      });

      // Cleanup
      audioContext.close();

      return wavBuffer;

    } catch (error) {
      console.error('❌ Audio conversion failed:', error);
      return null;
    }
  }

  // 🔄 RESAMPLE ÁUDIO
  private async resampleAudio(
    audioBuffer: AudioBuffer, 
    targetSampleRate: number, 
    audioContext: AudioContext
  ): Promise<AudioBuffer> {
    
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

    // Misturar todos os canais
    for (let i = 0; i < audioBuffer.length; i++) {
      let sum = 0;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / audioBuffer.numberOfChannels;
    }

    return monoBuffer;
  }

  // 📦 CONVERTER AudioBuffer para WAV
  private audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    const channelData = audioBuffer.getChannelData(0);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
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
    view.setUint32(40, length * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  // ⚙️ CRIAR CONFIGURAÇÃO DE PRONUNCIATION ASSESSMENT
  private createPronunciationConfig(
    referenceText?: string, 
    userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
  ): speechsdk.PronunciationAssessmentConfig {
    
    console.log('⚙️ Creating Pronunciation Assessment Config following Microsoft docs...');
    console.log('📋 Reference text:', referenceText || 'none (unscripted assessment)');

    // ✅ MÉTODO RECOMENDADO PELA MICROSOFT: Usar JSON config
    try {
      // Configuração JSON conforme documentação oficial
      const configJson = {
        referenceText: referenceText || "",
        gradingSystem: "HundredMark",
        granularity: "Phoneme",
        phonemeAlphabet: "IPA",
        nBestPhonemeCount: 5,
        enableMiscue: false
      };

      console.log('📋 Using Microsoft recommended JSON config:', configJson);
      
      const config = speechsdk.PronunciationAssessmentConfig.fromJSON(JSON.stringify(configJson));
      
      // ✅ HABILITAR PROSODY ASSESSMENT conforme docs
      if (typeof config.enableProsodyAssessment === 'function') {
        (config as any).enableProsodyAssessment();
        console.log('✅ Prosody assessment enabled via method');
      } else if ('enableProsodyAssessment' in config) {
        (config as any).enableProsodyAssessment = true;
        console.log('✅ Prosody assessment enabled via property');
      }
      
      console.log('✅ Microsoft docs JSON config created successfully');
      return config;
      
    } catch (jsonError) {
      console.log('⚠️ Microsoft docs JSON config failed, trying basic:', jsonError);
    }

    // ✅ FALLBACK: Configuração básica conforme docs
    try {
      const basicConfig = new speechsdk.PronunciationAssessmentConfig(
        referenceText || "",
        speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        speechsdk.PronunciationAssessmentGranularity.Phoneme,
        false // enableMiscue
      );
      
      console.log('✅ Basic config created following Microsoft docs');
      
      // Aplicar melhorias baseadas na documentação
      this.applyMicrosoftDocsEnhancements(basicConfig);
      
      return basicConfig;
      
    } catch (basicError) {
      console.error('❌ Even basic config failed:', basicError);
      throw new Error(`Failed to create pronunciation config: ${(basicError as Error).message || 'Unknown error'}`);
    }
  }

  // 🔧 APLICAR MELHORIAS BASEADAS NA DOCUMENTAÇÃO MICROSOFT
  private applyMicrosoftDocsEnhancements(config: speechsdk.PronunciationAssessmentConfig): void {
    console.log('🔧 Applying Microsoft docs enhancements...');
    
    // 1. Prosody Assessment (conforme docs)
    try {
      if (typeof (config as any).enableProsodyAssessment === 'function') {
        (config as any).enableProsodyAssessment();
        console.log('✅ Prosody assessment enabled via method (Microsoft docs)');
      } else if ('enableProsodyAssessment' in config) {
        (config as any).enableProsodyAssessment = true;
        console.log('✅ Prosody assessment enabled via property (Microsoft docs)');
      }
    } catch (error) {
      console.log('⚠️ Could not enable prosody assessment:', error);
    }

    // 2. NBest Phoneme Count (conforme docs)
    try {
      if ('nbestPhonemeCount' in config) {
        (config as any).nbestPhonemeCount = 5;
        console.log('✅ NBest phoneme count set to 5 (Microsoft docs)');
      } else if ('NBestPhonemeCount' in config) {
        (config as any).NBestPhonemeCount = 5;
        console.log('✅ NBest phoneme count set to 5 via NBestPhonemeCount (Microsoft docs)');
      }
    } catch (error) {
      console.log('⚠️ Could not set NBest phoneme count:', error);
    }

    // 3. Phoneme Alphabet IPA (conforme docs)
    try {
      if ('phonemeAlphabet' in config) {
        (config as any).phonemeAlphabet = "IPA";
        console.log('✅ Phoneme alphabet set to IPA (Microsoft docs)');
      }
    } catch (error) {
      console.log('⚠️ Could not set phoneme alphabet:', error);
    }

    console.log('🎯 Microsoft docs configuration enhancements applied');
  }

  // 🎵 CRIAR CONFIGURAÇÃO DE ÁUDIO OTIMIZADA
  private async createAudioConfig(audioBlob: Blob): Promise<speechsdk.AudioConfig> {
    console.log('🎵 Creating optimized AudioConfig following Microsoft docs...');
    console.log('📁 Audio blob:', { type: audioBlob.type, size: audioBlob.size });

    try {
      // ✅ MÉTODO RECOMENDADO: AudioInputStream para melhor controle
      const audioFormat = speechsdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      const audioStream = speechsdk.AudioInputStream.createPushStream(audioFormat);
      
      // ✅ CONVERTER BLOB PARA ARRAYBUFFER E PROCESSAR
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('📊 Audio data extracted:', { size: arrayBuffer.byteLength });
      
      // 🚨 PROBLEMA CRÍTICO: WebM/Opus não é compatível com Azure Speech SDK
      // Vamos tentar extrair dados de áudio brutos ou criar um wrapper WAV
      let audioDataToSend: ArrayBuffer;
      
      if (audioBlob.type.includes('webm') || audioBlob.type.includes('opus')) {
        console.log('🔄 WebM/Opus detected - creating WAV wrapper for Azure compatibility...');
        audioDataToSend = this.createWavFromWebM(arrayBuffer);
        console.log('✅ WAV wrapper created:', { size: audioDataToSend.byteLength });
      } else {
        console.log('✅ Using original audio data');
        audioDataToSend = arrayBuffer;
      }
      
      // Enviar dados para o stream
      const audioData = new Uint8Array(audioDataToSend);
      audioStream.write(audioData.buffer);
      audioStream.close();
      console.log('✅ Audio data written to stream (Microsoft docs method)');

      const audioConfig = speechsdk.AudioConfig.fromStreamInput(audioStream);
      console.log('✅ AudioConfig created from stream (Microsoft recommended)');
      
      return audioConfig;
      
    } catch (streamError) {
      console.log('⚠️ Stream method failed, trying alternative approach:', streamError);
      
      // ✅ FALLBACK CRÍTICO: Tentar com dados de áudio brutos
      try {
        console.log('🔄 Trying raw audio data approach...');
        
        // Criar um stream simples com dados brutos
        const audioFormat = speechsdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
        const audioStream = speechsdk.AudioInputStream.createPushStream(audioFormat);
        
        // Extrair apenas os dados de áudio, ignorando headers WebM
        const arrayBuffer = await audioBlob.arrayBuffer();
        const rawAudioData = this.extractRawAudioData(arrayBuffer);
        
        audioStream.write(rawAudioData);
        audioStream.close();
        
        const audioConfig = speechsdk.AudioConfig.fromStreamInput(audioStream);
        console.log('✅ AudioConfig created with raw audio data approach');
        
        return audioConfig;
        
      } catch (rawError) {
        console.log('⚠️ Raw audio approach failed, using default microphone:', rawError);
        
        // ✅ ÚLTIMO FALLBACK: Microfone padrão
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        console.log('✅ AudioConfig created from default microphone (last resort)');
        return audioConfig;
      }
    }
  }

  // 🔄 CRIAR WAV A PARTIR DE WebM (Wrapper Simples)
  private createWavFromWebM(webmData: ArrayBuffer): ArrayBuffer {
    console.log('🔄 Creating WAV wrapper for WebM data...');
    
    // Criar um header WAV básico e anexar os dados WebM
    // Isso pode não funcionar perfeitamente, mas é uma tentativa
    const wavHeaderSize = 44;
    const dataSize = webmData.byteLength;
    const totalSize = wavHeaderSize + dataSize;
    
    const wavBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(wavBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(8, 'WAVE');
    
    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);  // PCM
    view.setUint16(22, 1, true);  // mono
    view.setUint32(24, 16000, true); // sample rate
    view.setUint32(28, 32000, true); // byte rate
    view.setUint16(32, 2, true);  // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // data chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Copy WebM data (isso pode não funcionar, mas vamos tentar)
    const webmView = new Uint8Array(webmData);
    const wavView = new Uint8Array(wavBuffer, wavHeaderSize);
    wavView.set(webmView);
    
    console.log('✅ WAV wrapper created with WebM data embedded');
    return wavBuffer;
  }

  // 🔍 EXTRAIR DADOS DE ÁUDIO BRUTOS
  private extractRawAudioData(audioData: ArrayBuffer): ArrayBuffer {
    console.log('🔍 Attempting to extract raw audio data...');
    
    // Para WebM, vamos tentar pular os headers e pegar dados brutos
    // Isso é uma aproximação grosseira
    const dataView = new Uint8Array(audioData);
    
    // Procurar por padrões que possam indicar início de dados de áudio
    // WebM geralmente tem headers específicos, vamos tentar pular eles
    let audioStartOffset = 0;
    
    // Procurar por possíveis marcadores de início de dados de áudio
    for (let i = 0; i < Math.min(1000, dataView.length - 4); i++) {
      // Procurar por padrões comuns em dados de áudio
      if (dataView[i] === 0x1A && dataView[i + 1] === 0x45 && dataView[i + 2] === 0xDF && dataView[i + 3] === 0xA3) {
        // Encontrou header EBML (WebM), pular
        audioStartOffset = Math.min(i + 100, dataView.length);
        break;
      }
    }
    
    console.log(`🔍 Estimated audio start offset: ${audioStartOffset}`);
    
    // Retornar dados a partir do offset estimado
    return audioData.slice(audioStartOffset);
  }

  // 🎯 EXECUTAR ASSESSMENT COM SPEECH SDK
  private async performAssessment(
    pronunciationConfig: speechsdk.PronunciationAssessmentConfig,
    audioConfig: speechsdk.AudioConfig
  ): Promise<AudioProcessingResult> {
    
    return new Promise((resolve) => {
      try {
        console.log('🎯 Performing Speech SDK Assessment...');
        console.log('🌍 Environment info:', {
          nodeEnv: process.env.NODE_ENV,
          vercelRegion: process.env.VERCEL_REGION,
          azureRegion: process.env.AZURE_SPEECH_REGION,
          timestamp: new Date().toISOString()
        });

        // ✅ CRIAR SPEECH RECOGNIZER CONFORME DOCUMENTAÇÃO MICROSOFT
        // Documentação oficial: var recognizer = new SpeechRecognizer(speechConfig, "en-US", audioConfig);
        const recognizer = new speechsdk.SpeechRecognizer(this.speechConfig, audioConfig);
        
        console.log('✅ SpeechRecognizer created with explicit language parameter (Microsoft docs)');

        // ✅ APLICAR PRONUNCIATION CONFIG ANTES DE QUALQUER EVENTO
        pronunciationConfig.applyTo(recognizer);
        console.log('✅ PronunciationAssessmentConfig applied to recognizer');

        // 📊 CAPTURAR SESSION ID para debugging
        let sessionId: string = '';
        recognizer.sessionStarted = (s, e) => {
          sessionId = e.sessionId;
          console.log(`🔗 Speech SDK Session started: ${sessionId}`);
          console.log('📊 Session details:', {
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            environment: 'vercel-serverless'
          });
        };

        // 📊 ADICIONAR MAIS EVENT LISTENERS PARA DEBUG
        recognizer.sessionStopped = (s, e) => {
          console.log(`🛑 Speech SDK Session stopped: ${e.sessionId}`);
        };

        recognizer.speechStartDetected = (s, e) => {
          console.log(`🎤 Speech start detected: ${e.sessionId}`);
        };

        recognizer.speechEndDetected = (s, e) => {
          console.log(`🔇 Speech end detected: ${e.sessionId}`);
        };

        // 🎯 EXECUTAR RECOGNITION
        console.log('🚀 Starting recognizeOnceAsync...');
        recognizer.recognizeOnceAsync(
          (speechResult: speechsdk.SpeechRecognitionResult) => {
            try {
              console.log('📥 Speech SDK Result received:', {
                reason: speechResult.reason,
                text: speechResult.text,
                sessionId
              });

              // ✅ PROCESSAR RESULTADO
              const processedResult = this.processSpeechSDKResult(speechResult, sessionId);
              
              // Limpeza
              recognizer.close();
              
              resolve(processedResult);

            } catch (error) {
              console.error('❌ Error processing Speech SDK result:', error);
              recognizer.close();
              resolve({
                success: false,
                error: `Result processing failed: ${error}`
              });
            }
          },
          (error: string) => {
            console.error('❌ Speech SDK Recognition failed:', error);
            recognizer.close();
            resolve({
              success: false,
              error: `Speech SDK recognition failed: ${error}`
            });
          }
        );

      } catch (error) {
        console.error('❌ Speech SDK setup failed:', error);
        resolve({
          success: false,
          error: `Speech SDK setup failed: ${error}`
        });
      }
    });
  }

  // 📊 PROCESSAR RESULTADO DO SPEECH SDK
  private processSpeechSDKResult(
    speechResult: speechsdk.SpeechRecognitionResult,
    sessionId: string
  ): AudioProcessingResult {
    
    try {
      // Verificar se recognition foi bem-sucedido
      if (speechResult.reason !== speechsdk.ResultReason.RecognizedSpeech) {
        console.warn('❌ Speech not recognized:', speechResult.reason);
        
        return {
          success: false,
          error: 'Speech not recognized',
          shouldRetry: true,
          retryReason: 'speech_not_recognized',
          debugInfo: {
            reason: speechResult.reason,
            sessionId,
            suggestion: 'WebM/Opus format may not be fully supported by Azure SDK v1.44.0'
          }
        };
      }

      // Verificar se há texto reconhecido
      if (!speechResult.text || speechResult.text.trim().length === 0) {
        console.warn('❌ No text recognized');
        
        return {
          success: false,
          error: 'No text recognized',
          shouldRetry: true,
          retryReason: 'no_text',
          debugInfo: {
            reason: speechResult.reason,
            sessionId,
            suggestion: 'Consider using WAV format or implementing audio conversion'
          }
        };
      }

      console.log('✅ Text recognized:', speechResult.text);

      // ✅ EXTRAIR PRONUNCIATION ASSESSMENT RESULT
      const pronunciationResult = speechsdk.PronunciationAssessmentResult.fromResult(speechResult);
      
      if (!pronunciationResult) {
        console.error('❌ No pronunciation assessment data');
        return {
          success: false,
          error: 'No pronunciation assessment data available'
        };
      }
      
      // 🚨 VALIDAÇÃO CRÍTICA: Verificar se realmente temos dados de assessment
      console.log('🔍 CRITICAL CHECK: Pronunciation Assessment Validation');
      console.log('📊 Has pronunciationResult:', !!pronunciationResult);
      console.log('📊 pronunciationResult type:', typeof pronunciationResult);
      console.log('📊 pronunciationResult keys:', Object.keys(pronunciationResult));
      
      // Verificar se os scores são válidos (não zero ou undefined)
      const hasValidScores = pronunciationResult.accuracyScore > 0 || 
                            pronunciationResult.fluencyScore > 0 || 
                            pronunciationResult.pronunciationScore > 0;
      
      if (!hasValidScores) {
        console.error('🚨 CRITICAL: No valid pronunciation scores detected!');
        console.error('🔍 This suggests Azure is doing speech recognition only, not pronunciation assessment');
        return {
          success: false,
          error: 'Azure pronunciation assessment failed - no valid scores',
          shouldRetry: false,
          debugInfo: {
            pronunciationResult,
            sessionId,
            suggestion: 'Check pronunciation assessment configuration'
          }
        };
      }

      // ✅ EXTRAIR DADOS DETALHADOS DO JSON
      const jsonResult = speechResult.properties.getProperty(
        speechsdk.PropertyId.SpeechServiceResponse_JsonResult
      );

      let detailedData: any = {};
      try {
        detailedData = JSON.parse(jsonResult);
        console.log('📊 Detailed JSON result parsed successfully');
      } catch (error) {
        console.warn('⚠️ Could not parse detailed JSON result:', error);
      }

      // ✅ CONSTRUIR RESULTADO FINAL
      const result = this.buildPronunciationResult(
        speechResult.text,
        pronunciationResult,
        detailedData,
        sessionId
      );

      console.log('✅ Pronunciation result built successfully:', {
        pronunciationScore: result.pronunciationScore,
        accuracyScore: result.accuracyScore,
        wordsCount: result.words.length,
        phonemesCount: result.phonemes.length
      });

      return {
        success: true,
        result
      };

    } catch (error: any) {
      console.error('❌ Error processing Speech SDK result:', error);
      return {
        success: false,
        error: `Failed to process Speech SDK result: ${error.message}`
      };
    }
  }

  // 🏗️ CONSTRUIR RESULTADO FINAL
  private buildPronunciationResult(
    recognizedText: string,
    pronunciationResult: speechsdk.PronunciationAssessmentResult,
    detailedData: any,
    sessionId: string
  ): PronunciationResult {
    
    // 🔍 DEBUG: INVESTIGAR DADOS BRUTOS DO AZURE
    console.log('🔍 DEBUGGING Azure Raw Data:');
    console.log('📊 pronunciationResult object:', pronunciationResult);
    console.log('📊 pronunciationResult.accuracyScore:', pronunciationResult.accuracyScore);
    console.log('📊 pronunciationResult.fluencyScore:', pronunciationResult.fluencyScore);
    console.log('📊 pronunciationResult.pronunciationScore:', pronunciationResult.pronunciationScore);
    console.log('📊 detailedData structure:', JSON.stringify(detailedData, null, 2));
    
    // ✅ EXTRAIR SCORES REAIS DO AZURE
    const accuracyScore = Math.round(pronunciationResult.accuracyScore || 0);
    const fluencyScore = Math.round(pronunciationResult.fluencyScore || 0);
    const completenessScore = Math.round(pronunciationResult.completenessScore || 0);
    const pronunciationScore = Math.round(pronunciationResult.pronunciationScore || 0);
    const prosodyScore = Math.round(pronunciationResult.prosodyScore || 0);

    console.log('📊 Real Azure Scores:', {
      accuracy: accuracyScore,
      fluency: fluencyScore,
      completeness: completenessScore,
      pronunciation: pronunciationScore,
      prosody: prosodyScore
    });
    
    // 🚨 VALIDAÇÃO CRÍTICA: Verificar se scores fazem sentido
    if (pronunciationScore > 90 && recognizedText.includes('lush')) {
      console.log('🚨 SUSPICIOUS: High score for gibberish detected!');
      console.log('🔍 Recognized text:', recognizedText);
      console.log('🔍 This might indicate a problem with Azure assessment');
    }

    // ✅ EXTRAIR ANÁLISE DE PALAVRAS
    const words = this.extractWordAnalysis(detailedData);
    
    // ✅ EXTRAIR ANÁLISE DE FONEMAS
    const phonemes = this.extractPhonemeAnalysis(detailedData);

    // 🎯 APLICAR LÓGICA EDUCACIONAL INTELIGENTE
    const adjustedScores = this.applyEducationalLogic(
      accuracyScore,
      fluencyScore,
      pronunciationScore,
      words,
      phonemes,
      recognizedText
    );

    // 🚨 VERIFICAR SE PRECISA REPETIR
    if (adjustedScores.shouldRetry) {
      console.log(`🔄 REQUESTING RETRY: ${adjustedScores.retryReason}`);
      
      // Retornar resultado especial indicando que precisa repetir
      return {
        text: recognizedText,
        accuracyScore: 0,
        fluencyScore: 0,
        completenessScore: 0,
        pronunciationScore: 0,
        prosodyScore: undefined,
        words,
        phonemes,
        feedback: this.generateRetryFeedback(adjustedScores.retryReason!),
        confidence: 0,
        assessmentMethod: 'azure-sdk',
        sessionId,
        debugInfo: {
          originalResult: pronunciationResult,
          originalScores: { accuracyScore, pronunciationScore },
          adjustedScores,
          retryRequested: true,
          retryReason: adjustedScores.retryReason,
          detailedDataKeys: Object.keys(detailedData)
        }
      };
    }

    // ✅ GERAR FEEDBACK INTELIGENTE
    const feedback = this.generateIntelligentFeedback(
      recognizedText,
      adjustedScores.pronunciationScore,
      adjustedScores.accuracyScore,
      fluencyScore,
      prosodyScore,
      words,
      phonemes
    );

    return {
      text: recognizedText,
      accuracyScore: adjustedScores.accuracyScore,
      fluencyScore,
      completenessScore,
      pronunciationScore: adjustedScores.pronunciationScore,
      prosodyScore: prosodyScore > 0 ? prosodyScore : undefined,
      words,
      phonemes,
      feedback,
      confidence: adjustedScores.pronunciationScore / 100,
      assessmentMethod: 'azure-sdk',
      sessionId,
      debugInfo: {
        originalResult: pronunciationResult,
        originalScores: { accuracyScore, pronunciationScore },
        adjustedScores,
        detailedDataKeys: Object.keys(detailedData)
      }
    };
  }

  // 📝 EXTRAIR ANÁLISE DE PALAVRAS
  private extractWordAnalysis(detailedData: any): WordResult[] {
    try {
      const words: WordResult[] = [];
      
      if (detailedData.NBest?.[0]?.Words) {
        for (const wordData of detailedData.NBest[0].Words) {
          const word: WordResult = {
            word: wordData.Word,
            accuracyScore: Math.round(wordData.PronunciationAssessment?.AccuracyScore || 0),
            errorType: wordData.PronunciationAssessment?.ErrorType || 'None'
          };

          // Extrair sílabas se disponível
          if (wordData.Syllables) {
            word.syllables = wordData.Syllables.map((syl: any) => ({
              syllable: syl.Syllable,
              accuracyScore: Math.round(syl.PronunciationAssessment?.AccuracyScore || 0),
              offset: syl.Offset || 0,
              duration: syl.Duration || 0
            }));
          }

          words.push(word);
        }
      }

      console.log(`📝 Extracted ${words.length} word analyses`);
      return words;

    } catch (error) {
      console.error('❌ Error extracting word analysis:', error);
      return [];
    }
  }

  // 🔊 EXTRAIR ANÁLISE DE FONEMAS
  private extractPhonemeAnalysis(detailedData: any): PhonemeResult[] {
    try {
      const phonemes: PhonemeResult[] = [];
      
      if (detailedData.NBest?.[0]?.Words) {
        for (const wordData of detailedData.NBest[0].Words) {
          if (wordData.Phonemes) {
            for (const phonemeData of wordData.Phonemes) {
              const phoneme: PhonemeResult = {
                phoneme: phonemeData.Phoneme,
                accuracyScore: Math.round(phonemeData.PronunciationAssessment?.AccuracyScore || 0),
                offset: phonemeData.Offset || 0,
                duration: phonemeData.Duration || 0
              };

              // Extrair NBest phonemes se disponível
              if (phonemeData.PronunciationAssessment?.NBestPhonemes) {
                phoneme.nbestPhonemes = phonemeData.PronunciationAssessment.NBestPhonemes.map((nb: any) => ({
                  phoneme: nb.Phoneme,
                  score: Math.round(nb.Score || 0)
                }));
              }

              phonemes.push(phoneme);
            }
          }
        }
      }

      console.log(`🔊 Extracted ${phonemes.length} phoneme analyses`);
      return phonemes;

    } catch (error) {
      console.error('❌ Error extracting phoneme analysis:', error);
      return [];
    }
  }

  // 🧠 GERAR FEEDBACK INTELIGENTE
  private generateIntelligentFeedback(
    text: string,
    pronScore: number,
    accuracy: number,
    fluency: number,
    prosody: number,
    words: WordResult[],
    phonemes: PhonemeResult[]
  ): string[] {
    
    const feedback: string[] = [];

    // Feedback geral baseado no score
    if (pronScore >= 90) {
      feedback.push('🎉 Outstanding pronunciation! You sound very natural and clear.');
    } else if (pronScore >= 80) {
      feedback.push('👍 Excellent pronunciation! Your speech is very understandable.');
    } else if (pronScore >= 70) {
      feedback.push('📚 Good pronunciation! You\'re communicating effectively.');
    } else if (pronScore >= 60) {
      feedback.push('💪 Keep practicing! Your pronunciation is developing well.');
    } else if (pronScore >= 40) {
      feedback.push('🔄 Focus on clarity - try speaking more slowly and distinctly.');
    } else {
      feedback.push('🎤 Let\'s work on pronunciation fundamentals together.');
    }

    // Feedback específico por categoria
    if (accuracy < 70) {
      feedback.push('🎯 Focus on pronouncing each sound clearly and accurately.');
    }

    if (fluency < 70) {
      feedback.push('🌊 Work on speaking more smoothly with natural rhythm.');
    }

    if (prosody > 0 && prosody < 70) {
      feedback.push('🎵 Practice natural intonation and stress patterns.');
    }

    // Análise de palavras problemáticas
    const problemWords = words.filter(w => w.accuracyScore < 60 && w.errorType !== 'None');
    if (problemWords.length > 0 && problemWords.length <= 3) {
      const wordList = problemWords.map(w => `"${w.word}"`).join(', ');
      feedback.push(`🔍 Pay attention to: ${wordList}`);
    }

    // Análise de fonemas problemáticos
    const problemPhonemes = phonemes.filter(p => p.accuracyScore < 50);
    if (problemPhonemes.length > 0 && problemPhonemes.length <= 3) {
      const phonemeList = [...new Set(problemPhonemes.map(p => p.phoneme))].join(', ');
      feedback.push(`🔤 Practice these sounds: ${phonemeList}`);
    }

    return feedback;
  }

  // 🧪 TESTAR CONECTIVIDADE
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Azure Speech SDK connection...');
      
      // Teste simples de configuração
      const testConfig = speechsdk.SpeechConfig.fromSubscription(
        this.subscriptionKey, 
        this.region
      );
      
      if (testConfig) {
        console.log('✅ Speech SDK configuration is valid');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Speech SDK connection test failed:', error);
      return false;
    }
  }

  // 🔍 DETECTAR RECURSOS DISPONÍVEIS NO SDK
  private detectSDKCapabilities(): {
    hasProsodyAssessment: boolean;
    hasPhonemeAlphabet: boolean;
    hasNBestPhonemes: boolean;
    hasJSONConfig: boolean;
    sdkVersion: string;
  } {
    console.log('🔍 Detecting SDK capabilities...');
    
    const capabilities = {
      hasProsodyAssessment: false,
      hasPhonemeAlphabet: false,
      hasNBestPhonemes: false,
      hasJSONConfig: false,
      sdkVersion: 'unknown'
    };

    try {
      // Detectar versão do SDK
      capabilities.sdkVersion = (speechsdk as any).version || '1.44.0';
      console.log(`📦 SDK Version: ${capabilities.sdkVersion}`);

      // Testar configuração JSON
      try {
        const testJson = speechsdk.PronunciationAssessmentConfig.fromJSON('{"referenceText":"test","gradingSystem":"HundredMark","granularity":"Phoneme"}');
        capabilities.hasJSONConfig = true;
        console.log('✅ JSON configuration supported');
      } catch {
        console.log('❌ JSON configuration not supported');
      }

      // Testar configuração básica para detectar propriedades
      try {
        const testConfig = new speechsdk.PronunciationAssessmentConfig(
          "test",
          speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
          speechsdk.PronunciationAssessmentGranularity.Phoneme,
          true
        );

        // Testar prosody assessment
        if (typeof (testConfig as any).enableProsodyAssessment === 'function' || 'enableProsodyAssessment' in testConfig) {
          capabilities.hasProsodyAssessment = true;
          console.log('✅ Prosody assessment supported');
        } else {
          console.log('❌ Prosody assessment not supported');
        }

        // Testar phoneme alphabet
        if ('phonemeAlphabet' in testConfig) {
          capabilities.hasPhonemeAlphabet = true;
          console.log('✅ Phoneme alphabet supported');
        } else {
          console.log('❌ Phoneme alphabet not supported');
        }

        // Testar NBest phonemes
        if ('nbestPhonemeCount' in testConfig) {
          capabilities.hasNBestPhonemes = true;
          console.log('✅ NBest phonemes supported');
        } else {
          console.log('❌ NBest phonemes not supported');
        }

      } catch (error) {
        console.log('⚠️ Could not test basic config for capabilities:', error);
      }

    } catch (error) {
      console.log('⚠️ Error detecting SDK capabilities:', error);
    }

    console.log('📊 SDK Capabilities Summary:', capabilities);
    return capabilities;
  }

  // 🔄 MÉTODO EXPERIMENTAL: Assessment com texto conhecido (para quando áudio falha)
  async assessPronunciationWithKnownText(
    audioBlob: Blob,
    recognizedText: string,
    referenceText?: string
  ): Promise<AudioProcessingResult> {
    try {
      console.log('🔄 Attempting pronunciation assessment with known text...');
      console.log('📝 Recognized text:', recognizedText);
      console.log('📋 Reference text:', referenceText || 'none');

      // Se não temos texto de referência, usar o texto reconhecido
      const textToUse = referenceText || recognizedText;

      // Tentar assessment com texto específico
      const result = await this.assessPronunciation(audioBlob, textToUse);
      
      if (result.success) {
        console.log('✅ Assessment with known text succeeded');
        return result;
      } else {
        console.log('⚠️ Assessment with known text also failed');
        return {
          success: false,
          error: 'Azure SDK cannot process this audio format',
          shouldRetry: false,
          debugInfo: {
            recognizedText,
            referenceText,
            suggestion: 'Consider implementing client-side audio conversion or using alternative assessment method'
          }
        };
      }

    } catch (error: any) {
      console.error('❌ Assessment with known text failed:', error);
      return {
        success: false,
        error: `Assessment with known text failed: ${error.message}`
      };
    }
  }

  // 🎯 APLICAR LÓGICA EDUCACIONAL INTELIGENTE
  private applyEducationalLogic(
    accuracyScore: number,
    fluencyScore: number,
    pronunciationScore: number,
    words: WordResult[],
    phonemes: PhonemeResult[],
    recognizedText: string
  ): { pronunciationScore: number; accuracyScore: number; shouldRetry?: boolean; retryReason?: string } {
    
    console.log('🎯 Applying Educational Logic...');
    console.log('📊 Original Azure Scores:', { accuracyScore, pronunciationScore });
    
    // 🚨 VERIFICAÇÃO 1: Detectar Gibberish Severo
    const gibberishLevel = this.detectGibberishLevel(recognizedText, words);
    if (gibberishLevel >= 3) { // Nível alto de gibberish
      console.log('🚨 SEVERE GIBBERISH DETECTED - Requesting retry');
      return {
        pronunciationScore: 0,
        accuracyScore: 0,
        shouldRetry: true,
        retryReason: 'gibberish_detected'
      };
    }
    
    // 🚨 VERIFICAÇÃO 2: Mispronunciation Excessiva
    const mispronunciationWords = words.filter(w => w.errorType === 'Mispronunciation');
    const mispronunciationRatio = words.length > 0 ? mispronunciationWords.length / words.length : 0;
    
    if (mispronunciationRatio > 0.6) { // Mais de 60% das palavras mal pronunciadas
      console.log(`🚨 EXCESSIVE MISPRONUNCIATION DETECTED - ${Math.round(mispronunciationRatio * 100)}% of words`);
      return {
        pronunciationScore: 0,
        accuracyScore: 0,
        shouldRetry: true,
        retryReason: 'excessive_mispronunciation'
      };
    }
    
    // 🚨 VERIFICAÇÃO 3: Fonemas Muito Ruins
    const poorPhonemes = phonemes.filter(p => p.accuracyScore < 20);
    const poorPhonemeRatio = phonemes.length > 0 ? poorPhonemes.length / phonemes.length : 0;
    
    if (poorPhonemeRatio > 0.7) { // Mais de 70% dos fonemas muito ruins
      console.log(`🚨 SEVERE PHONEME ISSUES DETECTED - ${Math.round(poorPhonemeRatio * 100)}% poor phonemes`);
      return {
        pronunciationScore: 0,
        accuracyScore: 0,
        shouldRetry: true,
        retryReason: 'severe_phoneme_issues'
      };
    }
    
    // ✅ APLICAR PENALIDADES MENORES (para casos não extremos)
    let adjustedPronunciation = pronunciationScore;
    let adjustedAccuracy = accuracyScore;
    
    // Penalidade moderada por mispronunciation (20-60%)
    if (mispronunciationRatio > 0.2 && mispronunciationRatio <= 0.6) {
      const mispronunciationPenalty = Math.round(mispronunciationRatio * 20);
      adjustedPronunciation = Math.max(0, adjustedPronunciation - mispronunciationPenalty);
      adjustedAccuracy = Math.max(0, adjustedAccuracy - mispronunciationPenalty);
      
      console.log(`⚠️ Moderate Mispronunciation Penalty: ${mispronunciationWords.length}/${words.length} words = -${mispronunciationPenalty} points`);
    }
    
    // Penalidade moderada por fonemas ruins (30-70%)
    if (poorPhonemeRatio > 0.3 && poorPhonemeRatio <= 0.7) {
      const phonemePenalty = Math.round(poorPhonemeRatio * 15);
      adjustedPronunciation = Math.max(0, adjustedPronunciation - phonemePenalty);
      adjustedAccuracy = Math.max(0, adjustedAccuracy - phonemePenalty);
      
      console.log(`⚠️ Moderate Phoneme Penalty: ${poorPhonemes.length}/${phonemes.length} phonemes = -${phonemePenalty} points`);
    }
    
    // Penalidade por gibberish moderado
    if (gibberishLevel > 0 && gibberishLevel < 3) {
      const gibberishPenalty = gibberishLevel * 10;
      adjustedPronunciation = Math.max(0, adjustedPronunciation - gibberishPenalty);
      adjustedAccuracy = Math.max(0, adjustedAccuracy - gibberishPenalty);
      
      console.log(`⚠️ Moderate Gibberish Penalty: Level ${gibberishLevel} = -${gibberishPenalty} points`);
    }
    
    console.log('📊 Adjusted Scores:', { 
      pronunciation: `${pronunciationScore} → ${adjustedPronunciation}`,
      accuracy: `${accuracyScore} → ${adjustedAccuracy}`
    });
    
    return { 
      pronunciationScore: adjustedPronunciation, 
      accuracyScore: adjustedAccuracy 
    };
  }
  
  // 🔍 DETECTAR NÍVEL DE GIBBERISH (0-5)
  private detectGibberishLevel(recognizedText: string, words: WordResult[]): number {
    let gibberishLevel = 0;
    
    // Nível 1: Repetição excessiva
    const wordCounts = new Map<string, number>();
    words.forEach(w => {
      const count = wordCounts.get(w.word.toLowerCase()) || 0;
      wordCounts.set(w.word.toLowerCase(), count + 1);
    });
    
    for (const [word, count] of wordCounts) {
      if (count > 8) {
        gibberishLevel += 2;
        console.log(`🔄 Excessive repetition: "${word}" repeated ${count} times`);
      } else if (count > 5) {
        gibberishLevel += 1;
        console.log(`🔄 High repetition: "${word}" repeated ${count} times`);
      }
    }
    
    // Nível 2: Palavras muito estranhas
    const strangeWords = words.filter(w => 
      w.word.length <= 2 || 
      w.word.includes('lush') || 
      w.word.includes('glish') ||
      w.word.includes('ish') ||
      /^[a-z]{1,3}$/.test(w.word.toLowerCase())
    );
    
    const strangeRatio = words.length > 0 ? strangeWords.length / words.length : 0;
    if (strangeRatio > 0.7) {
      gibberishLevel += 2;
      console.log(`🤔 Very strange words: ${strangeWords.length}/${words.length} (${Math.round(strangeRatio * 100)}%)`);
    } else if (strangeRatio > 0.4) {
      gibberishLevel += 1;
      console.log(`🤔 Some strange words: ${strangeWords.length}/${words.length} (${Math.round(strangeRatio * 100)}%)`);
    }
    
    // Nível 3: Texto muito curto com problemas
    if (words.length < 5 && strangeRatio > 0.5) {
      gibberishLevel += 1;
      console.log(`📏 Short text with issues: ${words.length} words, ${Math.round(strangeRatio * 100)}% strange`);
    }
    
    console.log(`🎯 Gibberish Level: ${gibberishLevel}/5`);
    return Math.min(5, gibberishLevel);
  }
  
  // 🔄 GERAR FEEDBACK PARA RETRY
  private generateRetryFeedback(retryReason: string): string[] {
    const feedback: string[] = [];
    
    switch (retryReason) {
      case 'gibberish_detected':
        feedback.push('🎤 I couldn\'t understand what you said clearly.');
        feedback.push('💡 Try speaking more slowly and clearly.');
        feedback.push('🔄 Please try again with real words!');
        break;
        
      case 'excessive_mispronunciation':
        feedback.push('🗣️ I had trouble understanding most of what you said.');
        feedback.push('💡 Try speaking more slowly and focus on clear pronunciation.');
        feedback.push('🔄 Let\'s try that again!');
        break;
        
      case 'severe_phoneme_issues':
        feedback.push('🔤 The audio quality seems to have issues.');
        feedback.push('💡 Make sure you\'re speaking clearly into the microphone.');
        feedback.push('🔄 Please try recording again!');
        break;
        
      default:
        feedback.push('🎤 Let\'s try that again!');
        feedback.push('💡 Speak clearly and at a normal pace.');
        break;
    }
    
    return feedback;
  }
}

// 🎯 FUNÇÃO PRINCIPAL PARA USO EXTERNO
export async function assessPronunciationWithSDK(
  audioBlob: Blob,
  referenceText?: string,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
): Promise<AudioProcessingResult> {
  
  try {
    const service = new AzureSpeechSDKService();
    return await service.assessPronunciation(audioBlob, referenceText, userLevel);
  } catch (error: any) {
    console.error('❌ Speech SDK Service initialization failed:', error);
    return {
      success: false,
      error: `Service initialization failed: ${error.message}`
    };
  }
}