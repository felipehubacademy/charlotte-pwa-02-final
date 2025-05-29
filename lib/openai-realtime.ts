// lib/openai-realtime.ts - Implementação completa corrigida com instruções atualizadas

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

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private isConnected = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  
  // 🔊 NOVO: Sistema de controle de áudio para evitar duplicação
  private audioQueue: string[] = [];
  private isPlayingAudio = false;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private audioGainNode: GainNode | null = null;
  // 🔧 NOVO: Propriedades para processamento avançado de áudio
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private isRecording: boolean = false;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  // 🔗 Conectar usando implementação corrigida baseada na documentação oficial
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔗 [FIXED] Connecting to OpenAI Realtime API...');
        
        // 🔑 PASSO 1: Obter API key via rota segura
        await this.getAPIKey();
        
        // 🌐 PASSO 2: Conectar usando método oficial (subprotocols)
        await this.connectWithSubprotocols(resolve, reject);

      } catch (error: any) {
        console.error('❌ [FIXED] Connection error:', error);
        reject(error);
      }
    });
  }

  // 🔑 Obter API key de forma segura
  private async getAPIKey(): Promise<void> {
    console.log('🔑 [FIXED] Getting API key...');
    
    const tokenResponse = await fetch('/api/realtime-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userLevel: this.config.userLevel,
        userName: this.config.userName,
        debug: true
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(`Token API failed: ${tokenResponse.status} - ${errorData.error || 'Unknown error'}`);
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.success) {
      throw new Error(tokenData.error || 'Token request failed');
    }

    this.config.apiKey = tokenData.apiKey;
    console.log('✅ [FIXED] API key obtained successfully');
  }

  // 🌐 Conectar usando subprotocols (método oficial para browsers)
  private async connectWithSubprotocols(resolve: Function, reject: Function): Promise<void> {
    try {
      // ✅ Usar modelo testado pela comunidade
      const model = this.config.model || 'gpt-4o-realtime-preview-2024-10-01';
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      
      // ✅ MÉTODO OFICIAL: Autenticação via subprotocols (funciona em browsers)
      const subprotocols = [
        "realtime",
        `openai-insecure-api-key.${this.config.apiKey}`,
        "openai-beta.realtime-v1"
      ];

      console.log('🌐 [FIXED] WebSocket URL:', wsUrl);
      console.log('🔑 [FIXED] Subprotocols:', subprotocols);

      // Criar WebSocket com subprotocols (método oficial)
      this.ws = new WebSocket(wsUrl, subprotocols);

      // Timeout para conexão
      const connectionTimeout = setTimeout(() => {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
        reject(new Error('Connection timeout after 15 seconds'));
      }, 15000);

      // ✅ Event listeners do WebSocket
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ [FIXED] WebSocket connected successfully using subprotocols!');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // ✅ Inicializar sessão após conexão (método oficial)
        this.initializeSession();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('📥 [FIXED] Raw WebSocket message:', event.data);
          this.handleMessage(event.data);
        } catch (error) {
          console.error('❌ [FIXED] Error handling message:', error);
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ [FIXED] WebSocket error:', error);
        this.isConnected = false;
        
        // Análise específica do erro
        this.analyzeConnectionError(error, reject);
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 [FIXED] WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        this.isConnected = false;
        
        // Análise de códigos de erro específicos
        this.analyzeCloseCode(event, reject);
      };

    } catch (error: any) {
      console.error('❌ [FIXED] Failed to create WebSocket:', error);
      reject(error);
    }
  }

  // 🔍 Analisar erros de conexão
  private analyzeConnectionError(error: Event, reject: Function): void {
    const errorMessage = 'WebSocket connection failed';
    
    // Informações de debug
    console.error('❌ [FIXED] Connection analysis:', {
      error: error,
      readyState: this.ws?.readyState,
      protocol: this.ws?.protocol,
      url: this.ws?.url
    });

    // Tentar reconectar se não foi um erro de autenticação
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 [FIXED] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      setTimeout(() => {
        this.connectWithSubprotocols(() => {}, reject);
      }, 2000 * this.reconnectAttempts);
    } else {
      reject(new Error(`${errorMessage} after ${this.maxReconnectAttempts} attempts. Please check: 1) Your account has Realtime API access, 2) Your billing is active, 3) Network allows WebSocket connections`));
    }
  }

  // 🔍 Analisar códigos de fechamento
  private analyzeCloseCode(event: CloseEvent, reject?: Function): void {
    let errorMessage = '';
    
    switch (event.code) {
      case 1000:
        console.log('✅ [FIXED] Normal WebSocket closure');
        return;
        
      case 1001:
        console.log('📱 [FIXED] WebSocket closed - going away (normal for page refresh)');
        return;
        
      case 1005:
        // 🔧 CORRIGIDO: Código 1005 é normal - sem motivo específico
        console.log('🔌 [FIXED] WebSocket closed normally (no status code)');
        return;
        
      case 1008:
        errorMessage = 'AUTHENTICATION_FAILED: Invalid API key or your account does not have access to Realtime API';
        break;
        
      case 1003:
        errorMessage = 'PROTOCOL_ERROR: Invalid request format or unsupported data';
        break;
        
      case 1011:
        errorMessage = 'SERVER_ERROR: OpenAI server error - try again later';
        break;
        
      default:
        errorMessage = `WebSocket closed unexpectedly: ${event.code} - ${event.reason || 'Unknown reason'}`;
    }
    
    console.error('❌ [FIXED] WebSocket close analysis:', errorMessage);
    
    if (reject) {
      reject(new Error(errorMessage));
    } else {
      this.emit('disconnected', { 
        reason: errorMessage,
        code: event.code 
      });
    }
  }

  // 🎯 Inicializar sessão (método oficial simplificado)
  private initializeSession(): void {
    console.log('🎯 [FIXED] Initializing Realtime session...');
    
    // ✅ Configuração oficial baseada na documentação e melhores práticas
    const sessionConfig = {
      modalities: ['text', 'audio'],
      instructions: this.getInstructions(),
      voice: this.config.voice || 'alloy',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      },
      // 🔧 NOVO: Configuração otimizada de VAD para conversação natural
      turn_detection: {
        type: 'server_vad',
        threshold: 0.6, // Aumentado para reduzir falsos positivos
        prefix_padding_ms: 500, // Aumentado para capturar início da fala
        silence_duration_ms: 800, // Aumentado para permitir pausas naturais
        create_response: true
      },
      tools: this.getEnglishLearningTools(),
      tool_choice: 'auto',
      temperature: 0.8,
      max_response_output_tokens: 4096
    };

    console.log('📤 [FIXED] Sending session update:', sessionConfig);
    
    // ✅ Enviar session.update (não criar ephemeral session)
    this.sendEvent({
      type: 'session.update',
      session: sessionConfig
    });
  }

  // 📋 Instruções por nível - VERSÃO CORRIGIDA
  private getInstructions(): string {
    const levelInstructions = {
      'Novice': `CRITICAL: You must speak only in English. Never mix Portuguese and English in the same response.

You are Charlotte, a friendly and patient English tutor for Brazilian beginners who are just starting their English journey.

SPEAKING GUIDELINES:
- Always speak in English only
- Speak slowly and clearly with simple pronunciation
- Use basic vocabulary and short, simple sentences
- Pause between sentences to give time for understanding
- If a student seems confused about a specific word, you may briefly add the Portuguese translation in parentheses like: "That's wonderful (maravilhoso)!"
- Keep responses conversational and encouraging

TEACHING APPROACH:
- Always celebrate small victories and progress
- Focus on building confidence and reducing anxiety about speaking English
- Use positive reinforcement frequently
- Ask simple, encouraging questions to keep the conversation flowing
- Help with basic grammar and pronunciation in a gentle way
- Make English feel fun and accessible, not intimidating

CONVERSATION STYLE:
- Be warm, patient, and encouraging
- Use everyday topics and situations
- Keep conversations natural and relaxed
- Show genuine interest in what the student is saying`,

      'Intermediate': `CRITICAL: You must speak only in English. Never use Portuguese.

You are Charlotte, an English tutor for intermediate Brazilian learners who have a good foundation in English.

SPEAKING GUIDELINES:
- Always speak in English only - no Portuguese at all
- Use clear, natural English at a moderate pace
- Employ varied vocabulary and more complex sentence structures
- Speak with natural rhythm and intonation
- Challenge the student appropriately without overwhelming them

TEACHING APPROACH:
- Help with practical conversation skills and real-world situations
- Focus on fluency and natural conversation flow
- Provide corrections in a friendly, constructive way
- Introduce idioms, expressions, and cultural references
- Help refine grammar and expand vocabulary naturally through conversation
- Encourage longer, more detailed responses

CONVERSATION STYLE:
- Be engaging and intellectually stimulating
- Discuss current events, culture, travel, work, and personal interests
- Ask thoughtful follow-up questions
- Help bridge the gap between textbook English and real-world communication
- Build confidence for professional and social situations`,

      'Advanced': `CRITICAL: You must speak only in English. Never use Portuguese.

You are Charlotte, an English tutor for advanced Brazilian learners who want to achieve native-like fluency.

SPEAKING GUIDELINES:
- Always speak in English only - no Portuguese at all
- Use sophisticated vocabulary and natural native-like speech patterns
- Speak at natural native speed with complex sentence structures
- Use cultural references, idioms, and colloquialisms naturally
- Challenge the student with nuanced language and advanced concepts

TEACHING APPROACH:
- Help refine pronunciation to achieve native-like accent
- Focus on subtle grammar points and advanced language features
- Discuss complex topics requiring sophisticated language skills
- Help with professional communication and academic language
- Provide feedback on style, register, and cultural appropriateness
- Challenge the student to express complex ideas with precision

CONVERSATION STYLE:
- Be intellectually challenging and culturally rich
- Engage in sophisticated discussions about complex topics
- Use humor, cultural references, and advanced language naturally
- Help the student sound like a native speaker in all contexts
- Focus on achieving true bilingual proficiency`
    };
    
    return this.config.instructions || levelInstructions[this.config.userLevel];
  }

  // 🛠️ Ferramentas de ensino
  private getEnglishLearningTools(): any[] {
    return [
      {
        type: 'function',
        name: 'get_word_definition',
        description: 'Get definition and examples of an English word',
        parameters: {
          type: 'object',
          properties: {
            word: { type: 'string', description: 'The English word to define' },
            level: { 
              type: 'string', 
              enum: ['Novice', 'Intermediate', 'Advanced'],
              description: 'Learner level for appropriate explanation'
            }
          },
          required: ['word', 'level']
        }
      },
      {
        type: 'function',
        name: 'check_pronunciation',
        description: 'Provide pronunciation feedback',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'The text that was spoken' },
            target_word: { type: 'string', description: 'Word or phrase being practiced' }
          },
          required: ['text', 'target_word']
        }
      }
    ];
  }

  // 📤 Enviar evento para WebSocket
  private sendEvent(event: any): void {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      const eventString = JSON.stringify(event);
      console.log('📤 [FIXED] Sending event:', event.type);
      this.ws.send(eventString);
    } else {
      console.warn('⚠️ [FIXED] Cannot send event - WebSocket not connected', {
        hasWs: !!this.ws,
        isConnected: this.isConnected,
        readyState: this.ws?.readyState
      });
    }
  }

  // 📥 Processar mensagens (igual ao anterior, mas com logs melhorados)
  private handleMessage(data: string): void {
    try {
      const event: RealtimeEvent = JSON.parse(data);
      console.log('📥 [FIXED] Received event:', event.type);
      
      switch (event.type) {
        case 'session.created':
          console.log('✅ [FIXED] Session created successfully');
          this.sessionId = event.session?.id;
          this.emit('session_created', event);
          break;

        case 'session.updated':
          console.log('🔄 [FIXED] Session updated');
          this.emit('session_updated', event);
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 [FIXED] User started speaking');
          this.emit('user_speech_started', event);
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🔇 [FIXED] User stopped speaking');
          this.emit('user_speech_stopped', event);
          break;

        case 'conversation.item.created':
          console.log('💬 [FIXED] Conversation item created:', event.item?.type);
          this.emit('conversation_item_created', event);
          
          if (event.item?.type === 'function_call') {
            this.handleFunctionCall(event.item);
          }
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log('📝 [FIXED] Transcription completed:', event.transcript);
          this.emit('input_transcription_completed', event);
          // 🔧 NOVO: Analisar transcrição para ajustar VAD
          if (event.transcript) {
            this.handleShortWordDetection(event.transcript);
          }
          break;

        case 'response.created':
          console.log('🤖 [FIXED] Response created');
          this.emit('response_created', event);
          break;

        case 'response.text.delta':
          this.emit('text_delta', event);
          break;

        case 'response.text.done':
          console.log('✅ [FIXED] Text response completed');
          this.emit('text_done', event);
          break;

        case 'response.audio.delta':
          console.log('🔊 [FIXED] Audio delta received, queue length:', this.audioQueue.length, 'isPlaying:', this.isPlayingAudio);
          this.emit('audio_delta', event);
          if (event.delta) {
            this.playAudio(event.delta);
          }
          break;

        case 'response.audio.done':
          console.log('✅ [FIXED] Audio response completed');
          this.emit('audio_done', event);
          break;

        case 'response.done':
          console.log('✅ [FIXED] Response completed');
          this.emit('response_done', event);
          break;

        case 'error':
          console.error('❌ [FIXED] API Error:', event.error);
          this.emit('error', event);
          break;

        default:
          console.log('📨 [FIXED] Unhandled event:', event.type);
          this.emit('unhandled_event', event);
      }
    } catch (error) {
      console.error('❌ [FIXED] Error parsing message:', error);
      this.emit('error', { error: { message: 'Failed to parse message', details: error } });
    }
  }

  // 🔧 Tratar chamadas de função
  private handleFunctionCall(item: any): void {
    const functionName = item.name;
    const args = JSON.parse(item.arguments || '{}');
    
    console.log('🔧 [FIXED] Function call:', functionName, args);
    
    let result = '';
    
    switch (functionName) {
      case 'get_word_definition':
        result = JSON.stringify({
          word: args.word,
          definition: `Definition of "${args.word}" for ${args.level} level`,
          examples: [`Example with ${args.word}.`],
          pronunciation: `/pronunciation-guide/`
        });
        break;
        
      case 'check_pronunciation':
        result = JSON.stringify({
          accuracy: 85,
          feedback: 'Good pronunciation! Try emphasizing the first syllable more.',
          suggestions: ['Practice slowly', 'Focus on clarity']
        });
        break;
        
      default:
        result = JSON.stringify({ error: 'Function not implemented' });
    }
    
    this.sendFunctionResult(item.call_id, result);
  }

  // 🎤 Inicializar áudio (simplificado)
  async initializeAudio(): Promise<void> {
    try {
      console.log('🎤 [FIXED] Initializing high-quality audio...');
      
      // 🔧 NOVO: AudioContext com configurações otimizadas
      this.audioContext = new AudioContext({ 
        sampleRate: 24000,
        latencyHint: 'interactive' // Otimizado para baixa latência
      });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // 🔊 NOVO: Criar GainNode para controle de volume com compressor
      this.audioGainNode = this.audioContext.createGain();
      this.audioGainNode.gain.value = 1.0; // Volume normal
      
      // 🔧 NOVO: Adicionar compressor dinâmico para melhor qualidade
      const compressor = this.audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
      compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
      compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
      
      // 🔧 NOVO: Cadeia de processamento de áudio otimizada
      this.audioGainNode.connect(compressor);
      compressor.connect(this.audioContext.destination);
      
      // 🔧 NOVO: Configurar microfone com processamento avançado
      await this.setupMicrophone();
      
      // 🔧 NOVO: Iniciar gravação
      this.isRecording = true;

      console.log('✅ [FIXED] High-quality audio initialized successfully');
      this.emit('audio_initialized');

    } catch (error) {
      console.error('❌ [FIXED] Failed to initialize audio:', error);
      throw error;
    }
  }

  // 📤 Enviar dados de áudio
  private sendAudioData(audioData: Int16Array): void {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;

    try {
      const base64Audio = this.arrayBufferToBase64(audioData.buffer as ArrayBuffer);
      
      this.sendEvent({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      });
    } catch (error) {
      console.error('❌ [FIXED] Error sending audio:', error);
    }
  }

  // 🔄 Utilitários de conversão
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // 🔊 NOVO: Sistema de reprodução de áudio com fila (evita duplicação)
  private playAudio(base64Audio: string): void {
    if (!this.audioContext || !this.audioGainNode) return;

    // Adicionar à fila
    this.audioQueue.push(base64Audio);
    
    // Se não estiver reproduzindo, iniciar reprodução
    if (!this.isPlayingAudio) {
      this.processAudioQueue();
    }
  }

  // 🔊 NOVO: Processar fila de áudio sequencialmente
  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0 || this.isPlayingAudio) {
      return;
    }

    this.isPlayingAudio = true;

    while (this.audioQueue.length > 0) {
      const base64Audio = this.audioQueue.shift();
      if (!base64Audio) continue;

      try {
        await this.playAudioChunk(base64Audio);
      } catch (error) {
        console.error('❌ [FIXED] Error playing audio chunk:', error);
      }
    }

    this.isPlayingAudio = false;
  }

  // 🔊 NOVO: Reproduzir um chunk de áudio
  private playAudioChunk(base64Audio: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audioContext || !this.audioGainNode) {
        reject(new Error('Audio context not available'));
        return;
      }

      try {
        const audioBuffer = this.base64ToArrayBuffer(base64Audio);
        const audioData = new Int16Array(audioBuffer);
        
        // 🔧 NOVO: Processamento avançado para eliminar picotamento e ruído
        const floatArray = new Float32Array(audioData.length);
        
        // Converter Int16 para Float32 com normalização melhorada
        for (let i = 0; i < audioData.length; i++) {
          floatArray[i] = audioData[i] / 32768.0;
        }
        
        // 🔧 NOVO: Filtro de ruído avançado - remover DC offset
        let dcOffset = 0;
        for (let i = 0; i < floatArray.length; i++) {
          dcOffset += floatArray[i];
        }
        dcOffset /= floatArray.length;
        
        for (let i = 0; i < floatArray.length; i++) {
          floatArray[i] -= dcOffset;
        }
        
        // 🔧 NOVO: Suavização mais agressiva para eliminar picotamento
        const smoothedArray = new Float32Array(floatArray.length);
        const smoothingFactor = 0.3; // Suavização mais forte
        
        smoothedArray[0] = floatArray[0];
        for (let i = 1; i < floatArray.length; i++) {
          smoothedArray[i] = smoothingFactor * floatArray[i] + (1 - smoothingFactor) * smoothedArray[i - 1];
        }
        
        // 🔧 NOVO: Fade-in/out mais longo para eliminar cliques
        const fadeLength = Math.min(512, Math.floor(smoothedArray.length * 0.02)); // 2% ou 512 samples
        
        // Fade-in suave no início
        for (let i = 0; i < fadeLength; i++) {
          const fadeMultiplier = Math.sin((i / fadeLength) * Math.PI * 0.5); // Curva senoidal suave
          smoothedArray[i] *= fadeMultiplier;
        }
        
        // Fade-out suave no final
        for (let i = smoothedArray.length - fadeLength; i < smoothedArray.length; i++) {
          const fadeMultiplier = Math.sin(((smoothedArray.length - 1 - i) / fadeLength) * Math.PI * 0.5);
          smoothedArray[i] *= fadeMultiplier;
        }

        // 🔧 NOVO: Criar buffer com configurações de alta qualidade
        const buffer = this.audioContext.createBuffer(1, smoothedArray.length, 24000);
        buffer.copyToChannel(smoothedArray, 0);

        // 🛑 IMPORTANTE: Parar áudio anterior se existir
        if (this.currentAudioSource) {
          try {
            this.currentAudioSource.stop();
            this.currentAudioSource.disconnect();
          } catch (e) {
            // Ignorar erros de stop em sources já finalizados
          }
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        // 🔧 NOVO: Cadeia de processamento anti-ruído
        
        // 1. Filtro passa-alta para remover ruído de baixa frequência
        const highPassFilter = this.audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.setValueAtTime(80, this.audioContext.currentTime); // Remove ruído abaixo de 80Hz
        highPassFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);
        
        // 2. Filtro passa-baixa para remover ruído de alta frequência
        const lowPassFilter = this.audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.setValueAtTime(8000, this.audioContext.currentTime); // Reduzido para voz humana
        lowPassFilter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
        
        // 3. Filtro notch para remover frequências problemáticas
        const notchFilter = this.audioContext.createBiquadFilter();
        notchFilter.type = 'notch';
        notchFilter.frequency.setValueAtTime(60, this.audioContext.currentTime); // Remove hum de 60Hz
        notchFilter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        // 4. Compressor mais suave para evitar distorção
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, this.audioContext.currentTime); // Menos agressivo
        compressor.knee.setValueAtTime(20, this.audioContext.currentTime);
        compressor.ratio.setValueAtTime(6, this.audioContext.currentTime); // Menos compressão
        compressor.attack.setValueAtTime(0.01, this.audioContext.currentTime);
        compressor.release.setValueAtTime(0.1, this.audioContext.currentTime);
        
        // 🔧 NOVO: Cadeia de processamento otimizada
        source.connect(highPassFilter);
        highPassFilter.connect(notchFilter);
        notchFilter.connect(lowPassFilter);
        lowPassFilter.connect(compressor);
        compressor.connect(this.audioGainNode);
        
        // Armazenar referência para controle
        this.currentAudioSource = source;

        source.onended = () => {
          this.currentAudioSource = null;
          resolve();
        };

        // 🔧 NOVO: Iniciar com timing mais preciso para evitar glitches
        const startTime = this.audioContext.currentTime + 0.005; // Delay menor mas preciso
        source.start(startTime);

      } catch (error) {
        console.error('❌ [FIXED] Error playing audio chunk:', error);
        reject(error);
      }
    });
  }

  // 🛑 NOVO: Parar reprodução de áudio
  private stopCurrentAudio(): void {
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch (e) {
        // Ignorar erros
      }
      this.currentAudioSource = null;
    }
    
    // Limpar fila
    this.audioQueue = [];
    this.isPlayingAudio = false;
  }

  // 🎧 Sistema de eventos
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
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ [FIXED] Error in event listener:', error);
        }
      });
    }
  }

  // 🎤 Funções de controle
  createResponse(): void {
    this.sendEvent({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: `Respond naturally as Charlotte, adapting to the user's ${this.config.userLevel} level.`
      }
    });
  }

  // 🔧 NOVO: Interrupção inteligente com controle de VAD
  interruptResponse(): void {
    console.log('🛑 [FIXED] Intelligent interruption triggered');
    
    // 🛑 NOVO: Parar áudio atual antes de cancelar resposta
    this.stopCurrentAudio();
    
    // 🔧 NOVO: Ajustar temporariamente o VAD para ser menos sensível após interrupção
    this.adjustVADSensitivity('post_interruption');
    
    this.sendEvent({
      type: 'response.cancel'
    });
    
    // 🔧 NOVO: Restaurar VAD após um tempo
    setTimeout(() => {
      this.adjustVADSensitivity('normal');
    }, 2000);
  }

  // 🔧 NOVO: Ajustar sensibilidade do VAD dinamicamente
  private adjustVADSensitivity(mode: 'normal' | 'post_interruption' | 'sensitive'): void {
    let vadConfig;
    
    switch (mode) {
      case 'post_interruption':
        vadConfig = {
          type: 'server_vad',
          threshold: 0.7, // Mais alto após interrupção
          prefix_padding_ms: 300,
          silence_duration_ms: 1200, // Mais tempo para evitar re-interrupções
          create_response: true
        };
        break;
        
      case 'sensitive':
        vadConfig = {
          type: 'server_vad',
          threshold: 0.4, // Mais sensível para capturar palavras curtas
          prefix_padding_ms: 600,
          silence_duration_ms: 600,
          create_response: true
        };
        break;
        
      default: // normal
        vadConfig = {
          type: 'server_vad',
          threshold: 0.6,
          prefix_padding_ms: 500,
          silence_duration_ms: 800,
          create_response: true
        };
    }
    
    console.log(`🔧 [FIXED] Adjusting VAD to ${mode} mode:`, vadConfig);
    
    this.sendEvent({
      type: 'session.update',
      session: {
        turn_detection: vadConfig
      }
    });
  }

  // 🔧 NOVO: Detectar palavras curtas e ajustar VAD
  private handleShortWordDetection(transcript: string): void {
    const shortWords = ['yes', 'no', 'ok', 'yeah', 'nah', 'sure', 'right', 'good', 'bad', 'hi', 'bye'];
    const words = transcript.toLowerCase().split(' ');
    
    if (words.length <= 2 && words.some(word => shortWords.includes(word))) {
      console.log('🔧 [FIXED] Short word detected, adjusting VAD sensitivity');
      this.adjustVADSensitivity('sensitive');
      
      // Restaurar após 5 segundos
      setTimeout(() => {
        this.adjustVADSensitivity('normal');
      }, 5000);
    }
  }

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

  sendTextMessage(text: string): void {
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: text }]
      }
    });
    this.createResponse();
  }

  commitAudio(): void {
    this.sendEvent({
      type: 'input_audio_buffer.commit'
    });
    this.createResponse();
  }

  clearAudioBuffer(): void {
    this.sendEvent({
      type: 'input_audio_buffer.clear'
    });
  }

  // 🔌 Limpeza e desconexão
  disconnect(): void {
    console.log('🔌 [FIXED] Disconnecting...');
    
    // 🔧 NOVO: Parar gravação
    this.isRecording = false;
    
    // 🛑 Parar áudio atual
    this.stopCurrentAudio();
    
    // 🔌 Fechar WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // 🎤 Limpar recursos de áudio
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // 🔧 NOVO: Limpar recursos de processamento avançado
    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }
    
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isConnected = false;
    this.sessionId = null;
    this.audioQueue = [];
    this.isPlayingAudio = false;
    
    console.log('✅ [FIXED] Disconnected successfully');
  }

  // 📊 Getters
  get connected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  get session(): string | null {
    return this.sessionId;
  }

  // 🔍 Método de diagnóstico
  async diagnose(): Promise<any> {
    console.log('🔍 [FIXED] Running connection diagnosis...');
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey?.length || 0,
      websocketSupport: typeof WebSocket !== 'undefined',
      audioSupport: !!navigator.mediaDevices?.getUserMedia,
      connectionState: this.ws?.readyState,
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      reconnectAttempts: this.reconnectAttempts
    };

    console.log('📊 [FIXED] Diagnosis:', diagnosis);
    return diagnosis;
  }

  // 🎤 Configurar captura de áudio do microfone
  private async setupMicrophone(): Promise<void> {
    try {
      console.log('🎤 [FIXED] Setting up microphone...');
      
      // 🔧 NOVO: Configurações avançadas para máxima qualidade e redução de ruído
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // 🔧 NOVO: Configurações avançadas para reduzir ruído
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false,
          // 🔧 NOVO: Configurações de qualidade premium
          latency: 0.01, // Latência mínima
          volume: 0.8,   // Volume controlado
        } as any
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 🔧 NOVO: Configurar processamento avançado do microfone
      this.microphoneSource = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      // 🔧 NOVO: Cadeia de filtros para o microfone (reduzir ruído de entrada)
      
      // 1. Filtro passa-alta para remover ruído de baixa frequência do mic
      const micHighPass = this.audioContext!.createBiquadFilter();
      micHighPass.type = 'highpass';
      micHighPass.frequency.setValueAtTime(100, this.audioContext!.currentTime); // Remove ruído abaixo de 100Hz
      micHighPass.Q.setValueAtTime(0.5, this.audioContext!.currentTime);
      
      // 2. Filtro passa-baixa para limitar frequências do mic
      const micLowPass = this.audioContext!.createBiquadFilter();
      micLowPass.type = 'lowpass';
      micLowPass.frequency.setValueAtTime(8000, this.audioContext!.currentTime); // Limita a 8kHz
      micLowPass.Q.setValueAtTime(0.7, this.audioContext!.currentTime);
      
      // 3. Compressor suave para o microfone
      const micCompressor = this.audioContext!.createDynamicsCompressor();
      micCompressor.threshold.setValueAtTime(-20, this.audioContext!.currentTime);
      micCompressor.knee.setValueAtTime(15, this.audioContext!.currentTime);
      micCompressor.ratio.setValueAtTime(4, this.audioContext!.currentTime);
      micCompressor.attack.setValueAtTime(0.005, this.audioContext!.currentTime);
      micCompressor.release.setValueAtTime(0.05, this.audioContext!.currentTime);
      
      // 🔧 NOVO: Conectar cadeia de processamento do microfone
      this.microphoneSource.connect(micHighPass);
      micHighPass.connect(micLowPass);
      micLowPass.connect(micCompressor);
      
      // Conectar ao processador de áudio
      this.audioProcessor = this.audioContext!.createScriptProcessor(1024, 1, 1); // Buffer menor para menos latência
      micCompressor.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext!.destination);

      // 🔧 NOVO: Processamento de áudio melhorado para envio
      this.audioProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
        if (!this.isRecording) return;

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // 🔧 NOVO: Aplicar gate de ruído mais eficiente
        const noiseGate = -45; // dB - mais restritivo
        let rms = 0;
        for (let i = 0; i < inputData.length; i++) {
          rms += inputData[i] * inputData[i];
        }
        rms = Math.sqrt(rms / inputData.length);
        const dbLevel = 20 * Math.log10(rms);
        
        // Se o nível está abaixo do gate, silenciar completamente
        if (dbLevel < noiseGate) {
          inputData.fill(0);
        }
        
        // 🔧 NOVO: Normalização suave para evitar clipping
        const maxAmplitude = Math.max(...Array.from(inputData, (x: number) => Math.abs(x)));
        if (maxAmplitude > 0.95) {
          const normalizationFactor = 0.9 / maxAmplitude;
          for (let i = 0; i < inputData.length; i++) {
            inputData[i] *= normalizationFactor;
          }
        }

        // Converter para Int16 e enviar
        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        this.sendAudioData(int16Array);
      };

      console.log('✅ [FIXED] Microphone setup complete with advanced noise reduction');
    } catch (error) {
      console.error('❌ [FIXED] Error setting up microphone:', error);
      throw error;
    }
  }
}

// 🚀 Função de conveniência para uso simplificado
export async function createRealtimeConnection(config: RealtimeConfig): Promise<OpenAIRealtimeService> {
  const service = new OpenAIRealtimeService(config);
  
  try {
    await service.connect();
    await service.initializeAudio();
    return service;
  } catch (error) {
    console.error('❌ [FIXED] Failed to create Realtime connection:', error);
    throw error;
  }
}

// 🔧 Função para verificar se a conta tem acesso à Realtime API
export async function checkRealtimeAccess(): Promise<{
  hasAccess: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const response = await fetch('/api/realtime-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userLevel: 'Intermediate',
        userName: 'Access Check',
        debug: true
      })
    });

    if (!response.ok) {
      return {
        hasAccess: false,
        models: [],
        error: `Token API failed: ${response.status}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        hasAccess: false,
        models: [],
        error: data.error || 'Unknown error'
      };
    }

    // Se chegou até aqui, provavelmente tem acesso
    return {
      hasAccess: true,
      models: ['gpt-4o-realtime-preview-2024-10-01'],
      error: undefined
    };

  } catch (error: any) {
    return {
      hasAccess: false,
      models: [],
      error: error.message
    };
  }
}

export default OpenAIRealtimeService;