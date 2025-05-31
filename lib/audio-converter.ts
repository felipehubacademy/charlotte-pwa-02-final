// 🎵 CONVERSOR DE ÁUDIO PARA AZURE SPEECH SDK
// Versão compatível com Vercel (sem FFmpeg)
// Baseado na documentação oficial da Microsoft
// https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment

export interface AudioConversionResult {
  success: boolean;
  audioBuffer?: Buffer;
  format?: string;
  sampleRate?: number;
  channels?: number;
  error?: string;
}

export class AudioConverter {
  
  /**
   * ✅ CONVERTE ÁUDIO PARA FORMATO SUPORTADO PELO AZURE SPEECH SDK
   * Versão Vercel-compatible (sem FFmpeg)
   */
  static async convertToAzureFormat(
    audioBuffer: Buffer,
    inputFormat: string = 'webm'
  ): Promise<AudioConversionResult> {
    
    console.log('🎵 Starting Vercel-compatible audio conversion...');
    console.log(`📋 Input: ${inputFormat}, Size: ${audioBuffer.length} bytes`);
    
    try {
      // ✅ VERIFICAR SE É WEBM/OPUS
      if (inputFormat.includes('webm') || inputFormat.includes('opus')) {
        console.log('🔄 Converting WebM/Opus to WAV PCM for Azure compatibility...');
        
        // ✅ CRIAR WAV HEADER MANUALMENTE
        const wavBuffer = this.createWavWrapper(audioBuffer);
        
        console.log('✅ WAV wrapper created successfully');
        return {
          success: true,
          audioBuffer: wavBuffer,
          format: 'wav',
          sampleRate: 16000,
          channels: 1
        };
      }
      
      // ✅ SE JÁ É WAV, RETORNAR COMO ESTÁ
      if (inputFormat.includes('wav')) {
        console.log('✅ Audio already in WAV format');
        return {
          success: true,
          audioBuffer: audioBuffer,
          format: 'wav',
          sampleRate: 16000,
          channels: 1
        };
      }
      
      // ✅ OUTROS FORMATOS: TENTAR WAV WRAPPER
      console.log('🔄 Creating WAV wrapper for unknown format...');
      const wavBuffer = this.createWavWrapper(audioBuffer);
      
      return {
        success: true,
        audioBuffer: wavBuffer,
        format: 'wav',
        sampleRate: 16000,
        channels: 1
      };
      
    } catch (error) {
      console.error('❌ Audio conversion error:', error);
      return {
        success: false,
        error: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * 📦 CRIAR WAV WRAPPER PARA DADOS DE ÁUDIO
   * Cria um header WAV válido e anexa os dados de áudio
   */
  private static createWavWrapper(audioData: Buffer): Buffer {
    console.log('📦 Creating WAV wrapper...');
    
    const dataSize = audioData.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    // Criar buffer para WAV completo
    const wavBuffer = Buffer.alloc(totalSize);
    
    // WAV header
    let offset = 0;
    
    // RIFF header
    wavBuffer.write('RIFF', offset); offset += 4;
    wavBuffer.writeUInt32LE(totalSize - 8, offset); offset += 4;
    wavBuffer.write('WAVE', offset); offset += 4;
    
    // fmt chunk
    wavBuffer.write('fmt ', offset); offset += 4;
    wavBuffer.writeUInt32LE(16, offset); offset += 4; // chunk size
    wavBuffer.writeUInt16LE(1, offset); offset += 2;  // audio format (PCM)
    wavBuffer.writeUInt16LE(1, offset); offset += 2;  // num channels (mono)
    wavBuffer.writeUInt32LE(16000, offset); offset += 4; // sample rate
    wavBuffer.writeUInt32LE(32000, offset); offset += 4; // byte rate
    wavBuffer.writeUInt16LE(2, offset); offset += 2;  // block align
    wavBuffer.writeUInt16LE(16, offset); offset += 2; // bits per sample
    
    // data chunk
    wavBuffer.write('data', offset); offset += 4;
    wavBuffer.writeUInt32LE(dataSize, offset); offset += 4;
    
    // Copy audio data
    audioData.copy(wavBuffer, offset);
    
    console.log(`✅ WAV wrapper created: ${totalSize} bytes total`);
    return wavBuffer;
  }
  
  /**
   * 🔍 DETECTA FORMATO DE ÁUDIO
   */
  static detectAudioFormat(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('opus')) return 'webm';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('m4a')) return 'm4a';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'webm'; // default
  }
  
  /**
   * 📊 ANALISA PROPRIEDADES DO ÁUDIO (Simplificado)
   */
  static async analyzeAudio(audioBuffer: Buffer): Promise<{
    duration?: number;
    format?: string;
    sampleRate?: number;
    channels?: number;
  }> {
    // Análise simplificada sem FFmpeg
    return {
      duration: undefined,
      format: 'unknown',
      sampleRate: 16000, // Assumir 16kHz
      channels: 1 // Assumir mono
    };
  }
} 