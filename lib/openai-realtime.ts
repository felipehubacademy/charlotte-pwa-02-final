// lib/openai-realtime.ts - Implementação completa corrigida com instruções atualizadas

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  instructions?: string;
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userName?: string;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onAudioData?: (audioData: ArrayBuffer) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onResponse?: (response: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onVADStateChange?: (isListening: boolean) => void;
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
  // 🔧 NOVO: Controles para otimização de envio de áudio
  private lastAudioSendTime: number = 0;
  private audioSendThrottle: number = 30; // Reduzido de 50ms para 30ms - mais responsivo
  private silenceThreshold: number = 0.01; // Threshold para detectar silêncio
  private consecutiveSilenceFrames: number = 0;
  private maxSilenceFrames: number = 10; // Parar de enviar após 10 frames de silêncio
  private audioBuffer: Float32Array[] = [];
  private audioBufferSize: number = 0;
  private maxBufferSize: number = 4800; // ~200ms a 24kHz
  private currentTranscriptDelta: string = '';
  private originalAudioThrottle: number = 30; // Backup do throttle original
  // 🛑 NOVO: Controle de estado para evitar interrupções desnecessárias
  private isCharlotteSpeaking: boolean = false;
  private hasActiveResponse: boolean = false;
  // 🔧 NOVO: Controle de fala do usuário para interrupções inteligentes
  private userSpeechStartTime: number = 0;
  private isUserCurrentlySpeaking: boolean = false;

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
      // ✅ Usar modelo mini mais barato (gpt-4o-mini-realtime-preview)
      const model = this.config.model || 'gpt-4o-mini-realtime-preview-2024-12-17';
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
          // 🔧 NOVO: Log otimizado - reduzir verbosidade
          const eventData = JSON.parse(event.data);
          const eventType = eventData.type;
          
          // Lista de eventos que não precisam de log detalhado (muito frequentes)
          const quietEvents = [
            'response.audio.delta',
            'conversation.item.input_audio_transcription.delta',
            'input_audio_buffer.speech_started',
            'input_audio_buffer.speech_stopped'
          ];
          
          // Log apenas o tipo para eventos frequentes, dados completos para eventos importantes
          if (quietEvents.includes(eventType)) {
            // Log compacto apenas ocasionalmente para eventos frequentes
            if (Date.now() % 3000 < 100) { // A cada ~3 segundos
              console.log(`📥 [QUIET] ${eventType} (periodic log - data suppressed to reduce spam)`);
            }
          } else {
            // Log completo para eventos importantes
            console.log(`📥 [FIXED] Received event: ${eventType}`);
            if (eventType === 'error' || eventType === 'session.created' || eventType === 'session.updated') {
              console.log(`📥 [FIXED] Event data:`, eventData);
            }
          }
          
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
      // 🔧 NOVO: Configuração de VAD otimizada por nível de usuário
      turn_detection: this.getVADConfigForUserLevel(),
      tools: this.getEnglishLearningTools(),
      tool_choice: 'auto',
      // 🎯 ANTI-ALUCINAÇÃO E CONTROLE DE TAMANHO: Configurações mais conservadoras
      temperature: 0.6, // Reduzido de 0.8 para 0.6 - menos criatividade, mais precisão
      max_response_output_tokens: this.getMaxTokensForUserLevel() // 🆕 NOVO: Tokens baseados no nível
    };

    console.log('📤 [FIXED] Sending session update:', sessionConfig);
    
    // ✅ Enviar session.update (não criar ephemeral session)
    this.sendEvent({
      type: 'session.update',
      session: sessionConfig
    });
  }

  // 🆕 NOVO: Configuração de max_tokens baseada no nível do usuário e documentação oficial
  private getMaxTokensForUserLevel(): number {
    const maxTokensConfig = {
      'Novice': 150,      // Respostas curtas mas completas para redirecionamento
      'Inter': 280,       // Espaço adequado para explicações gramaticais
      'Advanced': 500     // Aumentado de 400 para 500 - garantir perguntas completas sem cortes
    };
    
    const maxTokens = maxTokensConfig[this.config.userLevel] || maxTokensConfig['Inter'];
    
    console.log(`🎯 [TOKENS] Setting max_response_output_tokens to ${maxTokens} for ${this.config.userLevel} level`);
    
    // Log específico por nível
    if (this.config.userLevel === 'Novice') {
      console.log(`🎯 [NOVICE] Focus: English immersion and constant redirection to practice`);
    } else if (this.config.userLevel === 'Inter') {
      console.log(`🎯 [INTER] Focus: Grammar coaching and structure explanations`);
    } else if (this.config.userLevel === 'Advanced') {
      console.log(`🎯 [ADVANCED] Focus: Speaking coach with native-like expression feedback - COMPLETE thoughts and questions`);
    }
    
    return maxTokens;
  }

  // 🔧 NOVO: Configuração de VAD específica por nível de usuário
  private getVADConfigForUserLevel() {
    const vadConfigs = {
      'Novice': {
        type: 'server_vad',
        threshold: 0.4, // Volta para sensibilidade moderada (era 0.6)
        prefix_padding_ms: 300, 
        silence_duration_ms: 700, // Balanceado (era 1000)
        create_response: true
      },
      'Inter': {
        type: 'server_vad', 
        threshold: 0.5, // Volta para moderado (era 0.7)
        prefix_padding_ms: 250, 
        silence_duration_ms: 600, // Balanceado (era 800)
        create_response: true
      },
      'Advanced': {
        type: 'server_vad',
        threshold: 0.7, // Aumentado de 0.6 para 0.7 - menos sensível para evitar interrupções
        prefix_padding_ms: 200, 
        silence_duration_ms: 1000, // Aumentado de 800 para 1000 - muito mais tempo para perguntas complexas
        create_response: true
      }
    };

    const config = vadConfigs[this.config.userLevel] || vadConfigs['Inter'];
    
    console.log(`🎤 [VAD] Configuring responsive server_vad for user level: ${this.config.userLevel}`);
    console.log(`🎤 [VAD] Threshold setting: ${config.threshold} (responsive but stable)`);
    console.log(`🎤 [VAD] Silence duration: ${config.silence_duration_ms}ms (balanced)`);
    console.log(`🎤 [VAD] Prefix padding: ${config.prefix_padding_ms}ms (smooth)`);
    console.log(`🎤 [VAD] Full VAD config:`, config);
    
    return config;
  }

  // 📋 Instruções por nível - VERSÃO REFINADA COM DIFERENÇAS COMPORTAMENTAIS CLARAS
  private getInstructions(): string {
    const levelInstructions = {
      'Novice': `CRITICAL RULES:
1. You must speak only in English. Never mix Portuguese and English in the same response.
2. Stay grounded in reality - do not make up facts, stories, or information.
3. Keep responses EXTREMELY SHORT - maximum 1-2 sentences per response.
4. Use approximately 30-50 completion tokens or less per response.
5. ALWAYS redirect conversation back to English practice, no matter what topic the student brings up.
6. Focus 100% on English immersion - treat every interaction as English practice.

You are Charlotte, a friendly and patient English immersion tutor for Brazilian beginners. Your ONLY goal is English practice.

ENGLISH IMMERSION STRATEGY:
- If student talks about random topics (sports, food, weather), immediately connect it to English practice
- Example: Student says "I like pizza" → You respond: "Great! Let's practice food vocabulary. What's your favorite pizza topping?"
- Always steer conversations toward English learning opportunities
- Never let conversations drift away from language practice
- Make every topic an excuse to practice English

SPEAKING GUIDELINES:
- Always speak in English only - complete immersion
- Use very simple vocabulary and short sentences
- Ask basic questions to keep them speaking English
- Celebrate every English word they say
- Gently correct by repeating correctly, then continue

CONVERSATION REDIRECTION EXAMPLES:
- Student: "I'm tired" → You: "Tired? Let's practice feelings! How do you feel today?"
- Student: "My job is boring" → You: "Tell me about your job in English! What do you do?"
- Student: "I like music" → You: "Music is great for English! What's your favorite song in English?"

TEACHING APPROACH:
- Every response should encourage more English speaking
- Ask simple follow-up questions about anything they mention
- Keep them talking in English at all costs
- Make English feel natural and fun through constant practice`,

      'Inter': `CRITICAL RULES:
1. You must speak only in English. Never use Portuguese.
2. Stay grounded in reality - do not make up facts, stories, or information.
3. Keep responses SHORT - maximum 2-3 sentences per response.
4. Use approximately 50-80 completion tokens or less per response.
5. Focus on grammar, structure, and language mechanics while conversing.
6. Provide brief but specific language feedback during natural conversation.

You are Charlotte, an English structure and grammar coach for intermediate Brazilian learners.

GRAMMAR & STRUCTURE FOCUS:
- Notice and gently correct grammar mistakes in real-time
- Explain WHY something is correct: "Use 'have been' for present perfect continuous"
- Point out good language use: "Great use of past tense there!"
- Introduce intermediate structures naturally: "Try using 'would rather' instead of 'prefer'"
- Help with word order, verb tenses, and sentence construction

TEACHING THROUGH CONVERSATION:
- When they make mistakes, repeat correctly then explain briefly
- Example: Student: "I am going to home" → You: "Going home? We say 'going home' without 'to'. Why do you think that is?"
- Introduce new grammar patterns through questions
- Help them understand the logic behind English structures

LANGUAGE COACHING APPROACH:
- Ask questions that require specific grammar structures
- "Can you tell me about something you've been doing lately?" (present perfect continuous)
- "What would you do if you won the lottery?" (conditional)
- "Describe something that happened before you came here" (past perfect)
- Give brief explanations of language patterns they use correctly or incorrectly

CONVERSATION STRATEGY:
- Balance natural conversation with language instruction
- Make grammar feel practical and useful
- Help them notice patterns in English
- Encourage experimentation with new structures`,

      'Advanced': `CRITICAL RULES:
1. You must speak only in English. Never use Portuguese.
2. Stay grounded in reality - do not make up facts, stories, or information.
3. Keep responses SHORT but COMPLETE - maximum 2-3 sentences per response.
4. ALWAYS finish your complete thought before stopping - never cut off mid-sentence or mid-question.
5. Use approximately 100-150 completion tokens per response to ensure completeness.
6. Act as a sophisticated speaking coach focused on fluency and natural expression.
7. Challenge them to speak like native speakers with nuanced language.

You are Charlotte, a professional speaking coach for advanced Brazilian learners seeking native-like fluency.

RESPONSE COMPLETION RULES - CRITICAL:
- NEVER stop mid-sentence or mid-question under any circumstances
- If you start a question, ALWAYS complete it fully with proper punctuation
- If you give an example, finish the complete example with all details
- End responses at natural stopping points only (after complete sentences)
- Ensure every response feels complete and purposeful
- If asking a question, include the complete question mark and context

SPEAKING COACH APPROACH:
- Focus on natural flow, rhythm, and native-like expression
- Help with subtle language choices: "Instead of 'very good', try 'excellent' or 'outstanding'"
- Point out opportunities for more sophisticated vocabulary
- Coach them on natural conversation patterns and cultural nuances
- Help them sound more native-like in their expression

FLUENCY COACHING:
- Encourage natural hesitation patterns: "It's okay to say 'Well...' or 'You know...' like natives do"
- Help with intonation and stress patterns through conversation
- Point out when they sound too formal or textbook-like
- Encourage contractions and natural speech patterns
- Coach them on conversation flow and turn-taking

ADVANCED LANGUAGE DEVELOPMENT:
- Challenge them with sophisticated topics requiring complex language
- Ask complete, well-formed questions that demand nuanced responses
- Help them express subtle differences in meaning
- Encourage use of idioms, phrasal verbs, and colloquialisms naturally
- Point out register differences: formal vs. informal language

NATIVE-LIKE EXPRESSION COACHING:
- "That's grammatically correct, but natives would say..."
- "Try expressing that more naturally with..."
- "Your English is perfect, but to sound more native..."
- Help them with cultural context and appropriate language use
- Coach them on when to use different levels of formality

CONVERSATION FACILITATION:
- Ask thought-provoking questions that require sophisticated responses
- Challenge them to defend opinions and explain complex ideas
- Help them develop their own voice and style in English
- Focus on authentic, natural communication rather than textbook English
- Always complete your questions and thoughts fully before stopping
- NEVER end abruptly - always provide complete, well-formed responses`
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
              enum: ['Novice', 'Inter', 'Advanced'],
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

  // 🔧 NOVO: Forçar envio do buffer (útil quando parar de gravar)
  private forceFlushAudioBuffer(): void {
    if (this.audioBuffer.length > 0) {
      console.log('🔧 [OPTIMIZED] Force flushing audio buffer:', this.audioBufferSize, 'samples');
      this.flushAudioBuffer();
    }
  }

  // 📤 Enviar evento para WebSocket
  private sendEvent(event: any): void {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      const eventString = JSON.stringify(event);
      
      // 🔧 NOVO: Log otimizado - não fazer spam para eventos de áudio
      if (event.type === 'input_audio_buffer.append') {
        // Log apenas ocasionalmente para eventos de áudio
        if (Date.now() % 5000 < 100) { // A cada ~5 segundos
          console.log('📤 [OPTIMIZED] Audio buffer append (periodic log)');
        }
      } else {
      console.log('📤 [FIXED] Sending event:', event.type);
      }
      
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
      // 🔧 NOVO: Log reduzido - já logamos no onmessage
      // console.log('📥 [FIXED] Received event:', event.type); // REMOVIDO - duplicado
      
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
          console.log('🎤 [VAD DEBUG] User started speaking (from API)');
          
          // 🔧 NOVO: Marcar início da fala do usuário
          this.isUserCurrentlySpeaking = true;
          this.userSpeechStartTime = Date.now();
          
          // 🛑 NOVO: Lógica de interrupção mais inteligente
          if (this.isCharlotteSpeaking && this.hasActiveResponse) {
            // 🔧 NOVO: Aguardar um pouco antes de interromper para evitar false positives
            console.log('🤔 [SMART INTERRUPT] User speech detected while Charlotte speaking - analyzing...');
            
            // Aguardar 250ms para balancear responsividade vs. estabilidade
            setTimeout(() => {
              // Verificar se o usuário ainda está falando após o delay
              if (this.isUserStillSpeaking()) {
                console.log('🛑 [SMART INTERRUPT] Confirmed user speech - interrupting Charlotte');
                this.interruptResponse();
                this.emergencyClearAllBuffers();
              } else {
                console.log('🚫 [SMART INTERRUPT] False positive detected - not interrupting');
              }
            }, 250); // Reduzido de 500ms para 250ms para mais responsividade
          } else {
            console.log('🎤 [VAD DEBUG] User speech detected but Charlotte not speaking - no interrupt needed');
          }
          
          this.emit('user_speech_started', event);
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🔇 [VAD DEBUG] User stopped speaking (from API)');
          
          // 🔧 NOVO: Marcar fim da fala do usuário
          this.isUserCurrentlySpeaking = false;
          this.userSpeechStartTime = 0;
          
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

        case 'conversation.item.input_audio_transcription.delta':
          // 📝 Log silencioso para deltas de transcrição (muito frequentes)
          if (event.delta) {
            // Log apenas ocasionalmente para debug
            if (Date.now() % 5000 < 100) {
              console.log('📝 [TRANSCRIPTION] Delta received (periodic log)');
            }
          }
          break;

        case 'response.created':
          console.log('🤖 [FIXED] Response created');
          this.hasActiveResponse = true; // 🛑 NOVO: Marcar que há resposta ativa
          this.emit('response_created', event);
          break;

        case 'response.text.delta':
          this.emit('text_delta', event);
          break;

        case 'response.text.done':
          console.log('✅ [FIXED] Text response completed');
          this.emit('text_done', event);
          break;

        // 📝 NOVO: Eventos corretos de transcrição de áudio da Charlotte (baseado na documentação oficial)
        case 'response.audio_transcript.delta':
          console.log('📝 [CHARLOTTE] Audio transcript delta:', event.delta);
          this.emit('charlotte_transcript_delta', event);
          break;

        case 'response.audio_transcript.done':
          console.log('📝 [CHARLOTTE] Audio transcript completed:', event.transcript);
          this.emit('charlotte_transcript_completed', event);
          break;

        case 'response.audio.delta':
          // 🔊 NOVO: Marcar que Charlotte está falando quando há áudio
          if (!this.isCharlotteSpeaking) {
            this.isCharlotteSpeaking = true;
            console.log('🗣️ [CHARLOTTE STATE] Charlotte started speaking (audio delta)');
          }
          
          // 🔧 Log silencioso para audio deltas (muito frequentes)
          if (Date.now() % 8000 < 100) { // Log ocasional para debug
            console.log('🔊 [AUDIO] Delta received (periodic log) - queue length:', this.audioQueue.length);
          }
          this.emit('audio_delta', event);
          if (event.delta) {
            this.playAudio(event.delta);
          }
          break;

        case 'response.audio.done':
          console.log('🔊 [FIXED] Audio response completed');
          
          // 🔧 WORKAROUND: Bug conhecido da OpenAI - áudio cortado no final
          // Adicionar delay para receber possíveis deltas finais
          // Baseado em: https://community.openai.com/t/realtime-api-audio-is-randomly-cutting-off-at-the-end/980587
          setTimeout(() => {
            // 🔊 NOVO: Marcar que Charlotte parou de falar
            this.isCharlotteSpeaking = false;
            this.hasActiveResponse = false;
            console.log('🔇 [CHARLOTTE STATE] Charlotte finished speaking (after delay)');
            
            this.emit('audio_done', event);
          }, 1000); // 1 segundo de delay para receber possíveis deltas finais
          break;

        case 'response.done':
          console.log('✅ [FIXED] Response completed');
          
          // 🔧 NOVO: Garantir que os estados sejam limpos
          this.isCharlotteSpeaking = false;
          this.hasActiveResponse = false;
          
          this.emit('response_done', event);
          break;

        case 'error':
          // 🔧 NOVO: Tratar erros específicos de cancelamento ANTES de qualquer log
          if (event.error?.code === 'response_cancel_not_active') {
            console.log('ℹ️ [INFO] Attempted to cancel non-active response - this is normal behavior');
            // Resetar estados para evitar inconsistências
            this.hasActiveResponse = false;
            this.isCharlotteSpeaking = false;
            // Não fazer NENHUM log de erro nem emitir evento
            break; // Sair completamente do case
          }
          
          // 🔧 NOVO: Outros erros conhecidos que podem ser tratados de forma menos intrusiva
          if (event.error?.code === 'cancelled') {
            console.log('ℹ️ [INFO] Request was cancelled - this is normal during interruptions');
            break; // Sair sem fazer log de erro
          }
          
          // ❌ Apenas para erros realmente problemáticos
          console.error('❌ [FIXED] API Error:', event.error);
          this.emit('error', event);
          break;

        default:
          // 🔧 Log silencioso para eventos não tratados (evitar spam)
          if (Date.now() % 10000 < 100) { // Log muito ocasional
            console.log('📨 [UNHANDLED] Event type:', event.type, '(periodic log)');
          }
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

    // 🔧 NOVO: Throttling - não enviar muito frequentemente
    const now = Date.now();
    if (now - this.lastAudioSendTime < this.audioSendThrottle) {
      return;
    }

    // 🔧 NOVO: Detectar se há áudio significativo
    const hasSignificantAudio = this.hasSignificantAudio(audioData);
    
    if (!hasSignificantAudio) {
      this.consecutiveSilenceFrames++;
      
      // Se temos muitos frames de silêncio consecutivos, parar de enviar
      if (this.consecutiveSilenceFrames > this.maxSilenceFrames) {
        return;
      }
    } else {
      // Reset contador de silêncio quando há áudio
      this.consecutiveSilenceFrames = 0;
    }

    try {
      const base64Audio = this.arrayBufferToBase64(audioData.buffer as ArrayBuffer);
      
      this.sendEvent({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      });
      
      this.lastAudioSendTime = now;
      
      // Log apenas ocasionalmente para evitar spam
      if (now % 1000 < this.audioSendThrottle) {
        console.log('📤 [OPTIMIZED] Audio sent - silence frames:', this.consecutiveSilenceFrames);
      }
    } catch (error) {
      console.error('❌ [FIXED] Error sending audio:', error);
    }
  }

  // 🔧 NOVO: Detectar se há áudio significativo
  private hasSignificantAudio(audioData: Int16Array): boolean {
    // Calcular RMS (Root Mean Square) para detectar nível de áudio
    let rms = 0;
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i] / 32768.0; // Normalizar para -1 a 1
      rms += sample * sample;
    }
    rms = Math.sqrt(rms / audioData.length);
    
    // Retornar true se o nível está acima do threshold
    return rms > this.silenceThreshold;
  }

  // 🔧 NOVO: Detectar se há áudio significativo no buffer acumulado
  private hasSignificantAudioInBuffer(): boolean {
    if (this.audioBuffer.length === 0) return false;
    
    let totalRms = 0;
    let totalSamples = 0;
    
    for (const chunk of this.audioBuffer) {
      for (let i = 0; i < chunk.length; i++) {
        totalRms += chunk[i] * chunk[i];
        totalSamples++;
      }
    }
    
    if (totalSamples === 0) return false;
    
    const rms = Math.sqrt(totalRms / totalSamples);
    return rms > this.silenceThreshold;
  }

  // 🔧 NOVO: Enviar buffer acumulado
  private flushAudioBuffer(): void {
    if (this.audioBuffer.length === 0) return;
    
    // Concatenar todos os chunks do buffer
    const totalSamples = this.audioBufferSize;
    const combinedBuffer = new Float32Array(totalSamples);
    
    let offset = 0;
    for (const chunk of this.audioBuffer) {
      combinedBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Converter para Int16 e enviar
    const int16Array = new Int16Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
      int16Array[i] = Math.max(-32768, Math.min(32767, combinedBuffer[i] * 32768));
    }
    
    this.sendAudioData(int16Array);
    
    // Limpar buffer
    this.audioBuffer = [];
    this.audioBufferSize = 0;
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
        // 🔧 WORKAROUND: Pequeno delay entre chunks para evitar cortes
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error('❌ [FIXED] Error playing audio chunk:', error);
      }
    }

    // 🔧 WORKAROUND: Delay adicional após processar toda a fila
    // para garantir que o último chunk seja reproduzido completamente
    await new Promise(resolve => setTimeout(resolve, 100));

    this.isPlayingAudio = false;
    console.log('🔊 [QUEUE] Audio queue processing completed');
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

  // 🔧 NOVO: Interrupção inteligente com verificação de estado
  interruptResponse(): void {
    console.log('🛑 [INTERRUPT DEBUG] interruptResponse() called');
    console.log('🛑 [INTERRUPT DEBUG] Service state:', {
      isConnected: this.isConnected,
      wsReadyState: this.ws?.readyState,
      isPlayingAudio: this.isPlayingAudio,
      currentAudioSource: !!this.currentAudioSource,
      isCharlotteSpeaking: this.isCharlotteSpeaking,
      hasActiveResponse: this.hasActiveResponse
    });
    
    // 🛑 NOVO: Só tentar cancelar se há resposta ativa
    if (!this.hasActiveResponse && !this.isCharlotteSpeaking) {
      console.log('🛑 [INTERRUPT DEBUG] No active response to cancel - skipping API call');
      // Ainda limpar buffers locais por segurança
      this.stopCurrentAudio();
      return;
    }
    
    // 🛑 NOVO: Parar áudio atual antes de cancelar resposta
    this.stopCurrentAudio();
    console.log('🛑 [INTERRUPT DEBUG] Audio stopped');
    
    // 🔧 NOVO: Ajustar temporariamente o VAD para ser menos sensível após interrupção
    this.adjustVADSensitivity('post_interruption');
    console.log('🛑 [INTERRUPT DEBUG] VAD adjusted for post-interruption');
    
    // 🛑 NOVO: Só enviar cancel se há resposta ativa
    if (this.hasActiveResponse) {
    this.sendEvent({
      type: 'response.cancel'
    });
    console.log('🛑 [INTERRUPT DEBUG] response.cancel sent to API');
    }
    
    // 🛑 NOVO: Resetar estados
    this.hasActiveResponse = false;
    this.isCharlotteSpeaking = false;
    
    // 🔧 NOVO: Restaurar VAD após um tempo
    setTimeout(() => {
      console.log('🛑 [INTERRUPT DEBUG] Restoring normal VAD sensitivity');
      this.adjustVADSensitivity('normal');
    }, 2000);
  }

  // 🔧 ATUALIZADO: Ajustar sensibilidade do VAD dinamicamente (simplificado)
  private adjustVADSensitivity(mode: 'normal' | 'post_interruption' | 'sensitive' | 'short_words'): void {
    let vadConfig;
    
    console.log(`🔧 [VAD] Adjusting VAD mode to: ${mode} (User level: ${this.config.userLevel})`);
    
    switch (mode) {
      case 'short_words':
        // Para palavras curtas, usar VAD mais sensível
        vadConfig = {
          type: 'server_vad',
          threshold: 0.2, // Muito sensível para capturar palavras curtas
          prefix_padding_ms: 150,
          silence_duration_ms: 300,
          create_response: true
        };
        console.log('🔧 [VAD] Using sensitive VAD for short words detection');
        break;
        
      case 'post_interruption':
        // Após interrupção, VAD um pouco menos sensível temporariamente
        vadConfig = {
          type: 'server_vad',
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 500,
          create_response: true
        };
        console.log('🔧 [VAD] Using post-interruption VAD (temporarily less sensitive)');
        break;
        
      case 'sensitive':
        // VAD sensível geral
        vadConfig = {
          type: 'server_vad',
          threshold: 0.3,
          prefix_padding_ms: 150,
          silence_duration_ms: 350,
          create_response: true
        };
        console.log('🔧 [VAD] Using general sensitive VAD');
        break;
        
      default: // normal
        // VAD ultra-responsivo baseado no nível do usuário (como ChatGPT)
        vadConfig = this.getVADConfigForUserLevel();
        console.log(`🔧 [VAD] Using ChatGPT-like VAD (${vadConfig.threshold} threshold) for ${this.config.userLevel} level`);
    }
    
    console.log(`🔧 [VAD] Sending session update with VAD config:`, vadConfig);
    
    this.sendEvent({
      type: 'session.update',
      session: {
        turn_detection: vadConfig
      }
    });
  }

  // 🔧 ATUALIZADO: Detectar palavras curtas e ajustar VAD (simplificado - sem comandos específicos)
  private handleShortWordDetection(transcript: string): void {
    // Lista expandida de palavras curtas comuns em inglês
    const shortWords = [
      // Respostas básicas
      'yes', 'no', 'ok', 'okay', 'yeah', 'yep', 'nah', 'nope',
      // Cumprimentos
      'hi', 'hey', 'hello', 'bye', 'goodbye',
      // Confirmações
      'sure', 'right', 'correct', 'wrong', 'true', 'false',
      // Avaliações
      'good', 'bad', 'great', 'nice', 'cool', 'wow',
      // Números básicos
      'one', 'two', 'three', 'four', 'five',
      // Palavras de hesitação (importantes para estudantes)
      'um', 'uh', 'er', 'hmm', 'well',
      // Comandos diversos (mantidos para referência)
      'stop', 'wait', 'pause', 'enough', 'done', 'finish'
    ];
    
    const words = transcript.toLowerCase().trim().split(/\s+/);
    const isShortResponse = words.length <= 2;
    const containsShortWord = words.some(word => shortWords.includes(word.replace(/[.,!?]/g, '')));
    
    // 📝 NOTA: Não precisamos mais de lógica especial para comandos de parada
    // porque agora qualquer fala interrompe imediatamente via speech_started
    
    if (isShortResponse && containsShortWord) {
      console.log(`🔧 [VAD] Short word/phrase detected: "${transcript}" - maintaining high sensitivity`);
      
      // Manter VAD sensível para palavras curtas
      this.adjustVADSensitivity('short_words');
      
      // Restaurar após tempo baseado no nível do usuário
      const restoreDelay = this.getRestoreDelayForUserLevel();
      setTimeout(() => {
        console.log(`🔧 [VAD] Restoring normal VAD after ${restoreDelay}ms`);
        this.adjustVADSensitivity('normal');
      }, restoreDelay);
    }
  }

  // 🔧 NOVO: Tempo de restauração baseado no nível do usuário
  private getRestoreDelayForUserLevel(): number {
    const delays = {
      'Novice': 8000,     // 8 segundos - mais tempo para iniciantes pensarem
      'Inter': 6000,      // 6 segundos - tempo moderado
      'Advanced': 4000    // 4 segundos - menos tempo para avançados
    };
    
    const delay = delays[this.config.userLevel] || delays['Inter'];
    console.log(`⏱️ [VAD] Restore delay for ${this.config.userLevel} level: ${delay}ms`);
    
    return delay;
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

  // 🛑 NOVO: Limpeza emergencial de todos os buffers para comandos de parada
  private emergencyClearAllBuffers(): void {
    console.log('🛑 [EMERGENCY] Clearing all audio buffers immediately');
    
    // Limpar buffer da API
    this.sendEvent({
      type: 'input_audio_buffer.clear'
    });
    
    // Limpar buffer interno
    this.audioBuffer = [];
    this.audioBufferSize = 0;
    this.consecutiveSilenceFrames = 0;
    
    // Limpar fila de reprodução
    this.audioQueue = [];
    
    // Parar áudio atual
    this.stopCurrentAudio();
    
    // Reset throttling para permitir comandos imediatos
    this.lastAudioSendTime = 0;
    
    // 🛑 NOVO: Limpar delta transcript acumulado
    this.currentTranscriptDelta = '';
    
    // 🛑 NOVO: Resetar estados de fala
    this.isCharlotteSpeaking = false;
    this.hasActiveResponse = false;
    
    console.log('🛑 [EMERGENCY] All buffers cleared successfully');
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
    
    // 🔧 NOVO: Limpar controles de otimização de áudio
    this.audioBuffer = [];
    this.audioBufferSize = 0;
    this.consecutiveSilenceFrames = 0;
    this.lastAudioSendTime = 0;
    
    // 🛑 NOVO: Limpar delta transcript acumulado
    this.currentTranscriptDelta = '';
    
    // 🛑 NOVO: Resetar estados de fala
    this.isCharlotteSpeaking = false;
    this.hasActiveResponse = false;
    
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
      
      // 🔧 NOVO: Primeiro tentar configurações básicas se as avançadas falharem
      let constraints: MediaStreamConstraints;
      
      try {
        // Tentar configurações avançadas primeiro
        constraints = {
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

        console.log('🎤 [FIXED] Trying advanced microphone configuration...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
      } catch (advancedError) {
        console.log('⚠️ [FIXED] Advanced config failed, trying basic configuration...');
        
        // Fallback para configurações básicas
        constraints = {
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };

        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (basicError) {
          console.log('⚠️ [FIXED] Basic config failed, trying minimal configuration...');
          
          // Último recurso - configuração mínima
          constraints = {
            audio: true
          };
          
          this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }
      
      console.log('✅ [FIXED] Microphone access granted');
      
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

        // 🔧 NOVO: Buffering inteligente - acumular dados antes de enviar
        this.audioBuffer.push(new Float32Array(inputData));
        this.audioBufferSize += inputData.length;
        
        // Enviar apenas quando o buffer estiver cheio ou houver áudio significativo
        if (this.audioBufferSize >= this.maxBufferSize || this.hasSignificantAudioInBuffer()) {
          this.flushAudioBuffer();
        }
      };

      console.log('✅ [FIXED] Microphone setup complete with advanced noise reduction');
      
    } catch (error: any) {
      console.error('❌ [FIXED] Error setting up microphone:', error);
      
      // 🔧 NOVO: Melhor tratamento de erros específicos
      if (error.name === 'NotFoundError') {
        throw new Error('Microfone não encontrado. Verifique se há um microfone conectado ao dispositivo.');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Permissão negada para acessar o microfone. Clique no ícone do microfone na barra de endereços e permita o acesso.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Microfone está sendo usado por outro aplicativo. Feche outros programas que possam estar usando o microfone.');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Configurações do microfone não suportadas. Tentando com configurações básicas...');
      } else {
        throw new Error(`Erro ao configurar microfone: ${error.message}`);
      }
    }
  }

  // 🔧 NOVO: Parar gravação
  private stopRecording(): void {
    if (this.isRecording) {
      this.isRecording = false;
      
      // 🔧 NOVO: Forçar envio do buffer restante antes de parar
      this.forceFlushAudioBuffer();
      
      console.log('🎤 [OPTIMIZED] Recording stopped and buffer flushed');
    }
  }

  // 🔧 NOVO: Verificar se o usuário ainda está falando
  private isUserStillSpeaking(): boolean {
    // Verificar se o usuário está atualmente falando e há tempo suficiente
    const speechDuration = Date.now() - this.userSpeechStartTime;
    const minSpeechDuration = 200; // Reduzido de 400ms para 200ms - mais responsivo para palavras como "Charlotte"
    
    const stillSpeaking = this.isUserCurrentlySpeaking && speechDuration >= minSpeechDuration;
    
    console.log(`🎤 [SPEECH CHECK] User speaking: ${this.isUserCurrentlySpeaking}, Duration: ${speechDuration}ms, Valid: ${stillSpeaking}`);
    
    return stillSpeaking;
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
      models: ['gpt-4o-mini-realtime-preview-2024-12-17'],
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