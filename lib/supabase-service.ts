// lib/supabase-service.ts - VERSÃO FINAL CORRETA - APENAS COLUNAS QUE EXISTEM

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Singleton para evitar múltiplas instâncias do Supabase
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Service will be disabled.');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created (singleton)');
  }

  return supabaseInstance;
}

// ✅ Interface atualizada para incluir dados de gramática
interface AudioPracticeData {
  user_id: string;
  transcription: string;
  accuracy_score: number | null;
  fluency_score: number | null;
  completeness_score: number | null;
  pronunciation_score: number | null;
  feedback?: string;
  xp_awarded: number;
  practice_type: 'audio_message' | 'text_message' | 'live_voice' | 'challenge' | 'camera_object';
  audio_duration: number;
  // 🆕 Novos campos para análise de gramática
  grammar_score?: number | null;
  grammar_errors?: number | null;
  text_complexity?: string | null;
  word_count?: number | null;
  // 🆕 Feedback técnico para mensagens de áudio
  technicalFeedback?: string;
}

interface UserStats {
  total_xp: number;
  current_level: number;
  streak_days: number;
  total_practices: number;
  longest_streak?: number;
  average_pronunciation_score?: number;
  // 🆕 Estatísticas de gramática
  average_grammar_score?: number;
  total_text_practices?: number;
}

interface TodaySession {
  total_xp_earned: number;
  practice_count: number;
}

class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  isAvailable(): boolean {
    return this.supabase !== null;
  }

  // ✅ Função atualizada para salvar dados de gramática
  async saveAudioPractice(data: AudioPracticeData) {
    if (!this.supabase) {
      console.warn('Supabase not available');
      return null;
    }

    try {
      console.log('💾 Saving practice to user_practices:', {
        user_id: data.user_id,
        practice_type: data.practice_type,
        xp_awarded: data.xp_awarded,
        hasGrammarData: !!(data.grammar_score || data.grammar_errors || data.text_complexity)
      });

      // Primeiro, verificar se há sessão para hoje
      let sessionId = await this.getOrCreateTodaySession(data.user_id);

      // 🔍 Verificar se conseguiu criar/obter sessão
      if (!sessionId) {
        console.error('Failed to create or get session');
        return null;
      }

      // 🎯 Preparar dados básicos para inserção (apenas campos que sabemos que existem)
      const practiceData: any = {
        session_id: sessionId,
        user_id: data.user_id,
        transcription: data.transcription,
        xp_awarded: data.xp_awarded,
        practice_type: data.practice_type,
        audio_duration: data.audio_duration
      };

      // ✅ Adicionar campos de áudio apenas se não forem null
      if (data.accuracy_score !== null && data.accuracy_score !== undefined) {
        practiceData.accuracy_score = data.accuracy_score;
      }
      if (data.fluency_score !== null && data.fluency_score !== undefined) {
        practiceData.fluency_score = data.fluency_score;
      }
      if (data.completeness_score !== null && data.completeness_score !== undefined) {
        practiceData.completeness_score = data.completeness_score;
      }
      if (data.pronunciation_score !== null && data.pronunciation_score !== undefined) {
        practiceData.pronunciation_score = data.pronunciation_score;
      }
      if (data.feedback) {
        practiceData.feedback = data.feedback;
      }

      console.log('📝 Basic practice data prepared:', Object.keys(practiceData));

      // 🆕 Tentar adicionar campos de gramática de forma segura
      try {
        if (data.grammar_score !== undefined && data.grammar_score !== null) {
          practiceData.grammar_score = data.grammar_score;
          console.log('✅ Added grammar_score:', data.grammar_score);
        }
        if (data.grammar_errors !== undefined && data.grammar_errors !== null) {
          practiceData.grammar_errors = data.grammar_errors;
          console.log('✅ Added grammar_errors:', data.grammar_errors);
        }
        if (data.text_complexity !== undefined && data.text_complexity !== null) {
          practiceData.text_complexity = data.text_complexity;
          console.log('✅ Added text_complexity:', data.text_complexity);
        }
        if (data.word_count !== undefined && data.word_count !== null) {
          practiceData.word_count = data.word_count;
          console.log('✅ Added word_count:', data.word_count);
        }
      } catch (grammarFieldError) {
        console.warn('⚠️ Error adding grammar fields, continuing without them:', grammarFieldError);
      }

      console.log('🎯 Final practice data to insert:', practiceData);

      // Salvar a prática individual
      let { data: practice, error: practiceError } = await this.supabase
        .from('user_practices')
        .insert(practiceData)
        .select()
        .single();

      if (practiceError) {
        console.error('❌ Error saving practice - Full error details:', {
          error: practiceError,
          message: practiceError.message,
          details: practiceError.details,
          hint: practiceError.hint,
          code: practiceError.code
        });
        
        // 🔄 Tentar novamente apenas com campos básicos se houver erro
        console.log('🔄 Retrying with basic fields only...');
        const basicData = {
          session_id: sessionId,
          user_id: data.user_id,
          transcription: data.transcription,
          xp_awarded: data.xp_awarded,
          practice_type: data.practice_type,
          audio_duration: data.audio_duration
        };

        const { data: retryPractice, error: retryError } = await this.supabase
          .from('user_practices')
          .insert(basicData)
        .select()
        .single();

        if (retryError) {
          console.error('❌ Retry also failed:', retryError);
        return null;
        } else {
          console.log('✅ Retry successful with basic data');
          practice = retryPractice;
        }
      }

      console.log('✅ Practice saved successfully:', {
        id: practice?.id,
        type: practice?.practice_type,
        xp: practice?.xp_awarded,
        grammarScore: practice?.grammar_score,
        grammarErrors: practice?.grammar_errors
      });

      // Atualizar estatísticas da sessão
      await this.updateSessionStats(sessionId, data.xp_awarded);

      // Atualizar progresso do usuário COM CÁLCULO DE STREAK
      await this.updateUserProgress(data.user_id, data.xp_awarded, data.practice_type);

      return practice;
    } catch (error) {
      console.error('❌ Exception in saveAudioPractice:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  private async getOrCreateTodaySession(userId: string): Promise<string | null> {
    if (!this.supabase) return null;

    try {
      // 🇧🇷 Usar timezone do Brasil (UTC-3)
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const today = brazilTime.toISOString().split('T')[0];

      console.log(`🗓️ Creating/getting session for Brazil date: ${today}`);

      // Tentar buscar sessão existente
      const { data: existingSession } = await this.supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('session_date', today)
        .single();

      if (existingSession) {
        console.log(`✅ Found existing session: ${existingSession.id}`);
        return existingSession.id;
      }

      // Criar nova sessão
      const { data: newSession, error } = await this.supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_date: today,
          total_xp_earned: 0,
          practice_count: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      console.log(`✅ Created new session: ${newSession.id} for date: ${today}`);
      return newSession.id;
    } catch (error) {
      console.error('Error in getOrCreateTodaySession:', error);
      return null;
    }
  }

  private async updateSessionStats(sessionId: string, xpAwarded: number) {
    if (!this.supabase || !sessionId) return;

    try {
      // Buscar valores atuais
      const { data: currentSession } = await this.supabase
        .from('user_sessions')
        .select('total_xp_earned, practice_count')
        .eq('id', sessionId)
        .single();

      if (currentSession) {
        // Atualizar com novos valores
        const { error } = await this.supabase
          .from('user_sessions')
          .update({
            total_xp_earned: currentSession.total_xp_earned + xpAwarded,
            practice_count: currentSession.practice_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Error updating session stats:', error);
        } else {
          console.log('✅ Session stats updated');
        }
      }
    } catch (error) {
      console.error('Error in updateSessionStats:', error);
    }
  }

  // ✅ FUNÇÃO: Calcular streak baseado nas sessões
  private async calculateUserStreak(userId: string): Promise<number> {
    if (!this.supabase) return 0;

    try {
      // Buscar todas as datas de sessão do usuário, ordenadas por data
      const { data: sessions, error } = await this.supabase
        .from('user_sessions')
        .select('session_date')
        .eq('user_id', userId)
        .order('session_date', { ascending: false });

      if (error || !sessions || sessions.length === 0) {
        return 0;
      }

      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);

      // Normalizar para apenas a data (sem hora)
      currentDate.setHours(0, 0, 0, 0);

      for (const session of sessions) {
        const sessionDate = new Date(session.session_date);
        sessionDate.setHours(0, 0, 0, 0);

        // Se a data da sessão é igual à data atual que estamos verificando
        if (sessionDate.getTime() === currentDate.getTime()) {
          streak++;
          // Avançar para o dia anterior
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (sessionDate.getTime() < currentDate.getTime()) {
          // Se há uma lacuna, quebrar o streak
          break;
        }
        // Se sessionDate > currentDate, ignorar (sessão futura, não deveria acontecer)
      }

      console.log(`🔥 Calculated streak for user ${userId}: ${streak} days`);
      return streak;

    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  // ✅ VERSÃO FINAL CORRETA - APENAS COLUNAS QUE EXISTEM
  private async updateUserProgress(userId: string, xpAwarded: number, practiceType: string) {
    if (!this.supabase) {
      console.error('❌ Supabase not available in updateUserProgress');
      return;
    }

    try {
      console.log('🔄 Starting updateUserProgress:', { userId, xpAwarded, practiceType });

      // Calcular streak atual
      const currentStreak = await this.calculateUserStreak(userId);
      console.log('🔥 Calculated streak:', currentStreak);

      // Primeiro, tentar buscar progresso existente
      console.log('🔍 Searching for existing user progress...');
      const { data: existingProgress, error: selectError } = await this.supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error selecting user progress:', selectError);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      if (existingProgress) {
        console.log('📊 Found existing progress:', existingProgress);
        
        // Calcular novos valores
        const newTotalXP = existingProgress.total_xp + xpAwarded;
        const newLevel = Math.floor(newTotalXP / 1000) + 1;
        const newTotalPractices = (existingProgress.total_practices || 0) + 1;
        const newLongestStreak = Math.max(existingProgress.longest_streak || 0, currentStreak);

        // ✅ APENAS COLUNAS QUE EXISTEM NA TABELA
        const updates: any = {
          total_xp: newTotalXP,
          total_practices: newTotalPractices,
          current_level: newLevel,
          streak_days: currentStreak,
          longest_streak: newLongestStreak,
          last_practice_date: today,
          updated_at: new Date().toISOString()
        };

        console.log('📝 Updating with values:', updates);
        console.log(`📈 XP: ${existingProgress.total_xp} + ${xpAwarded} = ${newTotalXP}`);

        const { data: updateData, error: updateError } = await this.supabase
          .from('user_progress')
          .update(updates)
          .eq('user_id', userId)
          .select();

        if (updateError) {
          console.error('❌ Error updating user progress:', updateError);
          console.error('❌ Update error details:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          });
          return;
        }

        console.log('✅ User progress updated successfully:', updateData);
        console.log('✅ New total XP:', newTotalXP);

      } else {
        console.log('🆕 No existing progress found, creating new record...');
        
        // ✅ APENAS COLUNAS QUE EXISTEM NA TABELA
        const newProgress: any = {
          user_id: userId,
          total_xp: xpAwarded,
          total_practices: 1,
          current_level: Math.floor(xpAwarded / 1000) + 1,
          streak_days: currentStreak,
          longest_streak: currentStreak,
          last_practice_date: today
        };

        console.log('📝 Creating new progress:', newProgress);

        const { data: insertData, error: insertError } = await this.supabase
          .from('user_progress')
          .insert(newProgress)
          .select();

        if (insertError) {
          console.error('❌ Error creating user progress:', insertError);
          console.error('❌ Insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          return;
        }

        console.log('✅ User progress created successfully:', insertData);
      }

      // ✅ VERIFICAÇÃO FINAL - Buscar o registro após atualizar
      console.log('🔍 Verifying update by fetching current data...');
      const { data: verifyData, error: verifyError } = await this.supabase
        .from('user_progress')
        .select('total_xp, current_level, streak_days, longest_streak')
        .eq('user_id', userId)
        .single();

      if (verifyError) {
        console.error('❌ Error verifying update:', verifyError);
      } else {
        console.log('✅ Verification - Current data in DB:', verifyData);
        console.log(`🎉 SUCCESS! XP updated to ${verifyData.total_xp}`);
      }

    } catch (error) {
      console.error('❌ Exception in updateUserProgress:', error);
    }
  }

  // ✅ CORRIGIDO: getUserStats com colunas corretas
  async getUserStats(userId: string): Promise<UserStats | null> {
    if (!this.supabase) {
      console.warn('❌ Supabase not available in getUserStats');
      return null;
    }

    try {
      console.log(`🔍 Getting user stats for: ${userId}`);

      const { data, error } = await this.supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('❌ No user stats found:', error.message);
        return null;
      }

      const stats = {
        total_xp: data.total_xp || 0,
        current_level: data.current_level || 1,
        streak_days: data.streak_days || 0,
        total_practices: data.total_practices || 0,
        longest_streak: data.longest_streak || 0,
        average_pronunciation_score: data.average_pronunciation_score || null,
        average_grammar_score: data.average_grammar_score || null,
        total_text_practices: data.total_text_practices || 0
      };

      console.log('✅ User stats found:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return null;
    }
  }

  async getTodaySession(userId: string): Promise<TodaySession | null> {
    if (!this.supabase) return null;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('total_xp_earned, practice_count')
        .eq('user_id', userId)
        .eq('session_date', today)
        .single();

      if (error) {
        return null;
      }

      return {
        total_xp_earned: data.total_xp_earned || 0,
        practice_count: data.practice_count || 0
      };
    } catch (error) {
      console.error('Error getting today session:', error);
      return null;
    }
  }

  // ✅ Buscar XP real de hoje - CORRIGIDO PARA TIMEZONE BRASIL
  async getTodaySessionXP(userId: string): Promise<number> {
    if (!this.supabase) return 0;

    try {
      console.log(`🗓️ Getting today's XP for user: ${userId}`);
      
      // 🇧🇷 Usar timezone do Brasil (UTC-3)
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const today = brazilTime.toISOString().split('T')[0];
      
      // Calcular início e fim do dia no timezone do Brasil
      const startOfDay = `${today}T00:00:00-03:00`;
      const endOfDay = `${today}T23:59:59-03:00`;

      console.log(`🕐 Brazil timezone - Today: ${today}, Range: ${startOfDay} to ${endOfDay}`);

      // Buscar soma total de XP das práticas de hoje
      const { data, error } = await this.supabase
        .from('user_practices')
        .select('xp_awarded, created_at')
        .eq('user_id', userId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) {
        console.error('❌ Error getting today XP:', error);
        return 0;
      }

      // Somar todo o XP de hoje
      const totalXPToday = data.reduce((sum, practice) => sum + (practice.xp_awarded || 0), 0);
      
      console.log(`✅ Today's total XP (Brazil timezone): ${totalXPToday} (from ${data.length} practices)`);
      console.log(`📊 Practice times:`, data.map(p => p.created_at));
      
      return totalXPToday;

    } catch (error) {
      console.error('❌ Error in getTodaySessionXP:', error);
      return 0;
    }
  }

  async getUserPracticeHistory(userId: string, limit: number = 10) {
    if (!this.supabase) {
      console.warn('❌ Supabase not available in getUserPracticeHistory');
      return [];
    }

    try {
      console.log(`🔍 Getting practice history for: ${userId}, limit: ${limit}`);

      const { data, error } = await this.supabase
        .from('user_practices')
        .select('practice_type, xp_awarded, created_at, transcription, grammar_score, grammar_errors')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error getting practice history:', error);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} practice records`);
      return data || [];

    } catch (error) {
      console.error('❌ Error in getUserPracticeHistory:', error);
      return [];
    }
  }

  async getPracticeStatsByType(userId: string) {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('user_practices')
        .select('practice_type, xp_awarded, grammar_score')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting practice stats by type:', error);
        return null;
      }

      // Agrupar por tipo
      const stats = data.reduce((acc: any, practice: any) => {
        const type = practice.practice_type;
        if (!acc[type]) {
          acc[type] = { 
            count: 0, 
            total_xp: 0,
            avg_grammar_score: null,
            grammar_scores: []
          };
        }
        acc[type].count++;
        acc[type].total_xp += practice.xp_awarded;
        
        // Adicionar scores de gramática se disponíveis
        if (practice.grammar_score !== null && practice.grammar_score !== undefined) {
          acc[type].grammar_scores.push(practice.grammar_score);
        }
        
        return acc;
      }, {});

      // Calcular médias de gramática
      Object.keys(stats).forEach(type => {
        if (stats[type].grammar_scores.length > 0) {
          const sum = stats[type].grammar_scores.reduce((a: number, b: number) => a + b, 0);
          stats[type].avg_grammar_score = Math.round(sum / stats[type].grammar_scores.length);
        }
        delete stats[type].grammar_scores; // Remover array temporário
      });

      return stats;
    } catch (error) {
      console.error('Error in getPracticeStatsByType:', error);
      return null;
    }
  }

  // 🔍 Método para testar conectividade e estrutura da tabela
  async testDatabaseConnection() {
    if (!this.supabase) {
      console.error('❌ Supabase not available');
      return false;
    }

    try {
      console.log('🔍 Testing database connection...');
      
      // Testar uma query simples
      const { data, error } = await this.supabase
        .from('user_practices')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection successful');
      
      // Se há dados, mostrar estrutura
      if (data && data.length > 0) {
        console.log('📋 Available columns in user_practices:', Object.keys(data[0]));
      } else {
        console.log('📋 Table exists but no data found');
      }

      return true;
    } catch (error) {
      console.error('❌ Database test exception:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();

// Vocabulary management
export const vocabularyService = {
  // Save discovered vocabulary
  async saveVocabulary(userId: string, data: {
    word: string;
    translation?: string;
    definition?: string;
    example_sentence?: string;
    image_data?: string;
  }) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase not available');
      return null;
    }

    try {
      // Convert string userId to UUID format if needed
      const { data: result, error } = await supabase
        .from('user_vocabulary')
        .insert({
          user_id: userId, // Supabase will handle the UUID conversion
          word: data.word,
          translation: data.translation,
          definition: data.definition,
          example_sentence: data.example_sentence,
          image_data: data.image_data,
          discovered_at: new Date().toISOString(),
          practiced_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error saving vocabulary:', error);
      throw error;
    }
  },

  // Get user's vocabulary
  async getUserVocabulary(userId: string, limit = 50) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase not available');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .select('*')
        .eq('user_id', userId) // Supabase will handle the UUID conversion
        .order('discovered_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      throw error;
    }
  },

  // Update practice count
  async updatePracticeCount(vocabularyId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase not available');
      return null;
    }

    try {
      // First get current count
      const { data: current, error: selectError } = await supabase
        .from('user_vocabulary')
        .select('practiced_count')
        .eq('id', vocabularyId)
        .single();

      if (selectError) throw selectError;

      // Then update with incremented count
      const { data, error } = await supabase
        .from('user_vocabulary')
        .update({
          practiced_count: (current?.practiced_count || 0) + 1,
          last_practiced: new Date().toISOString()
        })
        .eq('id', vocabularyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating practice count:', error);
      throw error;
    }
  },

  // Check if word already exists for user
  async checkWordExists(userId: string, word: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase not available');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .select('id, word, practiced_count')
        .eq('user_id', userId) // Supabase will handle the UUID conversion
        .ilike('word', word)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error checking word existence:', error);
      return null;
    }
  }
};