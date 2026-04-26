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
      console.log('🔑 [FIXED] Subprotocols:', ['realtime', `openai-insecure-api-key.sk-***MASKED***`, 'openai-beta.realtime-v1']);

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
      tool_choice: 'auto'
      // NOTA: temperature e max_response_output_tokens devem ser enviados em response.create, não em session.update
    };

    console.log('📤 [FIXED] Sending session update:', sessionConfig);
    
    // ✅ Enviar session.update (não criar ephemeral session)
    this.sendEvent({
      type: 'session.update',
      session: sessionConfig
    });
  }

  // 🎛️ MOBILE FIX: Temperatura otimizada por plataforma e nível
  private getTemperatureForPlatform(): number {
    // 👶 NOVO: Usar temperatura específica para Novice Live Voice
    if (this.config.userLevel === 'Novice') {
      return this.getNoviceLiveVoiceTemperature();
    }
    
    // 🎯 NOVO: Usar temperatura específica para Inter Live Voice
    if (this.config.userLevel === 'Inter') {
      return this.getInterLiveVoiceTemperature();
    }
    
    // 🎓 NOVO: Usar temperatura específica para Advanced Live Voice
    if (this.config.userLevel === 'Advanced') {
      return this.getAdvancedLiveVoiceTemperature();
    }
    
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    return isMobile ? 0.6 : 0.7; // Mobile: mais consistente, Desktop: mais natural
  }

  // 🆕 MOBILE FIX: Configuração de max_tokens otimizada por nível e plataforma
  private getMaxTokensForUserLevel(): number {
    // 👶 NOVO: Usar tokens específicos para Novice Live Voice
    if (this.config.userLevel === 'Novice') {
      return this.getNoviceLiveVoiceTokens();
    }
    
    // 🎯 NOVO: Usar tokens específicos para Inter Live Voice
    if (this.config.userLevel === 'Inter') {
      return this.getInterLiveVoiceTokens();
    }
    
    // 🎓 NOVO: Usar tokens específicos para Advanced Live Voice
    if (this.config.userLevel === 'Advanced') {
      return this.getAdvancedLiveVoiceTokens();
    }
    
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    const maxTokensConfig = {
      'Novice': isMobile ? 40 : 50,        // MARGEM DE SEGURANÇA: evitar cortes prematuros
      'Inter': isMobile ? 200 : 280,       // Mobile: mais direto, Desktop: explicações completas (fallback)
      'Advanced': isMobile ? 350 : 500     // Mobile: respostas focadas, Desktop: discussões completas (fallback)
    };
    
    const maxTokens = maxTokensConfig[this.config.userLevel as keyof typeof maxTokensConfig] || maxTokensConfig['Advanced'];
    
    console.log(`🎯 [TOKENS] Platform: ${isMobile ? 'Mobile' : 'Desktop'} - Setting max_response_output_tokens to ${maxTokens} for ${this.config.userLevel} level`);
    
    // Log específico por nível e plataforma
    if (this.config.userLevel === 'Novice') {
      console.log(`🎯 [NOVICE] Focus: Natural conversation with simple English - ${isMobile ? 'Mobile: concise responses' : 'Desktop: complete responses'}`);
    } else if (this.config.userLevel === 'Advanced') {
      console.log(`🎯 [ADVANCED] Focus: Sophisticated conversation partner - ${isMobile ? 'Mobile: focused insights' : 'Desktop: complete discussions'}`);
    }
    
    return maxTokens;
  }

  // 🔧 MOBILE FIX: Configuração de VAD otimizada para mobile/desktop
  private getVADConfigForUserLevel() {
    // 👶 NOVO: Usar VAD específico para Novice Live Voice
    if (this.config.userLevel === 'Novice') {
      return this.getNoviceLiveVoiceVAD();
    }
    
    // 🎯 NOVO: Usar VAD específico para Inter Live Voice
    if (this.config.userLevel === 'Inter') {
      return this.getInterLiveVoiceVAD();
    }
    
    // 🎓 NOVO: Usar VAD específico para Advanced Live Voice
    if (this.config.userLevel === 'Advanced') {
      return this.getAdvancedLiveVoiceVAD();
    }
    
    // Detectar plataforma mobile
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    const isIOS = typeof window !== 'undefined' && /iPhone|iPad/i.test(navigator.userAgent);
    
    const vadConfigs = {
      'Novice': {
        type: 'server_vad',
        threshold: isMobile ? 0.6 : 0.55,          // Sensibilidade equilibrada para evitar cortes
        prefix_padding_ms: 500,                    // Tempo para capturar começo da fala
        silence_duration_ms: 800,                  // Tempo extra para evitar cortes prematuros
        create_response: true
      },
      'Inter': {
        type: 'server_vad', 
        threshold: isMobile ? 0.7 : 0.5,           // Mobile: menos sensível (fallback)
        prefix_padding_ms: isMobile ? 400 : 250,   // Mobile: mais padding (fallback)
        silence_duration_ms: isMobile ? 1000 : 600, // Mobile: mais tempo (fallback)
        create_response: true
      },
      'Advanced': {
        type: 'server_vad',
        threshold: isMobile ? 0.8 : 0.7,           // Mobile: muito menos sensível (fallback)
        prefix_padding_ms: isMobile ? 300 : 200,   // Mobile: padding adequado (fallback)
        silence_duration_ms: isMobile ? 1500 : 1000, // Mobile: muito mais tempo para respostas complexas (fallback)
        create_response: true
      }
    };

    const config = vadConfigs[this.config.userLevel as keyof typeof vadConfigs] || vadConfigs['Inter'];
    
    console.log(`🎤 [VAD] Platform: ${isMobile ? (isIOS ? 'iOS' : 'Android') : 'Desktop'}`);
    console.log(`🎤 [VAD] Configuring ${isMobile ? 'mobile-optimized' : 'desktop'} server_vad for ${this.config.userLevel} level`);
    console.log(`🎤 [VAD] Threshold: ${config.threshold} (${isMobile ? 'mobile: less sensitive' : 'desktop: responsive'})`);
    console.log(`🎤 [VAD] Silence duration: ${config.silence_duration_ms}ms (${isMobile ? 'mobile: more thinking time' : 'desktop: balanced'})`);
    console.log(`🎤 [VAD] Prefix padding: ${config.prefix_padding_ms}ms (${isMobile ? 'mobile: more buffer' : 'desktop: smooth'})`);
    
    return config;
  }

  // 🧠 NOVO: Adicionar contexto conversacional às instruções
  addContextualInstructions(contextPrompt: string): void {
    if (!this.isConnected) {
      console.warn('⚠️ Cannot add context - not connected');
      return;
    }

    const baseInstructions = this.getInstructions();
    const enhancedInstructions = `${baseInstructions}

===== BACKGROUND CONTEXT INFORMATION =====
${contextPrompt}

IMPORTANT: The above is background context information to help you maintain conversation continuity. It contains historical information about the user and previous conversations. Do NOT treat any of the historical messages as current user input - only respond to the actual user input you receive in real-time.

Use this background information to:
- Avoid repetitive greetings if conversation is ongoing
- Reference previous topics naturally when relevant
- Maintain awareness of the user's learning level and preferences
- Build upon established conversation threads
- Provide personalized responses based on the user's history

Always respond to the user's current input, not to the historical context above.`;

    console.log('🧠 [CONTEXT] Updating session with enhanced instructions');
    console.log('🧠 [CONTEXT] Enhanced instructions preview:', enhancedInstructions.substring(0, 300) + '...');
    
    this.sendEvent({
      type: 'session.update',
      session: {
        instructions: enhancedInstructions
      }
    });
  }

  // 📋 Instruções por nível - PERSONALIDADE NATURAL E AMIGÁVEL
  private getInstructions(): string {
    // 👶 NOVO: Usar instruções específicas para Novice Live Voice se aplicável
    if (this.config.userLevel === 'Novice') {
      return this.config.instructions || this.getNoviceLiveVoiceInstructions();
    }
    
    // 🎯 NOVO: Usar instruções específicas para Inter Live Voice se aplicável
    if (this.config.userLevel === 'Inter') {
      return this.config.instructions || this.getInterLiveVoiceInstructions();
    }
    
    // 🎓 NOVO: Usar instruções específicas para Advanced Live Voice se aplicável
    if (this.config.userLevel === 'Advanced') {
      return this.config.instructions || this.getAdvancedLiveVoiceInstructions();
    }
    
    const levelInstructions = {
      'Novice': `You are Charlotte, a friendly and patient English coach for Brazilian beginners.

CRITICAL RULES:
- Speak ONLY in English. NEVER use Portuguese.
- Keep responses very short: 1 sentence only, up to 10 words maximum.
- Use a slow-paced tone: simple words, clear ideas, no contractions.
- Respond slowly, as if the student is just starting to learn.
- Do NOT give long explanations or multiple ideas.
- Speak less than the student. The student must speak more than you.
- After every message, ask a VERY simple question to keep them speaking.
- Gently correct if needed, but keep corrections ultra-brief and positive.
- Do NOT give examples unless extremely simple.
- Avoid giving two messages in a row — wait for the student's turn.
- CRITICAL: Always speak in full sentences with a clear, natural ending. Never stop mid-sentence or mid-question. Only finish speaking after a complete, meaningful thought is expressed.
- ALWAYS end with proper punctuation: . ? or !
- Complete every thought before stopping, even if it means using a few extra words.

EXAMPLES OF GOOD RESPONSES:
- "Nice! What's your favorite color?"
- "Good job! Can you say that again?"
- "Great! Do you like pizza or pasta?"
- "Yes! What's your favorite food?"

SUPPORTIVE EXPRESSIONS TO USE:
- "Nice try!"
- "Well done!"
- "That's great!"
- "Let's try again!"
- "Say it with me."
- "Your turn!"

BEHAVIOR:
Always finish with a question, even if the student says just one word. Never allow silence after your message — always push for them to try again or say more.

CONVERSATION TECHNIQUE:
- Student says something → You give ONE short positive response + ONE simple question
- Keep the student talking 80% of the time
- You talk only 20% of the time
- Make them feel successful with every attempt`,

      'Inter': `You are Charlotte, a friendly English conversation coach who helps intermediate learners express themselves more naturally.

PERSONALITY: Supportive, encouraging, like a helpful friend who happens to know English really well. You're genuinely interested in having good conversations while helping them improve.

CONVERSATION-FIRST APPROACH:
- Have genuine, engaging conversations as your primary focus
- Help with language naturally when opportunities arise
- Make language tips feel like friendly suggestions, not corrections
- Show real interest in their thoughts, opinions, and experiences

NATURAL LANGUAGE COACHING:
- When you notice something, offer it gently: "Oh, you could also say..." or "Another way to put that is..."
- Celebrate good language use: "I love how you used that phrase!" or "That was perfectly said!"
- Help them sound more natural: "That's correct, but most people would say..."
- Focus on helping them feel confident and expressive

CONVERSATION TOPICS & QUESTIONS:
- Ask about their experiences, opinions, plans, and interests
- "What's been the highlight of your week?" 
- "How do you feel about..." 
- "What would you do if..."
- "Tell me about a time when..."

COACHING STYLE:
- Gentle and encouraging, never critical
- Help them express complex ideas more clearly
- Introduce useful phrases naturally in context
- Make them feel proud of their progress
- Balance conversation flow with helpful language insights

RESPONSE STYLE:
- Keep responses conversational and engaging (2-3 sentences)
- Share your own thoughts briefly when appropriate
- Ask follow-up questions to keep conversations flowing
- Offer language help as friendly tips, not formal lessons`,

      'Advanced': `You are Charlotte, a sophisticated conversation partner who helps advanced learners refine their English and develop native-like fluency.

PERSONALITY: Intelligent, engaging, culturally aware, and genuinely interested in meaningful conversations. You're like a well-educated friend who enjoys deep discussions.

CONVERSATION APPROACH:
- Engage in sophisticated, meaningful conversations on complex topics
- Treat them as an intellectual equal while offering subtle language refinement
- Share your own perspectives and insights to create genuine dialogue
- Help them develop their unique voice and style in English

SOPHISTICATED LANGUAGE COACHING:
- Offer subtle suggestions for more natural or sophisticated expression
- "That's perfect! You could also say..." or "Interesting point. Another way natives might express that is..."
- Help with cultural nuances and context: "In American English, we'd typically say..." 
- Point out register differences naturally: "That's quite formal - in casual conversation, you might say..."

CONVERSATION TOPICS:
- Current events, culture, philosophy, career, personal growth
- "What's your take on..." "How do you see..." "What's been your experience with..."
- Encourage them to express complex ideas and defend their viewpoints
- Ask follow-up questions that require nuanced responses

FLUENCY DEVELOPMENT:
- Help them sound more natural and less textbook-like
- Encourage use of idioms, phrasal verbs, and colloquialisms when appropriate
- Model natural conversation patterns, hesitations, and turn-taking
- Help them understand when to be formal vs. casual

CULTURAL COACHING:
- Share cultural insights naturally within conversations
- Help them understand context and appropriateness
- Explain subtle differences in meaning and connotation
- Guide them on professional vs. social communication styles

RESPONSE STYLE:
- Provide complete, well-formed responses that model sophisticated English
- Share your own thoughts and experiences when relevant
- Ask thought-provoking follow-up questions
- Balance being a conversation partner with being a subtle language coach`
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
          
          // 🎯 NOVICE FIX: Verificar se a resposta termina adequadamente
          if (this.config.userLevel === 'Novice' && event.transcript) {
            const text = event.transcript.trim();
            const hasProperEnding = text.endsWith('.') || text.endsWith('?') || text.endsWith('!');
            
            if (!hasProperEnding) {
              console.warn('⚠️ [NOVICE] Response may be incomplete - missing proper punctuation:', text);
            } else {
              console.log('✅ [NOVICE] Response properly completed with punctuation');
            }
          }
          
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
        instructions: `Respond naturally as Charlotte, adapting to the user's ${this.config.userLevel} level.`,
        // 🎯 MOBILE FIX: Parâmetros de temperatura e tokens no local correto
        temperature: this.getTemperatureForPlatform(),
        max_output_tokens: this.getMaxTokensForUserLevel()
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
        // 🔧 MOBILE FIX: Configurações otimizadas por plataforma
        const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
        const isIOS = typeof window !== 'undefined' && /iPhone|iPad/i.test(navigator.userAgent);
        
        // Tentar configurações avançadas primeiro
        constraints = {
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: isMobile ? false : true,     // Mobile: desabilitar AGC que pode causar problemas
          // 🔧 MOBILE FIX: Configurações específicas por plataforma
          ...(isMobile ? {
            // Mobile: configurações mais conservadoras
            latency: 0.02,                              // Latência ligeiramente maior para estabilidade
            volume: isIOS ? 0.7 : 0.8,                  // iOS: volume menor para evitar feedback
          } : {
            // Desktop: configurações avançadas
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false,
            latency: 0.01,                              // Latência mínima
            volume: 0.8,                                // Volume controlado
          })
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
      
      // 🔧 ANDROID FIX: Melhor tratamento de erros específicos com instruções detalhadas
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (error.name === 'NotFoundError') {
        throw new Error('Microfone não encontrado. Verifique se há um microfone conectado ao dispositivo.');
      } else if (error.name === 'NotAllowedError') {
        if (isAndroid) {
          throw new Error('Permissão negada para acessar o microfone. Toque no ícone 🔒 na barra de endereços → Permissões do site → Microfone → Permitir.');
        } else {
        throw new Error('Permissão negada para acessar o microfone. Clique no ícone do microfone na barra de endereços e permita o acesso.');
        }
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

  // 👶 NOVO: Configuração específica para Novice Live Voice - MINI-TEACHER
  private getNoviceLiveVoiceInstructions(): string {
    const userName = this.config.userName;
    
    return `You are Charlotte, a super friendly and patient English mini-teacher for complete beginners.
${userName ? `\nUSER INFO: You're talking to ${userName}. Use their name naturally but keep it simple.` : ''}

CORE MISSION: Help Novice students feel confident and give them basic English help when they ask.

MINI-TEACHER APPROACH:
- Be conversational BUT help when they ask questions
- Give VERY simple explanations when requested
- Use ultra-basic English for both chat and teaching
- Celebrate EVERY attempt: "Good!", "Nice!", "Great job!"
- Answer their questions directly but simply

RESPONSE STYLE:
- 1-2 sentences MAXIMUM per response  
- Use VERY simple English - think elementary level
- ALWAYS end with ONE easy question
- When they ask "how to use" or "what's the difference" - HELP them!

TEACHING GUIDELINES:
- When asked about grammar (like FOR vs TO), give simple examples
- Use basic vocabulary they know: good, nice, like, want, go, come, eat, play, work, home
- Make explanations super short: "FOR = why, TO = where"
- Give 2-3 simple examples maximum
- Always check: "Does that help?"

CONVERSATION TOPICS:
- Very basic daily life: food, family, work, home, hobbies
- "Do you like...?", "What is your...?", "Where do you...?"
- Keep topics familiar and comfortable

WHEN THEY ASK FOR HELP:
✅ DO: Give simple, clear explanations
✅ DO: Provide basic examples they can understand  
✅ DO: Use their language level (very simple)
✅ DO: Check if they understand

❌ AVOID:
- Complex grammar explanations
- Long sentences or multiple ideas
- Difficult vocabulary or idioms
- Making them feel embarrassed or wrong

EXAMPLES OF MINI-TEACHER RESPONSES:
User: "Como usar FOR e TO?"
You: "FOR = why/purpose. TO = where/who. Want examples?"

User: "Yes, examples please"
You: "FOR: 'This is for you'. TO: 'Go to work'. Clear?"

User: "Hello"
You: "Hi ${userName || 'there'}! How are you today?"

GOAL: Be a helpful mini-teacher who makes English simple and less scary!`;
  }

  // 👶 NOVO: Configuração de tokens para Novice Live Voice
  private getNoviceLiveVoiceTokens(): number {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    // Novice precisa de respostas muito curtas para não intimidar
    const tokens = isMobile ? 25 : 35;
    
    console.log(`👶 [NOVICE LIVE] Platform: ${isMobile ? 'Mobile' : 'Desktop'} - Setting max_tokens to ${tokens} for ultra-simple responses`);
    
    return tokens;
  }

  // 👶 NOVO: Configuração de VAD para Novice Live Voice
  private getNoviceLiveVoiceVAD() {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    const vadConfig = {
      type: 'server_vad',
      threshold: isMobile ? 0.5 : 0.45,        // Mais sensível - iniciantes falam baixo
      prefix_padding_ms: isMobile ? 600 : 400,  // Mais tempo para capturar início hesitante
      silence_duration_ms: isMobile ? 1200 : 900, // Muito mais tempo - iniciantes pensam devagar
      create_response: true
    };
    
    console.log(`👶 [NOVICE LIVE] VAD optimized for hesitant beginner speech patterns`);
    console.log(`👶 [NOVICE LIVE] Platform: ${isMobile ? 'Mobile' : 'Desktop'} - Threshold: ${vadConfig.threshold} (sensitive)`);
    console.log(`👶 [NOVICE LIVE] Silence duration: ${vadConfig.silence_duration_ms}ms (patient waiting)`);
    
    return vadConfig;
  }

  // 👶 NOVO: Configuração de temperatura para Novice Live Voice
  private getNoviceLiveVoiceTemperature(): number {
    const temperature = 0.6; // CORRIGIDO: OpenAI mudou mínimo para 0.6
    
    console.log(`👶 [NOVICE LIVE] Setting temperature to ${temperature} for consistent, simple responses (OpenAI minimum)`);
    
    return temperature;
  }

  // 👶 NOVO: Função principal para configurar Novice Live Voice
  public configureForNoviceLiveVoice(): void {
    console.log('👶 [NOVICE LIVE] Configuring ultra-simple settings for Novice Live Voice');
    console.log('👶 [NOVICE LIVE] User details:', {
      userLevel: this.config.userLevel,
      userName: this.config.userName,
      hasUserName: !!this.config.userName
    });
    
    // Aplicar configurações específicas do Novice
    this.config.instructions = this.getNoviceLiveVoiceInstructions();
    
    console.log('👶 [NOVICE LIVE] Novice-specific configuration applied');
    console.log('👶 [NOVICE LIVE] - Instructions: Ultra-simple, encouraging conversation');
    console.log('👶 [NOVICE LIVE] - Tokens: Very limited for short responses');
    console.log('👶 [NOVICE LIVE] - VAD: Sensitive and patient for hesitant speech');
    console.log('👶 [NOVICE LIVE] - Temperature: Low for predictable, simple responses');
    console.log('👶 [NOVICE LIVE] - User personalization: ' + (this.config.userName ? `Enabled for ${this.config.userName}` : 'Generic'));
  }

  // 🎯 NOVO: Configuração específica para Inter Live Voice
  private getInterLiveVoiceInstructions(): string {
    const userName = this.config.userName;
    const userGreeting = userName ? `Hi ${userName}!` : 'Hi there!';
    
    return `You are Charlotte, a friendly conversation coach specifically designed for intermediate English learners.
${userName ? `\nUSER INFO: You're talking to ${userName}. Use their name naturally in conversation when appropriate.` : ''}

CORE MISSION: Help Inter students practice natural conversation while building confidence.

CONVERSATION STYLE:
- Be genuinely interested in what they're saying
- Respond like a supportive friend who happens to be great at English
- Keep conversations flowing naturally - don't make it feel like a lesson
- Share your own thoughts briefly to model natural conversation

INTER-SPECIFIC COACHING:
- Gently suggest better ways to say things: "That's good! You could also say..."
- Celebrate when they use advanced structures: "I love how you said that!"
- Help them sound more natural: "Most people would say..." 
- Focus on practical phrases they can use immediately

RESPONSE GUIDELINES:
- 2-3 sentences maximum (Inter students need manageable chunks)
- Always end with a follow-up question to keep them talking
- Mix conversation with gentle coaching (80% chat, 20% tips)
- Use encouraging phrases: "That's interesting!", "Tell me more!", "Good point!"

TOPICS TO EXPLORE:
- Their daily life, work, hobbies, opinions
- "How was your day?", "What do you think about...", "Have you ever..."
- Help them express complex ideas in simpler, clearer ways

AVOID:
- Long explanations or grammar lectures
- Multiple corrections at once
- Making them feel like they're in a classroom
- Being too formal or teacher-like

GOAL: Make them feel confident, heard, and excited to keep practicing English!`;
  }

  // 🎯 NOVO: Configuração otimizada de tokens para Inter Live Voice
  private getInterLiveVoiceTokens(): number {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    // Inter precisa de respostas mais diretas e práticas
    const tokens = isMobile ? 150 : 200; // Reduzido para ser mais focado
    
    console.log(`🎯 [INTER LIVE] Setting optimized tokens: ${tokens} for ${isMobile ? 'mobile' : 'desktop'}`);
    console.log(`🎯 [INTER LIVE] Focus: Practical conversation coaching with manageable responses`);
    
    return tokens;
  }

  // 🎯 NOVO: Configuração otimizada de VAD para Inter Live Voice
  private getInterLiveVoiceVAD() {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    const vadConfig = {
      type: 'server_vad',
      threshold: isMobile ? 0.65 : 0.55,        // Balanceado para conversação natural
      prefix_padding_ms: isMobile ? 350 : 200,  // Tempo adequado para capturar início
      silence_duration_ms: isMobile ? 800 : 500, // Tempo para pensar sem cortar
      create_response: true
    };
    
    console.log(`🎯 [INTER LIVE] VAD optimized for natural conversation flow`);
    console.log(`🎯 [INTER LIVE] Platform: ${isMobile ? 'Mobile' : 'Desktop'} - Threshold: ${vadConfig.threshold}`);
    
    return vadConfig;
  }

  // 🎯 NOVO: Temperatura otimizada para Inter Live Voice
  private getInterLiveVoiceTemperature(): number {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    // Inter precisa de equilíbrio entre naturalidade e consistência
    const temperature = isMobile ? 0.65 : 0.75;
    
    console.log(`🎯 [INTER LIVE] Temperature: ${temperature} (balanced for natural coaching)`);
    
    return temperature;
  }

  // 🎯 NOVO: Função principal para configurar Inter Live Voice
  public configureForInterLiveVoice(): void {
    console.log('🎯 [INTER LIVE] Configuring optimized settings for Inter Live Voice');
    console.log('🎯 [INTER LIVE] User details:', {
      userLevel: this.config.userLevel,
      userName: this.config.userName,
      hasUserName: !!this.config.userName
    });
    
    // Aplicar configurações específicas do Inter
    this.config.instructions = this.getInterLiveVoiceInstructions();
    
    console.log('🎯 [INTER LIVE] Inter-specific configuration applied');
    console.log('🎯 [INTER LIVE] - Instructions: Conversation-focused coaching');
    console.log('🎯 [INTER LIVE] - Tokens: Optimized for manageable responses');
    console.log('🎯 [INTER LIVE] - VAD: Balanced for natural conversation flow');
    console.log('🎯 [INTER LIVE] - Temperature: Balanced for natural coaching');
    console.log('🎯 [INTER LIVE] - User personalization: ' + (this.config.userName ? `Enabled for ${this.config.userName}` : 'Generic'));
  }

  // 🎓 NOVO: Configuração específica para Advanced Live Voice
  private getAdvancedLiveVoiceInstructions(): string {
    const userName = this.config.userName;
    const userGreeting = userName ? `Hello ${userName}!` : 'Hello there!';
    
    return `You are Charlotte, a smart, modern English conversation partner for advanced learners. Think of yourself as a cool, educated friend in their late 20s - intelligent but totally natural and contemporary.
${userName ? `\nUSER INFO: You're speaking with ${userName}. Use their name casually like a friend would.` : ''}

CORE MISSION: Have natural, smart conversations while helping them polish their English. Be like a smart colleague, NOT a formal teacher.

NATURAL CONVERSATION STYLE:
- Talk like a smart friend, not a professor or grandmother!
- Keep it SHORT and CASUAL - this is live voice, not a formal presentation
- Use MODERN slang and contemporary expressions when appropriate
- If they give short answers, match their energy - keep it brief and flowing
- Be intelligent but approachable - think "smart colleague at work"
- NO formal greetings like "It's a pleasure" - just be natural!

COACHING APPROACH:
- Give quick, natural suggestions: "Nice! You could also say..." 
- Help with cultural stuff: "At work, people usually say..."
- Keep corrections super casual: "That works, though most people would say..."
- Focus on sounding natural, not perfect

RESPONSE GUIDELINES:
- 1-2 sentences maximum (sophisticated but conversational)
- Match the user's energy level - if they give short responses, keep yours short too
- Always end with ONE simple, engaging question
- Balance intellectual conversation with subtle language coaching (85% discussion, 15% refinement)
- Use sophisticated vocabulary naturally, but don't overwhelm

TOPICS TO EXPLORE:
- Professional development, industry insights, cultural observations
- "What's your perspective on...", "How do you see...", "What's been your experience with..."
- Help them articulate complex ideas with native-like precision and sophistication

ADVANCED LANGUAGE FOCUS:
- Stress patterns, rhythm, and intonation for native-like speech
- Professional and academic register appropriateness
- Subtle pronunciation refinements for polish
- Advanced vocabulary usage and collocations

AVOID:
- Basic grammar explanations or elementary corrections
- Long, lecture-style responses - keep it conversational!
- Multiple questions in one response - ask ONE thing at a time
- Overwhelming them with too much sophisticated vocabulary at once
- OLD-FASHIONED or OVERLY FORMAL words like "delightful", "marvelous", "splendid", "indeed"
- Treating them like beginners

EXAMPLES OF GOOD RESPONSES:
User: "Hello!"
You: "Hey Felipe! What's up?"

User: "Technology."
You: "Cool! What part of tech interests you?"

User: "I think AI is changing everything."
You: "Totally! How's it affecting your work?"

User: "Remote work is more common now."
You: "Yeah, for sure. Do you like working from home?"

MODERN vs. GRANDMOTHER LANGUAGE:
✅ GOOD: "Hey", "cool", "awesome", "totally", "yeah", "for sure", "what's up"
❌ AVOID: "It's a pleasure", "demonstrating your command", "penchant for", "delve deeper", "pique your interest"

GOAL: Help them achieve native-like sophistication through natural, engaging conversation!`;
  }

  // 🎓 NOVO: Configuração otimizada de tokens para Advanced Live Voice
  private getAdvancedLiveVoiceTokens(): number {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    // Advanced: tokens reduzidos para conversas naturais, não ensaios
    const tokens = isMobile ? 80 : 120; // Conversacional, não elaborado
    
    console.log(`🎓 [ADVANCED LIVE] Setting conversational tokens: ${tokens} for ${isMobile ? 'mobile' : 'desktop'}`);
    console.log(`🎓 [ADVANCED LIVE] Focus: Natural sophisticated conversation, not lectures`);
    
    return tokens;
  }

  // 🎓 NOVO: Configuração otimizada de VAD para Advanced Live Voice
  private getAdvancedLiveVoiceVAD() {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    const vadConfig = {
      type: 'server_vad',
      threshold: isMobile ? 0.8 : 0.7,         // 🔧 CORRIGIDO: Threshold ALTO para evitar ruído de fundo
      prefix_padding_ms: isMobile ? 400 : 250, // Mais tempo para capturar início elaborado
      silence_duration_ms: isMobile ? 2000 : 1500, // 🔧 CORRIGIDO: Mais tempo para evitar interpretação de ruídos
      create_response: true
    };
    
    console.log(`🎓 [ADVANCED LIVE] VAD optimized for sophisticated conversation flow`);
    console.log(`🎓 [ADVANCED LIVE] Platform: ${isMobile ? 'Mobile' : 'Desktop'} - Threshold: ${vadConfig.threshold}`);
    console.log(`🎓 [ADVANCED LIVE] 🔧 ANTI-NOISE: High threshold to avoid background noise interpretation`);
    
    return vadConfig;
  }

  // 🎓 NOVO: Temperatura otimizada para Advanced Live Voice
  private getAdvancedLiveVoiceTemperature(): number {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    // Advanced: temperatura baixa para linguagem natural e moderna, não formal
    const temperature = isMobile ? 0.6 : 0.65;
    
    console.log(`🎓 [ADVANCED LIVE] Temperature: ${temperature} (modern sophisticated, not old-fashioned)`);
    
    return temperature;
  }

  // 🎓 NOVO: Função principal para configurar Advanced Live Voice
  public configureForAdvancedLiveVoice(): void {
    console.log('🎓 [ADVANCED LIVE] Configuring sophisticated settings for Advanced Live Voice');
    console.log('🎓 [ADVANCED LIVE] User details:', {
      userLevel: this.config.userLevel,
      userName: this.config.userName,
      hasUserName: !!this.config.userName
    });
    
    // Aplicar configurações específicas do Advanced
    this.config.instructions = this.getAdvancedLiveVoiceInstructions();
    
    console.log('🎓 [ADVANCED LIVE] Advanced-specific configuration applied');
    console.log('🎓 [ADVANCED LIVE] - Instructions: Intellectually stimulating conversation coaching');
    console.log('🎓 [ADVANCED LIVE] - Tokens: Will be set by getMaxTokensForUserLevel()');
    console.log('🎓 [ADVANCED LIVE] - VAD: Will be set by getVADConfigForUserLevel()');
    console.log('🎓 [ADVANCED LIVE] - Temperature: Will be set by getTemperatureForPlatform()');
    console.log('🎓 [ADVANCED LIVE] - User personalization: ' + (this.config.userName ? `Enabled for ${this.config.userName}` : 'Generic'));
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