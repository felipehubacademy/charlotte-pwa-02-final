// lib/transcribe.ts

import { ClientAudioConverter } from './audio-converter-client';

export interface TranscriptionResult {
    transcription: string;
    success: boolean;
    error?: string;
  }
  
  export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('🎤 Starting transcription process...');
      console.log('📁 Original audio:', { type: audioBlob.type, size: audioBlob.size });

      // 🎯 CONVERTER PARA WAV SE NECESSÁRIO
      let processedAudioBlob = audioBlob;
      
      if (audioBlob.type.includes('webm') || audioBlob.type.includes('opus')) {
        console.log('🔄 Converting WebM/Opus to WAV for better compatibility...');
        
        const conversionResult = await ClientAudioConverter.convertToAzureFormat(audioBlob);
        
        if (conversionResult.success && conversionResult.audioBlob) {
          processedAudioBlob = conversionResult.audioBlob;
          console.log('✅ Audio converted successfully:', {
            originalType: audioBlob.type,
            newType: processedAudioBlob.type,
            originalSize: audioBlob.size,
            newSize: processedAudioBlob.size
          });
        } else {
          console.warn('⚠️ Audio conversion failed, using original:', conversionResult.error);
          // Continuar com áudio original se conversão falhar
        }
      }
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      
      // Converter blob para arquivo com nome adequado
      const audioFile = new File([processedAudioBlob], 'audio.wav', {
        type: processedAudioBlob.type || 'audio/wav'
      });
      
      formData.append('audio', audioFile);

      console.log('📤 Sending audio for transcription:', {
        type: audioFile.type,
        size: audioFile.size
      });

      // Determinar URL base
      const baseUrl = typeof window !== 'undefined' 
        ? '' // Cliente: URL relativa
        : process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL.replace(/-[a-z0-9]+\.vercel\.app$/, '.vercel.app')}` 
          : 'http://localhost:3000'; // Servidor: URL absoluta

      const apiUrl = `${baseUrl}/api/transcribe`;
      
      console.log('🌐 Transcription API URL:', apiUrl);

      // Fazer a requisição para nossa API
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Transcription successful:', data.transcription);

      return {
        transcription: data.transcription,
        success: true
      };

    } catch (error: any) {
      console.error('❌ Transcription failed:', error);
      
      return {
        transcription: '',
        success: false,
        error: error.message || 'Failed to transcribe audio'
      };
    }
  }
  
  // Função para converter áudio para formato compatível se necessário
  export function prepareAudioForTranscription(audioBlob: Blob): Blob {
    // Por enquanto retorna o blob original
    // No futuro podemos adicionar conversão de formato se necessário
    return audioBlob;
  }