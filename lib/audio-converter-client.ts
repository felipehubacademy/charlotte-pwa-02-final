// lib/audio-converter-client.ts - Conversão de áudio no cliente

export interface ClientAudioConversionResult {
  success: boolean;
  audioBlob?: Blob;
  format?: string;
  sampleRate?: number;
  channels?: number;
  error?: string;
}

export class ClientAudioConverter {
  
  // 🎵 CONVERTER WEBM PARA WAV PCM 16kHz MONO
  static async convertWebMToWAV(webmBlob: Blob): Promise<ClientAudioConversionResult> {
    try {
      console.log('🎵 Converting WebM to WAV using Web Audio API...');
      console.log('📁 Input WebM blob:', { size: webmBlob.size, type: webmBlob.type });
      
      // Verificar se Web Audio API está disponível
      if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        throw new Error('Web Audio API not available in this browser');
      }
      
      const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Converter blob para ArrayBuffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      console.log('📊 ArrayBuffer size:', arrayBuffer.byteLength);
      
      // Decodificar áudio
      console.log('🔄 Decoding audio data...');
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('📊 Original audio properties:', {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration,
        length: audioBuffer.length
      });
      
      // Converter para 16kHz mono
      const targetSampleRate = 16000;
      const processedBuffer = await this.processAudioBuffer(audioBuffer, targetSampleRate, audioContext);
      
      // Converter para WAV
      const wavArrayBuffer = this.audioBufferToWav(processedBuffer);
      const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
      
      console.log('✅ WAV conversion completed:', {
        originalSize: webmBlob.size,
        wavSize: wavBlob.size,
        sampleRate: targetSampleRate,
        channels: 1
      });
      
      // Cleanup
      audioContext.close();
      
      return {
        success: true,
        audioBlob: wavBlob,
        format: 'wav',
        sampleRate: targetSampleRate,
        channels: 1
      };
      
    } catch (error: any) {
      console.error('❌ WebM to WAV conversion failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown conversion error'
      };
    }
  }
  
  // 🔄 PROCESSAR AUDIO BUFFER (resample + mono)
  private static async processAudioBuffer(
    audioBuffer: AudioBuffer, 
    targetSampleRate: number, 
    audioContext: AudioContext
  ): Promise<AudioBuffer> {
    
    let processedBuffer = audioBuffer;
    
    // Resample se necessário
    if (audioBuffer.sampleRate !== targetSampleRate) {
      console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz...`);
      processedBuffer = await this.resampleAudio(audioBuffer, targetSampleRate, audioContext);
    }
    
    // Converter para mono se necessário
    if (processedBuffer.numberOfChannels > 1) {
      console.log('🔄 Converting to mono...');
      processedBuffer = this.convertToMono(processedBuffer, audioContext);
    }
    
    return processedBuffer;
  }
  
  // 🔄 RESAMPLE ÁUDIO
  private static async resampleAudio(
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
  private static convertToMono(audioBuffer: AudioBuffer, audioContext: AudioContext): AudioBuffer {
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
  private static audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
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
  
  // 🎯 MÉTODO PRINCIPAL: AUTO-DETECTAR E CONVERTER
  static async convertToAzureFormat(audioBlob: Blob): Promise<ClientAudioConversionResult> {
    console.log(`🎯 Converting ${audioBlob.type} to Azure-compatible WAV format...`);
    
    // Verificar se é WebM/Opus
    if (audioBlob.type.includes('webm') || audioBlob.type.includes('opus')) {
      return await this.convertWebMToWAV(audioBlob);
    } 
    
    // Se já é WAV, verificar se precisa de processamento
    if (audioBlob.type.includes('wav')) {
      return await this.ensureWAVFormat(audioBlob);
    }
    
    // Para outros formatos, tentar conversão genérica
    return await this.convertGenericToWAV(audioBlob);
  }
  
  // 🔧 GARANTIR FORMATO WAV CORRETO
  private static async ensureWAVFormat(wavBlob: Blob): Promise<ClientAudioConversionResult> {
    try {
      console.log('🔧 Ensuring WAV format is correct...');
      
      // Para simplicidade, vamos reconverter para garantir 16kHz mono
      return await this.convertWebMToWAV(wavBlob);
      
    } catch (error: any) {
      return {
        success: false,
        error: `WAV format processing failed: ${error.message}`
      };
    }
  }
  
  // 🔄 CONVERSÃO GENÉRICA
  private static async convertGenericToWAV(audioBlob: Blob): Promise<ClientAudioConversionResult> {
    try {
      console.log(`🔄 Attempting generic conversion for ${audioBlob.type}...`);
      
      // Tentar usar o mesmo método do WebM
      return await this.convertWebMToWAV(audioBlob);
      
    } catch (error: any) {
      return {
        success: false,
        error: `Generic conversion failed: ${error.message}`
      };
    }
  }
  
  // 🔍 VERIFICAR SE WEB AUDIO API ESTÁ DISPONÍVEL
  static isWebAudioAPIAvailable(): boolean {
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  }
  
  // 📊 OBTER INFORMAÇÕES DO ÁUDIO
  static async getAudioInfo(audioBlob: Blob): Promise<{
    duration: number;
    sampleRate: number;
    channels: number;
    size: number;
  } | null> {
    try {
      if (!this.isWebAudioAPIAvailable()) {
        return null;
      }
      
      const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const info = {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        size: audioBlob.size
      };
      
      audioContext.close();
      return info;
      
    } catch (error) {
      console.error('❌ Could not get audio info:', error);
      return null;
    }
  }
} 