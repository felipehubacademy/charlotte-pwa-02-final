// lib/grammar-analysis.ts - Serviço de Análise de Gramática Estruturada

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📝 Interfaces para Análise de Gramática
export interface GrammarError {
  type: 'spelling' | 'grammar' | 'punctuation' | 'word_order' | 'verb_tense' | 'article' | 'preposition' | 'vocabulary';
  original: string;
  correction: string;
  explanation: string;
  severity: 'minor' | 'moderate' | 'major';
  position?: {
    start: number;
    end: number;
  };
}

export interface GrammarAnalysis {
  text: string;
  overallScore: number; // 0-100
  errors: GrammarError[];
  strengths: string[];
  suggestions: string[];
  complexity: 'simple' | 'intermediate' | 'advanced';
  wordCount: number;
  sentenceCount: number;
  readabilityScore: number;
  levelAppropriate: boolean;
}

export interface GrammarFeedback {
  analysis: GrammarAnalysis;
  feedback: string;
  xpAwarded: number;
  encouragement: string;
  nextChallenge?: string;
}

// 🎯 Classe Principal de Análise de Gramática
export class GrammarAnalysisService {
  
  // 📊 Analisar texto e retornar análise estruturada
  async analyzeText(
    text: string, 
    userLevel: 'Novice' | 'Intermediate' | 'Advanced',
    userName?: string
  ): Promise<GrammarFeedback> {
    try {
      console.log('🔍 Starting grammar analysis for:', { text, userLevel, userName });

      // 1. Análise estruturada com OpenAI
      const analysis = await this.performGrammarAnalysis(text, userLevel);
      
      // 2. Calcular XP baseado na qualidade
      const xpAwarded = this.calculateGrammarXP(analysis, userLevel);
      
      // 3. Gerar feedback personalizado
      const feedback = await this.generatePersonalizedFeedback(analysis, userLevel, userName);
      
      // 4. Gerar encorajamento
      const encouragement = this.generateEncouragement(analysis.overallScore, userLevel);
      
      // 5. Sugerir próximo desafio
      const nextChallenge = this.generateNextChallenge(analysis, userLevel);

      console.log('✅ Grammar analysis completed:', {
        score: analysis.overallScore,
        errors: analysis.errors.length,
        xp: xpAwarded
      });

      return {
        analysis,
        feedback,
        xpAwarded,
        encouragement,
        nextChallenge
      };

    } catch (error) {
      console.error('❌ Grammar analysis failed:', error);
      
      // Fallback com análise básica
      return this.createFallbackAnalysis(text, userLevel, userName);
    }
  }

  // 🔬 Análise detalhada com OpenAI
  private async performGrammarAnalysis(
    text: string, 
    userLevel: string
  ): Promise<GrammarAnalysis> {
    
    const levelInstructions = {
      'Novice': 'Focus on basic grammar, simple sentence structure, and common vocabulary. Be very encouraging and explain concepts simply. Include Portuguese explanations when helpful.',
      'Intermediate': 'Analyze intermediate grammar, business English usage, and more complex sentence structures. Focus on practical communication skills.',
      'Advanced': 'Provide detailed analysis of advanced grammar, sophisticated vocabulary usage, and professional writing standards.'
    };

    const systemPrompt = `You are a professional English grammar analyst. Analyze the provided text and return a detailed JSON analysis.

User Level: ${userLevel}
Analysis Focus: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": number (0-100),
  "errors": [
    {
      "type": "grammar|spelling|punctuation|word_order|verb_tense|article|preposition|vocabulary",
      "original": "exact text with error",
      "correction": "corrected version",
      "explanation": "simple explanation of the error",
      "severity": "minor|moderate|major"
    }
  ],
  "strengths": ["positive aspects of the writing"],
  "suggestions": ["specific improvement suggestions"],
  "complexity": "simple|intermediate|advanced",
  "wordCount": number,
  "sentenceCount": number,
  "readabilityScore": number (0-100),
  "levelAppropriate": boolean
}

Scoring Guidelines:
- 90-100: Excellent grammar, minimal errors
- 80-89: Good grammar, few minor errors
- 70-79: Acceptable grammar, some errors
- 60-69: Basic grammar, several errors
- 50-59: Poor grammar, many errors
- 0-49: Very poor grammar, major issues

Be encouraging but accurate in your assessment.`;

    const userPrompt = `Analyze this English text: "${text}"

Provide detailed grammar analysis focusing on the ${userLevel} level. Return only the JSON object.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent analysis
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const analysisData = JSON.parse(response);
      
      // Validate and enhance the analysis
      return {
        text,
        overallScore: Math.max(0, Math.min(100, analysisData.overallScore || 0)),
        errors: analysisData.errors || [],
        strengths: analysisData.strengths || [],
        suggestions: analysisData.suggestions || [],
        complexity: analysisData.complexity || 'simple',
        wordCount: analysisData.wordCount || text.split(' ').length,
        sentenceCount: analysisData.sentenceCount || text.split(/[.!?]+/).filter(s => s.trim()).length,
        readabilityScore: analysisData.readabilityScore || 50,
        levelAppropriate: analysisData.levelAppropriate !== false
      };

    } catch (error) {
      console.error('Error parsing OpenAI grammar analysis:', error);
      
      // Fallback analysis
      return this.createBasicAnalysis(text);
    }
  }

  // 🎯 Calcular XP baseado na qualidade gramatical
  private calculateGrammarXP(analysis: GrammarAnalysis, userLevel: string): number {
    const baseXP = 15; // XP mínimo por mensagem
    let bonusXP = 0;

    // Bonus baseado na pontuação gramatical
    if (analysis.overallScore >= 95) bonusXP += 50; // Excelente
    else if (analysis.overallScore >= 85) bonusXP += 35; // Muito bom
    else if (analysis.overallScore >= 75) bonusXP += 25; // Bom
    else if (analysis.overallScore >= 65) bonusXP += 15; // Aceitável
    else if (analysis.overallScore >= 50) bonusXP += 5;  // Básico

    // Bonus por complexidade apropriada para o nível
    if (analysis.levelAppropriate) {
      bonusXP += 10;
    }

    // Bonus por tamanho do texto (incentiva textos mais longos)
    if (analysis.wordCount >= 20) bonusXP += 10;
    if (analysis.wordCount >= 50) bonusXP += 15;

    // Multiplicador por nível (níveis mais altos precisam de mais qualidade)
    const levelMultiplier = {
      'Novice': 1.2,      // Mais generoso para iniciantes
      'Intermediate': 1.0, // Padrão
      'Advanced': 0.9     // Mais exigente para avançados
    };

    const multiplier = levelMultiplier[userLevel as keyof typeof levelMultiplier] || 1.0;
    const totalXP = Math.round((baseXP + bonusXP) * multiplier);

    return Math.max(baseXP, Math.min(100, totalXP)); // Entre 15-100 XP
  }

  // 💬 Gerar feedback personalizado
  private async generatePersonalizedFeedback(
    analysis: GrammarAnalysis,
    userLevel: string,
    userName?: string
  ): Promise<string> {
    
    const levelInstructions = {
      'Novice': 'Use simple, encouraging English. Include Portuguese explanations when helpful. Focus on basic improvements.',
      'Intermediate': 'Provide clear, practical feedback. Focus on business English and communication effectiveness.',
      'Advanced': 'Give sophisticated, detailed feedback. Focus on professional writing and advanced language skills.'
    };

    const systemPrompt = `You are Charlotte, an encouraging English tutor. Provide personalized feedback on the grammar analysis.

User Level: ${userLevel}
Guidelines: ${levelInstructions[userLevel as keyof typeof levelInstructions]}

Create a warm, encouraging response that:
1. Acknowledges their effort positively
2. Highlights what they did well (strengths)
3. Gently addresses main errors with clear explanations
4. Provides actionable suggestions
5. Ends with encouragement and motivation

Keep response conversational, around 100-150 words, and match the ${userLevel} level.`;

    const userPrompt = `Grammar Analysis Results:
- Overall Score: ${analysis.overallScore}/100
- Errors Found: ${analysis.errors.length}
- Main Strengths: ${analysis.strengths.join(', ')}
- Key Issues: ${analysis.errors.slice(0, 3).map(e => e.type).join(', ')}
- Text Complexity: ${analysis.complexity}
- Level Appropriate: ${analysis.levelAppropriate}

Student name: ${userName || 'there'}
Original text: "${analysis.text}"

Provide encouraging, helpful feedback focusing on improvement.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || this.createFallbackFeedback(analysis, userLevel, userName);

    } catch (error) {
      console.error('Error generating personalized feedback:', error);
      return this.createFallbackFeedback(analysis, userLevel, userName);
    }
  }

  // 🎉 Gerar encorajamento baseado na pontuação
  private generateEncouragement(score: number, userLevel: string): string {
    const encouragements = {
      'Novice': {
        excellent: "Fantástico! Your English writing is excellent! 🌟",
        good: "Muito bem! You're doing great with English! 👍",
        okay: "Bom trabalho! Keep practicing - you're improving! 💪",
        needsWork: "Continue tentando! Every message makes you better! 🌱"
      },
      'Intermediate': {
        excellent: "Outstanding grammar! Your English is really impressive! 🎉",
        good: "Great job! Your writing skills are developing well! 👏",
        okay: "Good effort! You're making solid progress! 📈",
        needsWork: "Keep going! Your English is getting stronger! 💪"
      },
      'Advanced': {
        excellent: "Exceptional writing! Your English mastery is evident! 🏆",
        good: "Excellent work! Your professional English is strong! ⭐",
        okay: "Good progress! Continue refining your skills! 🎯",
        needsWork: "Keep challenging yourself! Growth comes with practice! 🚀"
      }
    };

    const level = encouragements[userLevel as keyof typeof encouragements];
    
    if (score >= 85) return level.excellent;
    if (score >= 70) return level.good;
    if (score >= 55) return level.okay;
    return level.needsWork;
  }

  // 🎯 Sugerir próximo desafio
  private generateNextChallenge(analysis: GrammarAnalysis, userLevel: string): string {
    const challenges = {
      'Novice': [
        "Try writing about your daily routine using present tense!",
        "Describe your favorite food in 3-4 sentences!",
        "Write about your family using 'have' and 'has'!",
        "Tell me about your hobbies in simple sentences!"
      ],
      'Intermediate': [
        "Write a short business email about a meeting!",
        "Describe a problem and solution using past and future tenses!",
        "Practice using conditional sentences (if/when)!",
        "Write about your career goals using professional vocabulary!"
      ],
      'Advanced': [
        "Compose a persuasive argument about a current topic!",
        "Write a complex analysis using advanced connectors!",
        "Practice formal writing with sophisticated vocabulary!",
        "Create a detailed report with multiple perspectives!"
      ]
    };

    const levelChallenges = challenges[userLevel as keyof typeof challenges];
    return levelChallenges[Math.floor(Math.random() * levelChallenges.length)];
  }

  // 🔄 Análise básica de fallback
  private createBasicAnalysis(text: string): GrammarAnalysis {
    const wordCount = text.split(' ').filter(word => word.trim()).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
    
    // Análise básica baseada em heurísticas
    let score = 70; // Score base
    
    // Penalizar por problemas óbvios
    if (text.toLowerCase() === text) score -= 10; // Sem maiúsculas
    if (!text.match(/[.!?]$/)) score -= 5; // Sem pontuação final
    if (wordCount < 3) score -= 15; // Muito curto
    
    return {
      text,
      overallScore: Math.max(30, score),
      errors: [],
      strengths: ['You wrote in English!'],
      suggestions: ['Try adding more details to your message'],
      complexity: wordCount > 15 ? 'intermediate' : 'simple',
      wordCount,
      sentenceCount: Math.max(1, sentenceCount),
      readabilityScore: 60,
      levelAppropriate: true
    };
  }

  // 🆘 Feedback de fallback
  private createFallbackFeedback(analysis: GrammarAnalysis, userLevel: string, userName?: string): string {
    const name = userName || 'there';
    
    if (userLevel === 'Novice') {
      return `Great job writing in English, ${name}! 😊 I can see you're practicing hard. Your message shows good effort, and that's what matters most. Keep writing - every message helps you improve! What would you like to talk about next?`;
    } else if (userLevel === 'Intermediate') {
      return `Nice work, ${name}! 👍 Your English communication is developing well. I appreciate the effort you put into your message. Keep practicing your writing skills - you're making good progress! What topic interests you today?`;
    } else {
      return `Excellent effort, ${name}! 🌟 Your written English shows good command of the language. Continue challenging yourself with complex ideas and sophisticated vocabulary. What would you like to explore further?`;
    }
  }

  // 🆘 Análise de fallback completa
  private createFallbackAnalysis(text: string, userLevel: string, userName?: string): GrammarFeedback {
    const analysis = this.createBasicAnalysis(text);
    
    return {
      analysis,
      feedback: this.createFallbackFeedback(analysis, userLevel, userName),
      xpAwarded: 15,
      encouragement: this.generateEncouragement(analysis.overallScore, userLevel),
      nextChallenge: this.generateNextChallenge(analysis, userLevel)
    };
  }
}

// 🏭 Instância singleton do serviço
export const grammarAnalysisService = new GrammarAnalysisService(); 