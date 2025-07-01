// lib/enhanced-conversation-context.ts - Sistema Avançado de Contexto Conversacional

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'audio' | 'live_voice';
  timestamp: Date;
  grammarScore?: number;
  pronunciationScore?: number;
  topics?: string[];
  subtopics?: string[];
  emotion?: EmotionalState;
  messageId: string;
}

export interface EmotionalState {
  primary: 'happy' | 'excited' | 'neutral' | 'frustrated' | 'confused' | 'tired' | 'motivated';
  intensity: number; // 0-1
  confidence: number; // 0-1
}

export interface UserPreferences {
  level: 'Novice' | 'Inter' | 'Advanced';
  name: string;
  language: 'en' | 'pt' | 'mixed';
  preferredTopics: string[];
  learningGoals: string[];
  communicationStyle: 'formal' | 'casual' | 'mixed';
  responseLength: 'short' | 'medium' | 'long';
  correctionStyle: 'gentle' | 'direct' | 'minimal';
}

export interface LongTermMemory {
  userId: string;
  totalSessions: number;
  favoriteTopics: { topic: string; frequency: number; lastMentioned: Date }[];
  learningProgress: {
    grammarImprovement: number[];
    pronunciationImprovement: number[];
    vocabularyGrowth: string[];
  };
  personalDetails: {
    job?: string;
    hobbies?: string[];
    family?: string[];
    goals?: string[];
    location?: string;
  };
  conversationPatterns: {
    preferredQuestionTypes: string[];
    responsePatterns: string[];
    engagementLevel: number;
  };
}

export interface ConversationState {
  messages: ConversationMessage[];
  currentTopics: string[];
  currentSubtopics: string[];
  currentEmotion: EmotionalState;
  userPreferences: UserPreferences;
  longTermMemory: LongTermMemory;
  conversationFlow: {
    lastGreeting?: Date;
    questionsAsked: string[];
    topicsDiscussed: string[];
    conversationStage: 'greeting' | 'ongoing' | 'deep_discussion' | 'wrap_up';
    sessionGoal?: string;
  };
  sessionStats: {
    messageCount: number;
    averageGrammarScore: number;
    averagePronunciationScore: number;
    totalXP: number;
    startTime: Date;
    modeUsage: { text: number; audio: number; live_voice: number };
  };
}

export class EnhancedConversationContextManager {
  private context: ConversationState;
  private readonly MAX_CONTEXT_MESSAGES = 15; // Aumentado para mais contexto
  private readonly GREETING_COOLDOWN = 30 * 60 * 1000; // 30 minutos
  private readonly PERSISTENCE_KEY_PREFIX = 'charlotte_context_';

  constructor(userLevel: 'Novice' | 'Inter' | 'Advanced', userName: string, userId?: string) {
    this.context = this.initializeContext(userLevel, userName, userId);
    this.loadPersistedContext(userId);
  }

  private initializeContext(userLevel: 'Novice' | 'Inter' | 'Advanced', userName: string, userId?: string): ConversationState {
    return {
      messages: [],
      currentTopics: [],
      currentSubtopics: [],
      currentEmotion: { primary: 'neutral', intensity: 0.5, confidence: 0.8 },
      userPreferences: {
        level: userLevel,
        name: userName,
        language: userLevel === 'Novice' ? 'mixed' : 'en',
        preferredTopics: [],
        learningGoals: [],
        communicationStyle: userLevel === 'Novice' ? 'casual' : 'mixed',
        responseLength: userLevel === 'Novice' ? 'short' : 'medium',
        correctionStyle: userLevel === 'Novice' ? 'gentle' : 'direct'
      },
      longTermMemory: {
        userId: userId || 'anonymous',
        totalSessions: 0,
        favoriteTopics: [],
        learningProgress: {
          grammarImprovement: [],
          pronunciationImprovement: [],
          vocabularyGrowth: []
        },
        personalDetails: {},
        conversationPatterns: {
          preferredQuestionTypes: [],
          responsePatterns: [],
          engagementLevel: 0.7
        }
      },
      conversationFlow: {
        questionsAsked: [],
        topicsDiscussed: [],
        conversationStage: 'greeting'
      },
      sessionStats: {
        messageCount: 0,
        averageGrammarScore: 0,
        averagePronunciationScore: 0,
        totalXP: 0,
        startTime: new Date(),
        modeUsage: { text: 0, audio: 0, live_voice: 0 }
      }
    };
  }

  // 💾 PERSISTÊNCIA - Carregar contexto salvo
  private loadPersistedContext(userId?: string) {
    if (!userId || typeof window === 'undefined') return;

    try {
      const persistenceKey = `${this.PERSISTENCE_KEY_PREFIX}${userId}`;
      const saved = localStorage.getItem(persistenceKey);
      
      if (saved) {
        const parsedContext = JSON.parse(saved);
        
        // Mesclar contexto salvo com contexto atual
        this.context.longTermMemory = {
          ...this.context.longTermMemory,
          ...parsedContext.longTermMemory
        };
        
        this.context.userPreferences = {
          ...this.context.userPreferences,
          ...parsedContext.userPreferences
        };

        // Incrementar sessões
        this.context.longTermMemory.totalSessions++;
        
        console.log('🧠 [MEMORY] Loaded persisted context:', {
          totalSessions: this.context.longTermMemory.totalSessions,
          favoriteTopics: this.context.longTermMemory.favoriteTopics.length,
          personalDetails: Object.keys(this.context.longTermMemory.personalDetails).length
        });
      }
    } catch (error) {
      console.error('❌ Error loading persisted context:', error);
    }
  }

  // 💾 PERSISTÊNCIA - Salvar contexto
  private saveContext() {
    if (!this.context.longTermMemory.userId || typeof window === 'undefined') return;

    try {
      const persistenceKey = `${this.PERSISTENCE_KEY_PREFIX}${this.context.longTermMemory.userId}`;
      const toSave = {
        longTermMemory: this.context.longTermMemory,
        userPreferences: this.context.userPreferences,
        lastSession: new Date()
      };
      
      localStorage.setItem(persistenceKey, JSON.stringify(toSave));
      console.log('💾 [MEMORY] Context saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving context:', error);
    }
  }

  // 📝 Adicionar mensagem ao contexto (UNIFICADO para todos os modos)
  addMessage(
    role: 'user' | 'assistant',
    content: string,
    type: 'text' | 'audio' | 'live_voice',
    grammarScore?: number,
    pronunciationScore?: number,
    topics?: string[]
  ) {
    const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Detectar emoção e tópicos
    const emotion = this.detectEmotion(content, role);
    const detectedTopics = this.extractTopics(content);
    const detectedSubtopics = this.extractSubtopics(content, detectedTopics);

    const message: ConversationMessage = {
      role,
      content,
      type,
      timestamp: new Date(),
      grammarScore,
      pronunciationScore,
      topics: topics || detectedTopics,
      subtopics: detectedSubtopics,
      emotion,
      messageId
    };

    this.context.messages.push(message);
    
    // Manter apenas as últimas mensagens
    if (this.context.messages.length > this.MAX_CONTEXT_MESSAGES) {
      this.context.messages = this.context.messages.slice(-this.MAX_CONTEXT_MESSAGES);
    }

    // Atualizar estatísticas por modo
    this.context.sessionStats.modeUsage[type]++;
    
    // Atualizar contexto
    this.updateSessionStats(grammarScore, pronunciationScore);
    this.updateConversationFlow(content, role, detectedTopics, detectedSubtopics);
    this.updateLongTermMemory(content, detectedTopics, emotion);
    this.updateCurrentEmotion(emotion);
    
    // Salvar contexto periodicamente
    if (this.context.messages.length % 5 === 0) {
      this.saveContext();
    }
  }

  // 🎭 DETECÇÃO EMOCIONAL
  private detectEmotion(content: string, role: 'user' | 'assistant'): EmotionalState {
    const lowerContent = content.toLowerCase();
    
    // Palavras-chave emocionais
    const emotionKeywords = {
      happy: ['happy', 'great', 'awesome', 'love', 'amazing', 'wonderful', 'excited', 'good', 'nice', 'cool'],
      excited: ['excited', 'can\'t wait', 'amazing', 'incredible', 'fantastic', 'wow'],
      frustrated: ['frustrated', 'difficult', 'hard', 'confused', 'don\'t understand', 'stuck'],
      confused: ['confused', 'don\'t know', 'not sure', 'what', 'how', 'help'],
      tired: ['tired', 'exhausted', 'sleepy', 'long day'],
      motivated: ['want to learn', 'practice', 'improve', 'goal', 'better']
    };

    let detectedEmotion: EmotionalState['primary'] = 'neutral';
    let maxScore = 0;

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.filter(keyword => lowerContent.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion as EmotionalState['primary'];
      }
    }

    return {
      primary: detectedEmotion,
      intensity: Math.min(maxScore * 0.3 + 0.3, 1),
      confidence: maxScore > 0 ? 0.8 : 0.5
    };
  }

  // 🎯 DETECÇÃO DE SUBTÓPICOS
  private extractSubtopics(content: string, mainTopics: string[]): string[] {
    const subtopicKeywords = {
      work: {
        'programming': ['code', 'programming', 'developer', 'software', 'app'],
        'teaching': ['teach', 'teacher', 'student', 'class', 'education'],
        'business': ['business', 'meeting', 'client', 'project', 'deadline'],
        'remote': ['remote', 'home', 'online', 'virtual']
      },
      hobbies: {
        'music': ['music', 'song', 'guitar', 'piano', 'band'],
        'sports': ['football', 'soccer', 'basketball', 'gym', 'exercise'],
        'travel': ['travel', 'trip', 'vacation', 'country', 'city'],
        'reading': ['book', 'read', 'novel', 'story'],
        'gaming': ['game', 'play', 'video game', 'console']
      },
      food: {
        'cooking': ['cook', 'recipe', 'kitchen', 'prepare'],
        'restaurants': ['restaurant', 'eat out', 'dinner'],
        'cuisine': ['pizza', 'pasta', 'chinese', 'italian', 'brazilian']
      }
    };

    const subtopics: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const mainTopic of mainTopics) {
      const topicSubtopics = subtopicKeywords[mainTopic as keyof typeof subtopicKeywords];
      if (topicSubtopics) {
        for (const [subtopic, keywords] of Object.entries(topicSubtopics)) {
          if (keywords.some(keyword => lowerContent.includes(keyword))) {
            subtopics.push(subtopic);
          }
        }
      }
    }

    return subtopics;
  }

  // 🎯 Detectar tópicos (melhorado)
  private extractTopics(content: string): string[] {
    const topicKeywords = {
      'work': ['work', 'job', 'career', 'business', 'office', 'company', 'colleague', 'boss', 'project'],
      'study': ['study', 'school', 'university', 'learn', 'education', 'math', 'science', 'course'],
      'family': ['family', 'mother', 'father', 'sister', 'brother', 'parents', 'children', 'wife', 'husband'],
      'hobbies': ['hobby', 'music', 'sport', 'game', 'movie', 'book', 'travel', 'photography'],
      'food': ['food', 'eat', 'restaurant', 'pizza', 'cook', 'dinner', 'lunch', 'breakfast'],
      'technology': ['computer', 'phone', 'internet', 'AI', 'data', 'programming', 'app', 'software'],
      'future': ['future', 'plan', 'goal', 'dream', 'tomorrow', 'next', 'want to', 'hope'],
      'health': ['health', 'doctor', 'exercise', 'gym', 'sick', 'medicine', 'hospital'],
      'transportation': ['car', 'bus', 'train', 'bike', 'motorbike', 'drive', 'travel'],
      'entertainment': ['movie', 'tv', 'show', 'music', 'concert', 'party', 'fun']
    };

    const topics: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  // 🧠 ATUALIZAR MEMÓRIA DE LONGO PRAZO
  private updateLongTermMemory(content: string, topics: string[], emotion: EmotionalState) {
    // Atualizar tópicos favoritos
    for (const topic of topics) {
      const existing = this.context.longTermMemory.favoriteTopics.find(ft => ft.topic === topic);
      if (existing) {
        existing.frequency++;
        existing.lastMentioned = new Date();
      } else {
        this.context.longTermMemory.favoriteTopics.push({
          topic,
          frequency: 1,
          lastMentioned: new Date()
        });
      }
    }

    // Extrair detalhes pessoais
    this.extractPersonalDetails(content);
    
    // Ordenar tópicos por frequência
    this.context.longTermMemory.favoriteTopics.sort((a, b) => b.frequency - a.frequency);
  }

  // 👤 EXTRAIR DETALHES PESSOAIS
  private extractPersonalDetails(content: string) {
    const lowerContent = content.toLowerCase();
    
    // Detectar trabalho
    if (lowerContent.includes('i work') || lowerContent.includes('my job')) {
      const jobKeywords = ['teacher', 'developer', 'engineer', 'doctor', 'student', 'manager'];
      for (const job of jobKeywords) {
        if (lowerContent.includes(job)) {
          this.context.longTermMemory.personalDetails.job = job;
          break;
        }
      }
    }

    // Detectar hobbies
    const hobbyKeywords = ['play', 'like to', 'enjoy', 'hobby'];
    if (hobbyKeywords.some(keyword => lowerContent.includes(keyword))) {
      const hobbies = ['music', 'sports', 'reading', 'cooking', 'traveling', 'gaming'];
      for (const hobby of hobbies) {
        if (lowerContent.includes(hobby)) {
          if (!this.context.longTermMemory.personalDetails.hobbies) {
            this.context.longTermMemory.personalDetails.hobbies = [];
          }
          if (!this.context.longTermMemory.personalDetails.hobbies.includes(hobby)) {
            this.context.longTermMemory.personalDetails.hobbies.push(hobby);
          }
        }
      }
    }
  }

  // 📊 Atualizar estatísticas da sessão
  private updateSessionStats(grammarScore?: number, pronunciationScore?: number) {
    this.context.sessionStats.messageCount++;
    
    if (grammarScore) {
      const currentAvg = this.context.sessionStats.averageGrammarScore;
      const count = this.getGrammarScoreCount();
      this.context.sessionStats.averageGrammarScore = 
        (currentAvg * (count - 1) + grammarScore) / count;
      
      // Adicionar ao progresso de longo prazo
      this.context.longTermMemory.learningProgress.grammarImprovement.push(grammarScore);
    }

    if (pronunciationScore) {
      const currentAvg = this.context.sessionStats.averagePronunciationScore;
      const count = this.getPronunciationScoreCount();
      this.context.sessionStats.averagePronunciationScore = 
        (currentAvg * (count - 1) + pronunciationScore) / count;
      
      // Adicionar ao progresso de longo prazo
      this.context.longTermMemory.learningProgress.pronunciationImprovement.push(pronunciationScore);
    }
  }

  // 🔄 Atualizar fluxo da conversa
  private updateConversationFlow(content: string, role: 'user' | 'assistant', topics: string[], subtopics: string[]) {
    if (topics.length > 0) {
      this.context.currentTopics = [...new Set([...this.context.currentTopics, ...topics])];
      this.context.conversationFlow.topicsDiscussed = [
        ...new Set([...this.context.conversationFlow.topicsDiscussed, ...topics])
      ];
    }

    if (subtopics.length > 0) {
      this.context.currentSubtopics = [...new Set([...this.context.currentSubtopics, ...subtopics])];
    }

    this.updateConversationStage();
  }

  // 😊 Atualizar emoção atual
  private updateCurrentEmotion(newEmotion: EmotionalState) {
    // Média ponderada entre emoção atual e nova
    const weight = 0.3;
    this.context.currentEmotion = {
      primary: newEmotion.confidence > this.context.currentEmotion.confidence ? newEmotion.primary : this.context.currentEmotion.primary,
      intensity: this.context.currentEmotion.intensity * (1 - weight) + newEmotion.intensity * weight,
      confidence: Math.max(this.context.currentEmotion.confidence, newEmotion.confidence)
    };
  }

  // 📈 Atualizar estágio da conversa
  private updateConversationStage() {
    const messageCount = this.context.messages.length;
    const topicCount = this.context.conversationFlow.topicsDiscussed.length;

    if (messageCount <= 2) {
      this.context.conversationFlow.conversationStage = 'greeting';
    } else if (messageCount <= 8 || topicCount <= 1) {
      this.context.conversationFlow.conversationStage = 'ongoing';
    } else if (topicCount >= 2) {
      this.context.conversationFlow.conversationStage = 'deep_discussion';
    }
  }

  // 🎭 Gerar contexto para o assistant (OTIMIZADO PARA CONTINUIDADE)
  generateContextForAssistant(): string {
    const recentMessages = this.context.messages.slice(-4); // Reduzido para focar no essencial
    const topics = this.context.currentTopics.slice(-2);
    const userName = this.context.userPreferences.name;
    const personalDetails = this.context.longTermMemory.personalDetails;

    console.log('🔍 [CONTEXT DEBUG] Values for context generation:', {
      userName,
      level: this.context.userPreferences.level,
      recentMessagesCount: recentMessages.length,
      topicsCount: topics.length
    });

    // 🎯 CONTEXTO CONCISO E DIRETO
    let contextPrompt = `CONVERSATION CONTEXT:
User: ${userName} (${this.context.userPreferences.level} level)`;

    // 📝 MENSAGENS RECENTES (essencial para continuidade)
    if (recentMessages.length > 0) {
      contextPrompt += `\n\nRECENT CONVERSATION:`;
      recentMessages.forEach(msg => {
        const speaker = msg.role === 'user' ? userName : 'You';
        contextPrompt += `\n${speaker}: "${msg.content}"`;
      });
    }

    // 🎯 TÓPICOS ATUAIS
    if (topics.length > 0) {
      contextPrompt += `\n\nCurrent topics: ${topics.join(', ')}`;
    }

    // 👤 DETALHES PESSOAIS RELEVANTES
    const personalInfo = Object.entries(personalDetails)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .slice(0, 3); // Máximo 3 detalhes

    if (personalInfo.length > 0) {
      contextPrompt += `\nUser details: ${personalInfo.join('; ')}`;
    }

    contextPrompt += `\n\nIMPORTANT: Continue the conversation naturally based on what was just said. Reference previous topics when relevant. Don't repeat greetings if already talking.`;

    return contextPrompt;
  }

  // 📋 Diretrizes por estágio (melhorado)
  private getStageGuidelines(stage: string): string {
    switch (stage) {
      case 'greeting':
        return 'Initial greeting, check if returning user with memory';
      case 'ongoing':
        return 'Building conversation, use personal details and favorite topics';
      case 'deep_discussion':
        return 'Deep discussion using long-term memory and emotional context';
      case 'wrap_up':
        return 'Summarizing, planning next session based on progress';
      default:
        return 'Natural conversation flow with memory integration';
    }
  }

  // 🔍 Verificar se precisa cumprimentar
  shouldGreet(): boolean {
    const lastGreeting = this.context.conversationFlow.lastGreeting;
    if (!lastGreeting) return true;
    
    const timeSinceGreeting = Date.now() - lastGreeting.getTime();
    return timeSinceGreeting > this.GREETING_COOLDOWN;
  }

  // 👋 Marcar cumprimento feito
  markGreetingDone() {
    this.context.conversationFlow.lastGreeting = new Date();
  }

  // 📋 NOVO: Obter mensagens recentes
  getRecentMessages(count: number = 5): ConversationMessage[] {
    return this.context.messages.slice(-count);
  }

  // 📊 Obter estatísticas completas
  getEnhancedStats() {
    return {
      session: this.context.sessionStats,
      longTerm: this.context.longTermMemory,
      currentEmotion: this.context.currentEmotion,
      preferences: this.context.userPreferences
    };
  }

  // 🎯 Obter tópicos e subtópicos atuais
  getCurrentTopicsAndSubtopics() {
    return {
      topics: this.context.currentTopics,
      subtopics: this.context.currentSubtopics,
      favoriteTopics: this.context.longTermMemory.favoriteTopics
    };
  }

  // 📈 Contar scores
  private getGrammarScoreCount(): number {
    return this.context.messages.filter(msg => msg.grammarScore !== undefined).length;
  }

  private getPronunciationScoreCount(): number {
    return this.context.messages.filter(msg => msg.pronunciationScore !== undefined).length;
  }

  // 🔄 Reset da sessão (mantém memória de longo prazo)
  resetSession() {
    this.context.messages = [];
    this.context.currentTopics = [];
    this.context.currentSubtopics = [];
    this.context.currentEmotion = { primary: 'neutral', intensity: 0.5, confidence: 0.8 };
    this.context.conversationFlow.questionsAsked = [];
    this.context.conversationFlow.conversationStage = 'greeting';
    this.context.sessionStats = {
      messageCount: 0,
      averageGrammarScore: 0,
      averagePronunciationScore: 0,
      totalXP: 0,
      startTime: new Date(),
      modeUsage: { text: 0, audio: 0, live_voice: 0 }
    };
    
    // Salvar contexto ao resetar
    this.saveContext();
  }

  // 🗑️ Limpar tudo (incluindo memória de longo prazo)
  clearAllMemory() {
    if (typeof window !== 'undefined' && this.context.longTermMemory.userId) {
      const persistenceKey = `${this.PERSISTENCE_KEY_PREFIX}${this.context.longTermMemory.userId}`;
      localStorage.removeItem(persistenceKey);
    }
    
    this.context = this.initializeContext(
      this.context.userPreferences.level,
      this.context.userPreferences.name,
      this.context.longTermMemory.userId
    );
  }

  // 📤 Exportar contexto completo
  exportFullContext() {
    return JSON.stringify(this.context);
  }

  // 📥 Importar contexto completo
  importFullContext(contextJson: string) {
    try {
      const imported = JSON.parse(contextJson);
      this.context = {
        ...this.context,
        ...imported,
        sessionStats: {
          ...this.context.sessionStats,
          ...imported.sessionStats,
          startTime: new Date(imported.sessionStats?.startTime || Date.now())
        }
      };
    } catch (error) {
      console.error('Error importing context:', error);
    }
  }
} 