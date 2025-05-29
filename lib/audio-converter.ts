// 🎵 CONVERSOR DE ÁUDIO PARA AZURE SPEECH SDK
// Baseado na documentação oficial da Microsoft
// https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment

import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

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
   * Conforme documentação Microsoft:
   * - WAV PCM 16kHz, 16-bit, mono
   * - Ou outros formatos suportados pelo SDK
   */
  static async convertToAzureFormat(
    audioBuffer: Buffer,
    inputFormat: string = 'webm'
  ): Promise<AudioConversionResult> {
    
    console.log('🎵 Starting audio conversion...');
    console.log(`📋 Input: ${inputFormat}, Size: ${audioBuffer.length} bytes`);
    
    return new Promise((resolve) => {
      try {
        const inputStream = new Readable();
        inputStream.push(audioBuffer);
        inputStream.push(null);
        
        const outputChunks: Buffer[] = [];
        
        // ✅ CONFIGURAÇÃO CONFORME DOCUMENTAÇÃO MICROSOFT
        const command = ffmpeg(inputStream)
          .inputFormat(inputFormat === 'audio/webm;codecs=opus' ? 'webm' : inputFormat)
          .audioCodec('pcm_s16le')    // 16-bit PCM
          .audioFrequency(16000)      // 16kHz sample rate
          .audioChannels(1)           // Mono
          .format('wav')              // WAV container
          .on('start', (commandLine) => {
            console.log('🔄 FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log(`⏳ Progress: ${progress.percent?.toFixed(1)}%`);
          })
          .on('end', () => {
            console.log('✅ Audio conversion completed successfully');
            const outputBuffer = Buffer.concat(outputChunks);
            resolve({
              success: true,
              audioBuffer: outputBuffer,
              format: 'wav',
              sampleRate: 16000,
              channels: 1
            });
          })
          .on('error', (error) => {
            console.error('❌ FFmpeg conversion error:', error.message);
            resolve({
              success: false,
              error: `FFmpeg conversion failed: ${error.message}`
            });
          });
        
        // Capturar output
        const stream = command.pipe();
        stream.on('data', (chunk) => {
          outputChunks.push(chunk);
        });
        
      } catch (error) {
        console.error('❌ Audio conversion setup error:', error);
        resolve({
          success: false,
          error: `Conversion setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    });
  }
  
  /**
   * 🔍 DETECTA FORMATO DE ÁUDIO
   */
  static detectAudioFormat(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('m4a')) return 'm4a';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'webm'; // default
  }
  
  /**
   * 📊 ANALISA PROPRIEDADES DO ÁUDIO
   */
  static async analyzeAudio(audioBuffer: Buffer): Promise<{
    duration?: number;
    format?: string;
    sampleRate?: number;
    channels?: number;
  }> {
    return new Promise((resolve) => {
      try {
        // Para análise, vamos usar um approach mais simples
        // já que ffprobe precisa de um arquivo físico
        resolve({
          duration: undefined,
          format: 'unknown',
          sampleRate: undefined,
          channels: undefined
        });
        
      } catch (error) {
        console.error('❌ Audio analysis setup error:', error);
        resolve({});
      }
    });
  }
} 