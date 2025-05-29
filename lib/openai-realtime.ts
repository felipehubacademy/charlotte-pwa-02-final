// lib/openai-realtime.ts - OpenAI Realtime API Service (Implementação Oficial)

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  instructions?: string;
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
  userName?: string;
}

export interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

export interface SessionConfig {
  modalities: string[];
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription?: {
    model: string;
  };
  turn_detection?: {
    type: string;
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  tools?: any[];
  tool_choice?: string;
  temperature?: number;
  max_response_output_tokens?: number;
}

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private isConnected = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private sessionId: string | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  // 🔗 Conectar ao OpenAI Realtime API
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔗 Connecting to OpenAI Realtime API...');
        
        // Buscar API key de forma segura
        const tokenResponse = await fetch('/api/realtime-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userLevel: this.config.userLevel,
            userName: this.config.userName
          })
        });

        if (!tokenResponse.ok) {
          throw new Error(`Failed to get API token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        if (!tokenData.success) {
          throw new Error(tokenData.error || 'Token request failed');
        }

        this.config.apiKey = tokenData.apiKey;
        console.log('🔑 API key obtained successfully');

        // Primeiro, vamos testar se temos acesso à Realtime API
        console.log('🔍 Testing Realtime API access...');
        try {
          const testResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (testResponse.ok) {
            const models = await testResponse.json();
            const hasRealtimeModel = models.data.some((model: any) => 
              model.id.includes('realtime') || model.id.includes('gpt-4o-realtime')
            );
            
            if (!hasRealtimeModel) {
              throw new Error('REALTIME_ACCESS_DENIED: Your account does not have access to Realtime API models. Please check your OpenAI account tier or contact OpenAI support.');
            }
            
            console.log('✅ Realtime API access confirmed');
          }
        } catch (accessError: any) {
          if (accessError.message.includes('REALTIME_ACCESS_DENIED')) {
            throw accessError;
          }
          console.log('⚠️ Could not verify Realtime API access, proceeding anyway...');
        }

        // Usar sessão ephemeral (única forma de autenticar WebSocket em browsers)
        console.log('🎫 Creating ephemeral session...');
        await this.createEphemeralSession(resolve, reject);

      } catch (error) {
        console.error('❌ Connection error:', error);
        reject(error);
      }
    });
  }

  // 🎫 Criar sessão ephemeral (necessário para autenticação WebSocket)
  private async createEphemeralSession(resolve: Function, reject: Function): Promise<void> {
    try {
      console.log('🎫 Creating ephemeral session...');
      
      const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o-realtime-preview-2024-12-17',
          modalities: ['text', 'audio'],
          instructions: this.getInstructions(),
          voice: this.config.voice || 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          tools: [
            {
              type: 'function',
              name: 'get_word_definition',
              description: 'Get the definition and examples of an English word to help with learning',
              parameters: {
                type: 'object',
                properties: {
                  word: {
                    type: 'string',
                    description: 'The English word to define'
                  },
                  level: {
                    type: 'string',
                    enum: ['Novice', 'Intermediate', 'Advanced'],
                    description: 'The learner level for appropriate explanation'
                  }
                },
                required: ['word', 'level']
              }
            },
            {
              type: 'function',
              name: 'check_pronunciation',
              description: 'Provide pronunciation feedback for English words or phrases',
              parameters: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'The text that was spoken'
                  },
                  target_word: {
                    type: 'string',
                    description: 'The word or phrase being practiced'
                  }
                },
                required: ['text', 'target_word']
              }
            }
          ],
          tool_choice: 'auto',
          temperature: 0.8,
          max_response_output_tokens: 4096
        })
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(`Failed to create ephemeral session: ${sessionResponse.status} - ${errorText}`);
      }

      const sessionData = await sessionResponse.json();
      console.log('✅ Ephemeral session created:', sessionData);
      
      if (!sessionData.client_secret) {
        throw new Error('No client_secret received from ephemeral session');
      }

      // Usar WebRTC em vez de WebSocket (mais estável com ephemeral sessions)
      console.log('🔄 Using WebRTC connection (more stable than WebSocket)...');
      await this.connectWithWebRTC(sessionData.client_secret, resolve, reject);

    } catch (error) {
      console.error('❌ Failed to create ephemeral session:', error);
      reject(error);
    }
  }

  // 🌐 Conectar usando WebRTC (mais estável que WebSocket)
  private async connectWithWebRTC(clientSecret: string, resolve: Function, reject: Function): Promise<void> {
    try {
      console.log('🌐 Setting up WebRTC connection...');
      
      // Criar RTCPeerConnection
      const pc = new RTCPeerConnection();
      
      // Configurar data channel para eventos
      const dc = pc.createDataChannel('oai-events');
      
      dc.onopen = () => {
        console.log('✅ WebRTC Data Channel connected successfully');
        this.isConnected = true;
        resolve();
      };

      dc.onmessage = (event) => {
        console.log('📥 Raw WebRTC message:', event.data);
        this.handleMessage(event.data);
      };

      dc.onerror = (error) => {
        console.error('❌ WebRTC Data Channel error:', error);
        this.isConnected = false;
        reject(error);
      };

      dc.onclose = () => {
        console.log('🔌 WebRTC Data Channel closed');
        this.isConnected = false;
        this.emit('disconnected', { reason: 'data_channel_closed' });
      };

      // Configurar áudio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = stream.getAudioTracks()[0];
        pc.addTrack(audioTrack, stream);
        this.mediaStream = stream;
        console.log('🎤 Audio track added to WebRTC connection');
      } catch (audioError) {
        console.warn('⚠️ Could not add audio track:', audioError);
      }

      // Configurar recepção de áudio
      pc.ontrack = (event) => {
        console.log('🔊 Received remote audio track');
        const remoteStream = event.streams[0];
        if (remoteStream) {
          // Criar elemento de áudio para reproduzir resposta da IA
          const audioElement = new Audio();
          audioElement.srcObject = remoteStream;
          audioElement.autoplay = true;
          console.log('🔊 Remote audio configured for playback');
        }
      };

      // Criar offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Enviar offer para OpenAI e receber answer
      const response = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WebRTC handshake failed: ${response.status} - ${errorText}`);
      }

      const answerSdp = await response.text();
      const answer = { type: 'answer' as RTCSdpType, sdp: answerSdp };
      await pc.setRemoteDescription(answer);

      // Aguardar conexão
      await new Promise<void>((connectResolve, connectReject) => {
        const timeout = setTimeout(() => {
          connectReject(new Error('WebRTC connection timeout'));
        }, 10000);

        pc.onconnectionstatechange = () => {
          console.log('🔗 WebRTC connection state:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            clearTimeout(timeout);
            connectResolve();
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            clearTimeout(timeout);
            connectReject(new Error(`WebRTC connection failed: ${pc.connectionState}`));
          }
        };
      });

      // Armazenar referências
      this.peerConnection = pc;
      this.dataChannel = dc;
      
      console.log('✅ WebRTC connection established successfully');

    } catch (error) {
      console.error('❌ WebRTC connection failed:', error);
      reject(error);
    }
  }

  private getInstructions(): string {
    const levelInstructions = {
      'Novice': `You are Charlotte, a friendly and patient English tutor for beginners. Use simple, clear English and be very encouraging. When helpful, include brief Portuguese explanations. Focus on basic vocabulary and grammar. Always be supportive and celebrate small victories.`,
      'Intermediate': `You are Charlotte, an English tutor for intermediate learners. Use clear, practical English and focus on real-world communication. Help with business English and everyday situations. Provide helpful corrections and suggestions to improve fluency.`,
      'Advanced': `You are Charlotte, an English tutor for advanced learners. Use sophisticated language and focus on nuanced communication. Help with professional English, complex grammar, and advanced vocabulary. Challenge the student appropriately.`
    };
    return this.config.instructions || levelInstructions[this.config.userLevel];
  }

  // 🎯 Inicializar sessão com configurações personalizadas
  private initializeSession(): void {
    // Ferramentas de exemplo para ensino de inglês
    const englishLearningTools = [
      {
        type: 'function',
        name: 'get_word_definition',
        description: 'Get the definition and examples of an English word to help with learning',
        parameters: {
          type: 'object',
          properties: {
            word: {
              type: 'string',
              description: 'The English word to define'
            },
            level: {
              type: 'string',
              enum: ['Novice', 'Intermediate', 'Advanced'],
              description: 'The learner level for appropriate explanation'
            }
          },
          required: ['word', 'level']
        }
      },
      {
        type: 'function',
        name: 'check_pronunciation',
        description: 'Provide pronunciation feedback for English words or phrases',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text that was spoken'
            },
            target_word: {
              type: 'string',
              description: 'The word or phrase being practiced'
            }
          },
          required: ['text', 'target_word']
        }
      }
    ];

    // Configuração de sessão sempre com server_vad
    const sessionConfig: SessionConfig = {
      modalities: ['text', 'audio'],
      instructions: this.getInstructions(),
      voice: this.config.voice || 'alloy',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      tools: englishLearningTools,
      tool_choice: 'auto',
      temperature: 0.8,
      max_response_output_tokens: 4096
    };

    console.log('🎯 Initializing session with server_vad:', sessionConfig);

    this.sendEvent({
      type: 'session.update',
      session: sessionConfig
    });
  }

  // 📤 Enviar evento para o WebSocket
  private sendEvent(event: any): void {
    if (this.ws && this.isConnected) {
      const eventString = JSON.stringify(event);
      console.log('📤 Sending event:', event.type, event);
      this.ws.send(eventString);
    } else {
      console.warn('⚠️ Cannot send event - WebSocket not connected');
    }
  }

  // 📥 Processar mensagens recebidas
  private handleMessage(data: string): void {
    try {
      const event: RealtimeEvent = JSON.parse(data);
      console.log('📥 Received event:', event.type, event);
      
      switch (event.type) {
        case 'session.created':
          console.log('✅ Session created successfully');
          this.sessionId = event.session?.id;
          this.emit('session_created', event);
          break;

        case 'session.updated':
          console.log('🔄 Session updated');
          this.emit('session_updated', event);
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 User started speaking');
          this.emit('user_speech_started', event);
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🔇 User stopped speaking');
          this.emit('user_speech_stopped', event);
          break;

        case 'input_audio_buffer.committed':
          console.log('✅ Audio buffer committed');
          this.emit('audio_committed', event);
          break;

        case 'input_audio_buffer.cleared':
          console.log('🧹 Audio buffer cleared');
          this.emit('audio_cleared', event);
          break;

        case 'conversation.item.created':
          console.log('💬 Conversation item created:', event.item?.type);
          this.emit('conversation_item_created', event);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log('📝 Input transcription completed:', event.transcript);
          this.emit('input_transcription_completed', event);
          break;

        case 'conversation.item.input_audio_transcription.failed':
          console.log('❌ Input transcription failed');
          this.emit('input_transcription_failed', event);
          break;

        case 'response.created':
          console.log('🤖 Response created');
          this.emit('response_created', event);
          break;

        case 'response.output_item.added':
          console.log('📝 Output item added');
          this.emit('output_item_added', event);
          break;

        case 'response.content_part.added':
          console.log('📄 Content part added');
          this.emit('content_part_added', event);
          break;

        case 'response.text.delta':
          console.log('📝 Text delta:', event.delta);
          this.emit('text_delta', event);
          break;

        case 'response.text.done':
          console.log('✅ Text response completed');
          this.emit('text_done', event);
          break;

        case 'response.audio.delta':
          console.log('🔊 Audio delta received');
          this.emit('audio_delta', event);
          if (event.delta) {
            this.playAudio(event.delta);
          }
          break;

        case 'response.audio.done':
          console.log('✅ Audio response completed');
          this.emit('audio_done', event);
          break;

        case 'response.function_call_arguments.delta':
          console.log('🔧 Function call arguments delta:', event.delta);
          this.emit('function_call_arguments_delta', event);
          break;

        case 'response.function_call_arguments.done':
          console.log('✅ Function call arguments completed');
          this.emit('function_call_arguments_done', event);
          break;

        case 'response.done':
          console.log('✅ Response completed');
          this.emit('response_done', event);
          break;

        case 'error':
          console.error('❌ API Error:', event.error || 'Unknown error');
          console.error('❌ Full error event:', event);
          
          // Verificar se há detalhes do erro
          if (event.error) {
            console.error('❌ Error details:', JSON.stringify(event.error, null, 2));
          } else {
            console.error('❌ Error event without error details:', JSON.stringify(event, null, 2));
          }
          
          this.emit('error', event);
          break;

        default:
          console.log('📨 Unhandled event:', event.type);
          this.emit('unhandled_event', event);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  }

  // 🎤 Inicializar captura de áudio
  async initializeAudio(): Promise<void> {
    try {
      console.log('🎤 Initializing audio capture...');
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Criar processador de áudio simples
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Converter Float32 para Int16
        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        this.sendAudioData(int16Array);
      };
      
      source.connect(processor);
      processor.connect(this.audioContext.destination);

      console.log('✅ Audio initialized successfully');
      this.emit('audio_initialized');

    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
      throw error;
    }
  }

  // 📤 Enviar dados de áudio
  private sendAudioData(audioData: Int16Array): void {
    if (!this.isConnected) return;

    // Converter para base64
    const base64Audio = this.arrayBufferToBase64(audioData.buffer as ArrayBuffer);
    
    this.sendEvent({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    });
  }

  // 🔄 Converter ArrayBuffer para Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // 🔄 Converter Base64 para ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // 🔊 Reproduzir áudio recebido
  private playAudio(base64Audio: string): void {
    if (!this.audioContext) return;

    try {
      const audioBuffer = this.base64ToArrayBuffer(base64Audio);
      const audioData = new Int16Array(audioBuffer);
      
      // Converter Int16 para Float32
      const floatArray = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        floatArray[i] = audioData[i] / 32768.0;
      }

      // Criar AudioBuffer
      const buffer = this.audioContext.createBuffer(1, floatArray.length, 24000);
      buffer.copyToChannel(floatArray, 0);

      // Reproduzir
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();

    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
  }

  // 💬 Enviar mensagem de texto
  sendTextMessage(text: string): void {
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    });

    this.createResponse();
  }

  // 🎤 Confirmar entrada de áudio
  commitAudio(): void {
    this.sendEvent({
      type: 'input_audio_buffer.commit'
    });

    this.createResponse();
  }

  // 🤖 Criar resposta
  createResponse(): void {
    this.sendEvent({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: `Respond naturally as Charlotte, adapting to the user's ${this.config.userLevel} level.`
      }
    });
  }

  // 🛑 Cancelar resposta atual
  cancelResponse(): void {
    this.sendEvent({
      type: 'response.cancel'
    });
  }

  // 🎧 Event listener system
  on(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(eventType: string, data?: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // 🔌 Desconectar
  disconnect(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.sessionId = null;
    this.eventListeners.clear();
  }

  // 📊 Status da conexão
  get connected(): boolean {
    return this.isConnected;
  }

  // 📊 ID da sessão
  get session(): string | null {
    return this.sessionId;
  }

  // 📊 Limpar buffer de áudio
  clearAudioBuffer(): void {
    this.sendEvent({
      type: 'input_audio_buffer.clear'
    });
  }

  // 🗑️ Deletar item da conversa
  deleteConversationItem(itemId: string): void {
    this.sendEvent({
      type: 'conversation.item.delete',
      item_id: itemId
    });
  }

  // ✂️ Truncar item da conversa (útil para interromper áudio)
  truncateConversationItem(itemId: string, contentIndex: number, audioEndMs: number): void {
    this.sendEvent({
      type: 'conversation.item.truncate',
      item_id: itemId,
      content_index: contentIndex,
      audio_end_ms: audioEndMs
    });
  }

  // ⏹️ Interromper resposta atual
  interruptResponse(): void {
    this.sendEvent({
      type: 'response.cancel'
    });
  }

  // 🔧 Adicionar ferramenta/função
  addTool(tool: any): void {
    // Atualizar sessão com nova ferramenta
    this.sendEvent({
      type: 'session.update',
      session: {
        tools: [tool]
      }
    });
  }

  // 📤 Enviar resultado de função
  sendFunctionResult(callId: string, output: string): void {
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: output
      }
    });
  }

  // 🎤 Configurar Voice Activity Detection (VAD) - Sempre server_vad
  updateVADSettings(vadConfig: {
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  }): void {
    this.sendEvent({
      type: 'session.update',
      session: {
        turn_detection: {
          type: 'server_vad',
          threshold: vadConfig.threshold || 0.5,
          prefix_padding_ms: vadConfig.prefix_padding_ms || 300,
          silence_duration_ms: vadConfig.silence_duration_ms || 500
        }
      }
    });
    console.log('🎤 VAD settings updated (server_vad):', vadConfig);
  }
} 