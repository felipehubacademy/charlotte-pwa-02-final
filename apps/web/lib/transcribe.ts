// lib/transcribe.ts

export interface TranscriptionResult {
    transcription: string;
    success: boolean;
    error?: string;
  }
  
  export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('🎤 Starting transcription process...');
      console.log('📁 Audio received:', { type: audioBlob.type, size: audioBlob.size });

      // ✅ NOTA: A conversão de áudio deve ser feita no CLIENTE antes de enviar para o servidor
      // O áudio já deve chegar aqui convertido para WAV se necessário
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      
      // Converter blob para arquivo
      const audioFile = new File([audioBlob], 'audio.wav', {
        type: audioBlob.type || 'audio/wav'
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