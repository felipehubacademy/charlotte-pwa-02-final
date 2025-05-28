// lib/transcribe.ts

export interface TranscriptionResult {
    transcription: string;
    success: boolean;
    error?: string;
  }
  
  export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      
      // Converter blob para arquivo com nome adequado
      const audioFile = new File([audioBlob], 'audio.webm', {
        type: audioBlob.type || 'audio/webm'
      });
      
      formData.append('audio', audioFile);
  
      console.log('Sending audio for transcription:', {
        type: audioFile.type,
        size: audioFile.size
      });
  
      // Fazer a requisição para nossa API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
  
      console.log('Transcription successful:', data.transcription);
  
      return {
        transcription: data.transcription,
        success: true
      };
  
    } catch (error: any) {
      console.error('Transcription failed:', error);
      
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