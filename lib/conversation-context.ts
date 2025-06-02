// lib/conversation-context.ts - Sistema de Contexto Conversacional

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'audio';
  timestamp: Date;
  grammarScore?: number;
  topics?: string[];
}

export interface ConversationState {
  messages: ConversationMessage[];
  currentTopics: string[];
  userPreferences: {
    level: 'Novice' | 'Inter' | 'Advanced';
    name: string;
    language: 'en' | 'pt' | 'mixed';
  };
  conversationFlow: {
    lastGreeting?: Date;
    questionsAsked: string[];
    topicsDiscussed: string[];
    conversationStage: 'greeting' | 'ongoing' | 'deep_discussion' | 'wrap_up';
  };
  sessionStats: {
    messageCount: number;
    averageGrammarScore: number;
    totalXP: number;
    startTime: Date;
  };
}

export class ConversationContextManager {
  private context: ConversationState;
  private readonly MAX_CONTEXT_MESSAGES = 10;
  private readonly GREETING_COOLDOWN = 30 * 60 * 1000; // 30 minutos

  constructor(userLevel: 'Novice' | 'Inter' | 'Advanced', userName: string) {
    this.context = {
      messages: [],
      currentTopics: [],
      userPreferences: {
        level: userLevel,
        name: userName,
        language: userLevel === 'Novice' ? 'mixed' : 'en'
      },
      conversationFlow: {
        questionsAsked: [],
        topicsDiscussed: [],
        conversationStage: 'greeting'
      },
      sessionStats: {
        messageCount: 0,
        averageGrammarScore: 0,
        totalXP: 0,
        startTime: new Date()
      }
    };
  }

  // 📝 Adicionar mensagem ao contexto
  addMessage(
    role: 'user' | 'assistant',
    content: string,
    type: 'text' | 'audio',
    grammarScore?: number,
    topics?: string[]
  ) {
    const message: ConversationMessage = {
      role,
      content,
      type,
      timestamp: new Date(),
      grammarScore,
      topics
    };

    this.context.messages.push(message);
    
    // Manter apenas as últimas mensagens
    if (this.context.messages.length > this.MAX_CONTEXT_MESSAGES) {
      this.context.messages = this.context.messages.slice(-this.MAX_CONTEXT_MESSAGES);
    }

    // Atualizar estatísticas
    this.updateSessionStats(grammarScore);
    
    // Atualizar tópicos e estágio da conversa
    this.updateConversationFlow(content, role, topics);
  }

  // 📊 Atualizar estatísticas da sessão
  private updateSessionStats(grammarScore?: number) {
    this.context.sessionStats.messageCount++;
    
    if (grammarScore) {
      const currentAvg = this.context.sessionStats.averageGrammarScore;
      const count = this.getGrammarScoreCount();
      this.context.sessionStats.averageGrammarScore = 
        (currentAvg * (count - 1) + grammarScore) / count;
    }
  }

  // 🔄 Atualizar fluxo da conversa
  private updateConversationFlow(content: string, role: 'user' | 'assistant', topics?: string[]) {
    // Detectar tópicos automaticamente
    const detectedTopics = this.extractTopics(content);
    
    if (topics) {
      this.context.currentTopics = [...new Set([...this.context.currentTopics, ...topics])];
    }
    
    if (detectedTopics.length > 0) {
      this.context.currentTopics = [...new Set([...this.context.currentTopics, ...detectedTopics])];
      this.context.conversationFlow.topicsDiscussed = [
        ...new Set([...this.context.conversationFlow.topicsDiscussed, ...detectedTopics])
      ];
    }

    // Atualizar estágio da conversa
    this.updateConversationStage();
  }

  // 🎯 Detectar tópicos na mensagem
  private extractTopics(content: string): string[] {
    const topicKeywords = {
      'work': ['work', 'job', 'career', 'business', 'office', 'company'],
      'study': ['study', 'school', 'university', 'learn', 'education', 'math', 'science'],
      'family': ['family', 'mother', 'father', 'sister', 'brother', 'parents'],
      'hobbies': ['hobby', 'music', 'sport', 'game', 'movie', 'book', 'travel'],
      'food': ['food', 'eat', 'restaurant', 'pizza', 'cook', 'dinner'],
      'technology': ['computer', 'phone', 'internet', 'AI', 'data', 'programming'],
      'future': ['future', 'plan', 'goal', 'dream', 'tomorrow', 'next']
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

  // 📈 Atualizar estágio da conversa
  private updateConversationStage() {
    const messageCount = this.context.messages.length;
    const topicCount = this.context.conversationFlow.topicsDiscussed.length;

    if (messageCount <= 2) {
      this.context.conversationFlow.conversationStage = 'greeting';
    } else if (messageCount <= 6 || topicCount <= 1) {
      this.context.conversationFlow.conversationStage = 'ongoing';
    } else if (topicCount >= 2) {
      this.context.conversationFlow.conversationStage = 'deep_discussion';
    }
  }

  // 🎭 Gerar contexto para o assistant
  generateContextForAssistant(): string {
    const recentMessages = this.context.messages.slice(-6);
    const stage = this.context.conversationFlow.conversationStage;
    const topics = this.context.currentTopics;
    const userName = this.context.userPreferences.name;

    let contextPrompt = `CONVERSATION CONTEXT:
- User: ${userName} (${this.context.userPreferences.level} level)
- Stage: ${stage}
- Current topics: ${topics.join(', ') || 'general conversation'}
- Messages in session: ${this.context.sessionStats.messageCount}
- Average grammar: ${Math.round(this.context.sessionStats.averageGrammarScore)}/100

RECENT CONVERSATION:
${recentMessages.map(msg => 
  `${msg.role}: "${msg.content}" ${msg.grammarScore ? `(grammar: ${msg.grammarScore})` : ''}`
).join('\n')}

CONVERSATION GUIDELINES:
- DON'T repeat greetings if already done recently
- BUILD on previous topics: ${topics.slice(-2).join(', ')}
- Match conversation stage: ${this.getStageGuidelines(stage)}
- Keep natural flow, avoid repetitive phrases
- Reference previous messages when relevant`;

    return contextPrompt;
  }

  // 📋 Diretrizes por estágio
  private getStageGuidelines(stage: string): string {
    switch (stage) {
      case 'greeting':
        return 'Initial greeting and introduction';
      case 'ongoing':
        return 'Building conversation, asking follow-up questions';
      case 'deep_discussion':
        return 'Deep discussion on established topics, complex questions';
      case 'wrap_up':
        return 'Summarizing discussion, suggesting next steps';
      default:
        return 'Natural conversation flow';
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

  // 📊 Obter estatísticas
  getSessionStats() {
    return this.context.sessionStats;
  }

  // 🎯 Obter tópicos atuais
  getCurrentTopics() {
    return this.context.currentTopics;
  }

  // 📈 Contar scores de gramática
  private getGrammarScoreCount(): number {
    return this.context.messages.filter(msg => msg.grammarScore !== undefined).length;
  }

  // 🔄 Reset do contexto (nova sessão)
  resetContext() {
    this.context.messages = [];
    this.context.currentTopics = [];
    this.context.conversationFlow.questionsAsked = [];
    this.context.conversationFlow.topicsDiscussed = [];
    this.context.conversationFlow.conversationStage = 'greeting';
    this.context.sessionStats = {
      messageCount: 0,
      averageGrammarScore: 0,
      totalXP: 0,
      startTime: new Date()
    };
  }

  // 📤 Exportar contexto (para persistência)
  exportContext() {
    return JSON.stringify(this.context);
  }

  // 📥 Importar contexto (de persistência)
  importContext(contextJson: string) {
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