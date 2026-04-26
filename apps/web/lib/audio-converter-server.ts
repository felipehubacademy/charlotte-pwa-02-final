// lib/audio-converter-server.ts - Conversão de áudio no servidor

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface AudioConversionResult {
  success: boolean;
  audioBuffer?: Buffer;
  format?: string;
  sampleRate?: number;
  channels?: number;
  error?: string;
}

export class ServerAudioConverter {
  
  // 🎵 CONVERTER WEBM PARA WAV PCM 16kHz MONO
  static async convertWebMToWAV(inputBuffer: Buffer): Promise<AudioConversionResult> {
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${Date.now()}.webm`);
    const outputFile = join(tempDir, `output_${Date.now()}.wav`);
    
    try {
      console.log('🎵 Converting WebM to WAV using FFmpeg...');
      
      // Escrever arquivo de entrada
      writeFileSync(inputFile, inputBuffer);
      console.log(`📁 Input file written: ${inputFile} (${inputBuffer.length} bytes)`);
      
      // Executar FFmpeg para conversão
      const ffmpegResult = await this.runFFmpeg(inputFile, outputFile);
      
      if (!ffmpegResult.success) {
        throw new Error(`FFmpeg conversion failed: ${ffmpegResult.error}`);
      }
      
      // Ler arquivo de saída
      if (!existsSync(outputFile)) {
        throw new Error('Output WAV file was not created');
      }
      
      const outputBuffer = readFileSync(outputFile);
      console.log(`✅ WAV file created: ${outputFile} (${outputBuffer.length} bytes)`);
      
      // Cleanup
      this.cleanup([inputFile, outputFile]);
      
      return {
        success: true,
        audioBuffer: outputBuffer,
        format: 'wav',
        sampleRate: 16000,
        channels: 1
      };
      
    } catch (error: any) {
      console.error('❌ WebM to WAV conversion failed:', error);
      
      // Cleanup em caso de erro
      this.cleanup([inputFile, outputFile]);
      
      return {
        success: false,
        error: error.message || 'Unknown conversion error'
      };
    }
  }
  
  // 🔧 EXECUTAR FFMPEG
  private static async runFFmpeg(inputFile: string, outputFile: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      console.log('🔧 Running FFmpeg conversion...');
      
      // Comando FFmpeg para converter para WAV PCM 16kHz mono
      const ffmpegArgs = [
        '-i', inputFile,           // Input file
        '-acodec', 'pcm_s16le',    // PCM 16-bit little endian
        '-ar', '16000',            // Sample rate 16kHz
        '-ac', '1',                // Mono (1 channel)
        '-f', 'wav',               // WAV format
        '-y',                      // Overwrite output file
        outputFile                 // Output file
      ];
      
      console.log('📋 FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
      
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('✅ FFmpeg conversion completed successfully');
          resolve({ success: true });
        } else {
          console.error('❌ FFmpeg conversion failed with code:', code);
          console.error('❌ FFmpeg stderr:', stderr);
          resolve({ 
            success: false, 
            error: `FFmpeg exited with code ${code}: ${stderr}` 
          });
        }
      });
      
      ffmpeg.on('error', (error) => {
        console.error('❌ FFmpeg spawn error:', error);
        resolve({ 
          success: false, 
          error: `FFmpeg spawn failed: ${error.message}` 
        });
      });
    });
  }
  
  // 🧹 CLEANUP ARQUIVOS TEMPORÁRIOS
  private static cleanup(files: string[]): void {
    files.forEach(file => {
      try {
        if (existsSync(file)) {
          unlinkSync(file);
          console.log(`🧹 Cleaned up: ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not cleanup ${file}:`, error);
      }
    });
  }
  
  // 🔍 VERIFICAR SE FFMPEG ESTÁ DISPONÍVEL
  static async checkFFmpegAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      
      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });
      
      ffmpeg.on('error', () => {
        resolve(false);
      });
    });
  }
  
  // 🔍 DETECTAR FORMATO DE ÁUDIO
  static detectAudioFormat(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('opus')) return 'opus';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('m4a')) return 'm4a';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'unknown';
  }
  
  // 🎯 MÉTODO PRINCIPAL: AUTO-DETECTAR E CONVERTER
  static async convertToAzureFormat(inputBuffer: Buffer, inputType: string): Promise<AudioConversionResult> {
    console.log(`🎯 Converting ${inputType} to Azure-compatible WAV format...`);
    
    // Verificar se FFmpeg está disponível
    const ffmpegAvailable = await this.checkFFmpegAvailability();
    if (!ffmpegAvailable) {
      console.error('❌ FFmpeg not available on this system');
      return {
        success: false,
        error: 'FFmpeg not available - cannot convert audio format'
      };
    }
    
    console.log('✅ FFmpeg is available');
    
    // Converter baseado no tipo de entrada
    if (inputType.includes('webm') || inputType.includes('opus')) {
      return await this.convertWebMToWAV(inputBuffer);
    } else if (inputType.includes('wav')) {
      // Se já é WAV, verificar se precisa de resampling
      return await this.ensureWAVFormat(inputBuffer);
    } else {
      // Para outros formatos, tentar conversão genérica
      return await this.convertGenericToWAV(inputBuffer, inputType);
    }
  }
  
  // 🔧 GARANTIR FORMATO WAV CORRETO
  private static async ensureWAVFormat(inputBuffer: Buffer): Promise<AudioConversionResult> {
    // Para WAV existente, apenas garantir que está no formato correto
    // Por simplicidade, vamos reconverter para garantir 16kHz mono
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${Date.now()}.wav`);
    const outputFile = join(tempDir, `output_${Date.now()}.wav`);
    
    try {
      writeFileSync(inputFile, inputBuffer);
      const result = await this.runFFmpeg(inputFile, outputFile);
      
      if (result.success && existsSync(outputFile)) {
        const outputBuffer = readFileSync(outputFile);
        this.cleanup([inputFile, outputFile]);
        
        return {
          success: true,
          audioBuffer: outputBuffer,
          format: 'wav',
          sampleRate: 16000,
          channels: 1
        };
      } else {
        throw new Error('WAV format conversion failed');
      }
      
    } catch (error: any) {
      this.cleanup([inputFile, outputFile]);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 🔄 CONVERSÃO GENÉRICA
  private static async convertGenericToWAV(inputBuffer: Buffer, inputType: string): Promise<AudioConversionResult> {
    console.log(`🔄 Attempting generic conversion for ${inputType}...`);
    
    // Determinar extensão baseada no tipo
    let extension = 'audio';
    if (inputType.includes('mp3')) extension = 'mp3';
    else if (inputType.includes('m4a')) extension = 'm4a';
    else if (inputType.includes('ogg')) extension = 'ogg';
    
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `input_${Date.now()}.${extension}`);
    const outputFile = join(tempDir, `output_${Date.now()}.wav`);
    
    try {
      writeFileSync(inputFile, inputBuffer);
      const result = await this.runFFmpeg(inputFile, outputFile);
      
      if (result.success && existsSync(outputFile)) {
        const outputBuffer = readFileSync(outputFile);
        this.cleanup([inputFile, outputFile]);
        
        return {
          success: true,
          audioBuffer: outputBuffer,
          format: 'wav',
          sampleRate: 16000,
          channels: 1
        };
      } else {
        throw new Error(`Generic conversion failed for ${inputType}`);
      }
      
    } catch (error: any) {
      this.cleanup([inputFile, outputFile]);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 