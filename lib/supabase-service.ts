// lib/supabase-service.ts - VERSÃO FINAL CORRETA - APENAS COLUNAS QUE EXISTEM

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase'; // ✅ Usar o mesmo singleton

// ✅ CORRIGIDO: Usar service role para operações do backend quando disponível
function getSupabaseClient(): SupabaseClient | null {
  // Se estamos no servidor e temos service role key, usar ela
  if (typeof window === 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔍 Server-side Supabase client check:', {
      hasUrl: !!supabaseUrl,
      hasServiceRole: !!serviceRoleKey,
      urlLength: supabaseUrl?.length || 0,
      serviceRoleLength: serviceRoleKey?.length || 0
    });
    
    if (supabaseUrl && serviceRoleKey) {
      console.log('🔑 Using Supabase service role for backend operations');
      const { createClient } = require('@supabase/supabase-js');
      return createClient(supabaseUrl, serviceRoleKey);
    } else {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using anon key (may cause RLS issues)');
    }
  }
  
  // Fallback para cliente normal
  return getSupabase();
}

// ✅ Interface atualizada para incluir dados de gramática e sistema XP melhorado
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
  // 🆕 Campos do sistema XP melhorado
  achievement_ids?: string[];
  surprise_bonus?: number;
  base_xp?: number;
  bonus_xp?: number;
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
    
    // Debug: verificar se service role está sendo usada
    if (typeof window === 'undefined') {
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      console.log('🔍 SupabaseService constructor (server-side):', {
        hasServiceRole,
        serviceRoleLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      });
    }
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

      // 🆕 Tentar adicionar campos do sistema XP melhorado de forma segura
      try {
        if (data.achievement_ids !== undefined && data.achievement_ids !== null) {
          practiceData.achievement_ids = data.achievement_ids;
          console.log('✅ Added achievement_ids:', data.achievement_ids);
        }
        if (data.surprise_bonus !== undefined && data.surprise_bonus !== null) {
          practiceData.surprise_bonus = data.surprise_bonus;
          console.log('✅ Added surprise_bonus:', data.surprise_bonus);
        }
        if (data.base_xp !== undefined && data.base_xp !== null) {
          practiceData.base_xp = data.base_xp;
          console.log('✅ Added base_xp:', data.base_xp);
        }
        if (data.bonus_xp !== undefined && data.bonus_xp !== null) {
          practiceData.bonus_xp = data.bonus_xp;
          console.log('✅ Added bonus_xp:', data.bonus_xp);
        }
      } catch (xpFieldError) {
        console.warn('⚠️ Error adding XP system fields, continuing without them:', xpFieldError);
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
          code: practiceError.code,
          stack: practiceError.stack
        });
        
        // Log adicional para debug
        console.error('❌ Raw practice error object:', JSON.stringify(practiceError, null, 2));
        
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
          console.error('❌ Retry also failed:', {
            error: retryError,
            message: retryError.message,
            details: retryError.details,
            hint: retryError.hint,
            code: retryError.code
          });
          console.error('❌ Raw retry error object:', JSON.stringify(retryError, null, 2));
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

      // 🏆 NEW: Verificar e conceder achievements automaticamente
      try {
        const { AchievementVerificationService } = await import('./achievement-verification-service');
        
        const newAchievements = await AchievementVerificationService.verifyAndAwardAchievements(
          data.user_id,
          {
            practice_type: data.practice_type,
            accuracy_score: data.accuracy_score || undefined,
            grammar_score: data.grammar_score || undefined,
            pronunciation_score: data.pronunciation_score || undefined,
            xp_awarded: data.xp_awarded,
            duration: data.audio_duration,
            text: data.transcription // ✅ NOVO: Passar o texto para achievements baseados em conteúdo
          }
        );

        if (newAchievements.length > 0) {
          console.log('🏆 New achievements awarded:', newAchievements.map(a => a.name));
          
          // Adicionar XP dos achievements ao progresso do usuário
          const achievementXP = newAchievements.reduce((sum, a) => sum + a.xp_reward, 0);
          if (achievementXP > 0) {
            await this.updateUserProgress(data.user_id, achievementXP, 'achievement_bonus');
            console.log('✨ Achievement bonus XP awarded:', achievementXP);
          }
        }
        
        console.log('🏆 Achievement verification completed successfully');
      } catch (achievementError) {
        console.warn('⚠️ Achievement verification failed, continuing without achievements:', achievementError);
      }

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
      // 🇧🇷 SIMPLIFICADO: Usar timezone do Brasil
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
      
      // 🇧🇷 SIMPLIFICADO: Usar timezone do Brasil para streak
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      let currentDate = new Date(brazilTime);
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

  // ✅ VERSÃO FINAL CORRETA - APENAS COLUNAS QUE EXISTEM (sem user_name)
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

      // 🇧🇷 SIMPLIFICADO: Usar timezone do Brasil
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const today = brazilTime.toISOString().split('T')[0];

      if (existingProgress) {
        console.log('📊 Found existing progress:', existingProgress);
        
        // Calcular novos valores
        const newTotalXP = existingProgress.total_xp + xpAwarded;
        const newLevel = Math.floor(newTotalXP / 1000) + 1;
        const newTotalPractices = (existingProgress.total_practices || 0) + 1;
        const newLongestStreak = Math.max(existingProgress.longest_streak || 0, currentStreak);

        // ✅ APENAS COLUNAS QUE EXISTEM NA TABELA (sem user_name)
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
        
        // ✅ APENAS COLUNAS QUE EXISTEM NA TABELA (sem user_name)
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
        
        // ✅ AUTOMATIZAR: Atualizar posição no leaderboard após ganhar XP
        console.log('🏆 Updating leaderboard position...');
        await this.updateLeaderboardPosition(userId);
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
      // 🇧🇷 SIMPLIFICADO: Usar timezone do Brasil
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const today = brazilTime.toISOString().split('T')[0];

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

  // ✅ Buscar XP real de hoje - SIMPLIFICADO E CORRIGIDO
  async getTodaySessionXP(userId: string): Promise<number> {
    if (!this.supabase) return 0;

    try {
      console.log(`🗓️ Getting today's XP for user: ${userId}`);
      
      // 🇧🇷 SIMPLIFICADO: Usar timezone do Brasil de forma mais direta
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const today = brazilTime.toISOString().split('T')[0];
      
      console.log(`🕐 Brazil date: ${today}`);
      console.log(`🌍 Current Brazil time: ${brazilTime.toISOString()}`);

      // 🔧 Buscar práticas de hoje (usar LIKE para simplicidade)
      const { data, error } = await this.supabase
        .from('user_practices')
        .select('xp_awarded, created_at')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (error) {
        console.error('❌ Error getting today XP:', error);
        return 0;
      }

      // Somar todo o XP de hoje
      const totalXPToday = data.reduce((sum, practice) => sum + (practice.xp_awarded || 0), 0);
      
      console.log(`✅ Today's total XP: ${totalXPToday} (from ${data.length} practices)`);
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

  // 🔍 NOVO: Método de debug completo para verificar estrutura das tabelas
  // 🔍 DEBUG: Método simplificado sem inserções de teste
  async debugTableStructures() {
    if (!this.supabase) {
      console.log('⚠️ Supabase not available for debug');
      return;
    }

    console.log('📊 SupabaseService debug - Tables operational');
    
    // Apenas verificar se as tabelas existem, sem fazer inserções
    try {
      const { data: practicesData } = await this.supabase
        .from('user_practices')
        .select('*')
        .limit(1);
      console.log('✅ user_practices: accessible');
      
      const { data: achievementsData } = await this.supabase
        .from('user_achievements')
        .select('*')
        .limit(1);
      console.log('✅ user_achievements: accessible');
      
    } catch (error) {
      console.log('⚠️ Database debug completed with warnings (normal)');
    }
  }

  // 🏆 ACHIEVEMENT SYSTEM METHODS

  /**
   * Salvar conquistas do usuário - VERSÃO COMPLETA
   */
  async saveAchievements(userId: string, achievements: any[]) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for saveAchievements');
      return false;
    }

    // 🛡️ PROTEÇÃO: Se não há achievements, retornar sucesso silenciosamente
    if (!achievements || achievements.length === 0) {
      console.log('ℹ️ No achievements to save, skipping...');
      return true;
    }

    // 🛡️ PROTEÇÃO ADICIONAL: Filtrar achievements válidos
    const validAchievements = achievements.filter(ach => {
      if (!ach || typeof ach !== 'object') {
        console.warn('⚠️ Invalid achievement object:', ach);
        return false;
      }
      return true;
    });

    if (validAchievements.length === 0) {
      console.log('ℹ️ No valid achievements to save after filtering, skipping...');
      return true;
    }

    try {
      console.log('💾 Salvando achievements para usuário:', userId);
      console.log('🏆 Valid achievements a salvar:', validAchievements.length);
      
      // ✅ DEBUGGING: Log each achievement structure
      validAchievements.forEach((ach, index) => {
        console.log(`🔍 Achievement ${index + 1}:`, {
          id: ach.id,
          title: ach.title,
          name: ach.name,
          achievement_name: ach.achievement_name,
          description: ach.description,
          achievement_description: ach.achievement_description,
          type: ach.type,
          icon: ach.icon,
          badge_icon: ach.badge_icon,
          xpBonus: ach.xpBonus,
          xp_bonus: ach.xp_bonus,
          xp_reward: ach.xp_reward
        });
      });

      // Primeiro, verificar se o usuário existe na tabela users
      const { data: existingUser, error: userError } = await this.supabase
        .from('users')
        .select('entra_id')
        .eq('entra_id', userId)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // Usuário não existe, criar
        console.log('👤 Criando usuário:', userId);
        const { error: createUserError } = await this.supabase
          .from('users')
          .insert([{ entra_id: userId }]);
        
        if (createUserError) {
          console.error('❌ Erro ao criar usuário:', createUserError);
          throw createUserError;
        }
      }

      // ✅ NOVO: Verificar achievements existentes para evitar duplicatas
      const existingAchievements = await this.getUserAchievements(userId, 1000);
      const existingAchievementNames = new Set(
        existingAchievements.map(ach => ach.achievement_name)
      );

      console.log('🔍 Existing achievements for user:', existingAchievementNames.size);
      console.log('🔍 Existing achievement names:', Array.from(existingAchievementNames));

      // ✅ CORRIGIDO: Preparar dados para inserção com mapeamento mais robusto
      const achievementData = validAchievements
        .map((achievement, index) => {
          // Determinar título com fallbacks mais robustos
          const title = achievement.title || 
                       achievement.name || 
                       achievement.achievement_name || 
                       `Achievement ${index + 1}`;
          
          // Determinar descrição com fallbacks mais robustos
          const description = achievement.description || 
                             achievement.achievement_description || 
                             'New achievement unlocked!';
          
          // Determinar ícone com fallbacks
          const icon = achievement.badge_icon || 
                      achievement.icon || 
                      '🏆';
          
          // Determinar XP com fallbacks
          const xpBonus = achievement.xp_reward || 
                         achievement.xp_bonus || 
                         achievement.xpBonus || 
                         0;
          
          // ✅ MAPEAMENTO CORRETO: Usar campos que EXISTEM na tabela real
          const mappedData = {
            user_id: userId,
            achievement_id: null, // Deixar NULL para achievements dinâmicos
            earned_at: new Date().toISOString(),
            achievement_type: achievement.type || 'general',
            achievement_name: title, // ✅ Campo correto na tabela
            achievement_description: description, // ✅ Campo correto na tabela
            achievement_code: achievement.code || title.toLowerCase().replace(/[^a-z0-9]+/g, '_'), // determinístico por título
            category: achievement.category || 'general', // ✅ Campo correto na tabela
            badge_icon: icon, // ✅ Campo correto na tabela
            badge_color: achievement.badge_color || '#4CAF50', // ✅ Campo correto na tabela
            xp_bonus: xpBonus, // ✅ Campo correto na tabela  
            rarity: achievement.rarity || 'common' // ✅ Campo correto na tabela
          };
          
          console.log(`📝 Mapped achievement ${index + 1}:`, mappedData);
          return mappedData;
        })
        .filter(achievement => {
          // ✅ NOVO: Filtrar achievements que já existem
          const alreadyExists = existingAchievementNames.has(achievement.achievement_name);
          if (alreadyExists) {
            console.log(`⚠️ Skipping duplicate achievement: ${achievement.achievement_name}`);
          } else {
            console.log(`✅ New achievement to save: ${achievement.achievement_name}`);
          }
          return !alreadyExists;
        });

      if (achievementData.length === 0) {
        console.log('ℹ️ No new achievements to save after duplicate check');
        return true;
      }

      console.log('📝 Dados finais preparados para inserção:', achievementData.length, 'achievements');

      const { data, error } = await this.supabase
        .from('user_achievements')
        .insert(achievementData)
        .select();

      if (error) {
        // Log mais robusto para capturar todos os detalhes do erro
        console.error('❌ Erro detalhado ao salvar achievements:');
        console.error('Error message:', error.message || 'No message');
        console.error('Error details:', error.details || 'No details');
        console.error('Error hint:', error.hint || 'No hint');
        console.error('Error code:', error.code || 'No code');
        console.error('Full error object:', error);
        console.error('Error keys:', Object.keys(error || {}));
        
        // Tentar diferentes formas de serializar o erro
        try {
          console.error('JSON stringify attempt:', JSON.stringify(error, null, 2));
        } catch (jsonError) {
          console.error('JSON stringify failed:', jsonError);
        }
        
        throw error;
      }

      console.log('✅ Achievements salvos com sucesso:', data);
      return data;
    } catch (error) {
      // 🛡️ PROTEÇÃO: Log mais detalhado e não quebrar o fluxo principal
      console.error('💥 Erro geral ao salvar achievements:');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('User ID:', userId);
      console.error('Achievements count:', validAchievements?.length || 0);
      console.error('Full error:', error);
      
      // Tentar serializar o erro de forma mais robusta
      try {
        console.error('Error JSON:', JSON.stringify(error, null, 2));
      } catch (jsonError) {
        console.error('Could not stringify error:', jsonError);
      }
      
      // 🔄 RETORNAR FALSE EM VEZ DE THROW para não quebrar o fluxo principal
      return false;
    }
  }

  /**
   * Buscar conquistas do usuário
   */
  async getUserAchievements(userId: string, limit: number = 10) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getUserAchievements');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching achievements:', error);
      return [];
    }
  }

  /**
   * Buscar conquistas não visualizadas
   */
  async getUnreadAchievements(userId: string) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getUnreadAchievements');
      return [];
    }

    try {
      // Por simplicidade, retornar todas as conquistas recentes (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await this.supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .gte('earned_at', yesterday.toISOString())
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching unread achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching unread achievements:', error);
      return [];
    }
  }

  /**
   * Marcar conquistas como lidas
   */
  async markAchievementsAsRead(userId: string, achievementIds: string[]) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for markAchievementsAsRead');
      return false;
    }

    try {
      // Por simplicidade, apenas log (em produção poderia ter campo 'read_at')
      console.log('📖 Marking achievements as read:', userId, achievementIds);
      return true;
    } catch (error) {
      console.error('❌ Exception marking achievements as read:', error);
      return false;
    }
  }

  // 🏅 LEADERBOARD SYSTEM METHODS

  /**
   * Buscar leaderboard por nível
   */
  async getLeaderboard(userLevel: string, limit: number = 50) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getLeaderboard');
      return {
        entries: [],
        totalUsers: 0,
        lastUpdated: new Date()
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('user_leaderboard_cache')
        .select('*')
        .eq('user_level', userLevel)
        .order('position', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching leaderboard:', error);
        
        // Se houver erro, tentar popular o cache e tentar novamente
        console.log('🔄 Attempting to populate leaderboard cache...');
        const populated = await this.populateLeaderboardCache();
        
        if (populated) {
          // Tentar novamente após popular
          const { data: retryData, error: retryError } = await this.supabase
            .from('user_leaderboard_cache')
            .select('*')
            .eq('user_level', userLevel)
            .order('position', { ascending: true })
            .limit(limit);
            
          if (!retryError && retryData) {
            const { count } = await this.supabase
              .from('user_leaderboard_cache')
              .select('*', { count: 'exact', head: true })
              .eq('user_level', userLevel);

            return {
              entries: retryData,
              totalUsers: count || 0,
              lastUpdated: new Date()
            };
          }
        }
        
        return {
          entries: [],
          totalUsers: 0,
          lastUpdated: new Date()
        };
      }

      // Se não há dados, tentar popular o cache
      if (!data || data.length === 0) {
        console.log('📝 No leaderboard data found, attempting to populate cache...');
        const populated = await this.populateLeaderboardCache();
        
        if (populated) {
          // Tentar novamente após popular
          const { data: retryData, error: retryError } = await this.supabase
            .from('user_leaderboard_cache')
            .select('*')
            .eq('user_level', userLevel)
            .order('position', { ascending: true })
            .limit(limit);
            
          if (!retryError && retryData && retryData.length > 0) {
            const { count } = await this.supabase
              .from('user_leaderboard_cache')
              .select('*', { count: 'exact', head: true })
              .eq('user_level', userLevel);

            return {
              entries: retryData,
              totalUsers: count || 0,
              lastUpdated: new Date()
            };
          }
        }
      }

      // Contar total de usuários neste nível
      const { count } = await this.supabase
        .from('user_leaderboard_cache')
        .select('*', { count: 'exact', head: true })
        .eq('user_level', userLevel);

      return {
        entries: data || [],
        totalUsers: count || 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('❌ Exception fetching leaderboard:', error);
      return {
        entries: [],
        totalUsers: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Buscar posição específica do usuário
   */
  async getUserPosition(userId: string, userLevel: string) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getUserPosition');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('user_leaderboard_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('user_level', userLevel)
        .single();

      if (error) {
        // ✅ CORRIGIDO: Log mais detalhado e retornar null
        console.error('❌ Error fetching user position:', {
          error: error.message,
          code: error.code,
          details: error.details,
          userId,
          userLevel
        });
        return null;
      }

      return data;
    } catch (error) {
      // ✅ CORRIGIDO: Log mais detalhado e retornar null
      console.error('❌ Exception fetching user position:', {
        error: error instanceof Error ? error.message : error,
        userId,
        userLevel
      });
      return null;
    }
  }

  /**
   * Atualizar cache do leaderboard
   */
  async updateLeaderboardPosition(userId: string) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for updateLeaderboardPosition');
      return false;
    }

    try {
      console.log('🔄 Updating leaderboard position for user:', userId);
      
      // ✅ NOVO: Forçar refresh do cache do leaderboard
      const success = await this.forceRefreshLeaderboard();
      
      if (success) {
        console.log('✅ Leaderboard cache updated successfully');
      } else {
        console.log('⚠️ Leaderboard cache update failed, but continuing...');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Exception updating leaderboard position:', error);
      return false;
    }
  }

  /**
   * Popular cache do leaderboard com dados reais da tabela users (Entra ID)
   */
  async populateLeaderboardCache() {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for populateLeaderboardCache');
      return false;
    }

    try {
      console.log('🔄 Populating leaderboard cache with real user data from Entra ID...');

      // ✅ CORRIGIDO: Buscar dados separadamente para evitar problemas de JOIN
      console.log('📊 Step 1: Fetching user progress...');
      const { data: userProgress, error: progressError } = await this.supabase
        .from('user_progress')
        .select('user_id, total_xp, streak_days, current_level')
        .order('total_xp', { ascending: false });

      if (progressError) {
        console.error('❌ Error fetching user progress:', progressError);
        return false;
      }

      if (!userProgress || userProgress.length === 0) {
        console.log('📝 No user progress found');
        return true;
      }

      console.log('📊 Step 2: Fetching users data...');
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('entra_id, name, user_level');

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        return false;
      }

      console.log(`👥 Found ${userProgress.length} user progress records and ${users?.length || 0} user records`);

      // 🔍 DEBUG: Log dados específicos do Felipe
      const felipeProgress = userProgress.find(p => p.user_id?.includes('felipe') || p.user_id?.includes('Felipe'));
      const felipeUser = users?.find(u => u.entra_id?.includes('felipe') || u.entra_id?.includes('Felipe') || u.name?.includes('Felipe'));
      
      console.log('🔍 DEBUG Felipe Progress:', felipeProgress);
      console.log('🔍 DEBUG Felipe User:', felipeUser);

      // ✅ CORRIGIDO: Combinar dados manualmente
      const usersWithProgress = userProgress.map(progress => {
        const user = users?.find(u => u.entra_id === progress.user_id);
        
        // 🔍 DEBUG: Log para cada usuário
        if (progress.user_id?.includes('felipe') || progress.user_id?.includes('Felipe')) {
          console.log('🔍 DEBUG Felipe Mapping:', {
            progressUserId: progress.user_id,
            foundUser: user,
            userEntraId: user?.entra_id,
            userName: user?.name,
            userLevel: user?.user_level
          });
        }
        
        return {
          ...progress,
          realUserLevel: user?.user_level || 'Inter',
          realName: user?.name || progress.user_id
        };
      });

      console.log('🔗 Combined data successfully');

      // 🔍 DEBUG: Log dados combinados do Felipe
      const felipeCombined = usersWithProgress.find(u => u.user_id?.includes('felipe') || u.user_id?.includes('Felipe'));
      console.log('🔍 DEBUG Felipe Combined:', felipeCombined);

      // Agrupar por nível real da tabela users
      const usersByLevel = {
        'Novice': [] as any[],
        'Inter': [] as any[],
        'Advanced': [] as any[]
      };

      usersWithProgress.forEach(userProgress => {
        const userLevel = userProgress.realUserLevel;
        
        if (usersByLevel[userLevel as keyof typeof usersByLevel]) {
          usersByLevel[userLevel as keyof typeof usersByLevel].push(userProgress);
        }
      });

      // Preparar dados para inserção
      const leaderboardEntries: Array<{
        user_id: string;
        user_level: string;
        display_name: string;
        avatar_color: string;
        level_number: number;
        total_xp: number;
        current_streak: number;
        position: number;
      }> = [];

      for (const [level, levelUsers] of Object.entries(usersByLevel)) {
        levelUsers
          .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
          .forEach((userProgress, index) => {
            // 🔍 DEBUG: Log para Felipe especificamente
            if (userProgress.user_id?.includes('felipe') || userProgress.user_id?.includes('Felipe') || userProgress.realName?.includes('Felipe')) {
              console.log('🔍 DEBUG Felipe Display Name Generation:', {
                userId: userProgress.user_id,
                realName: userProgress.realName,
                realUserLevel: userProgress.realUserLevel,
                aboutToFormat: userProgress.realName || userProgress.user_id
              });
            }
            
            // ✅ CORRIGIDO: Usar nome real do Entra ID com tratamento seguro
            const displayName = this.formatDisplayNameForCache(userProgress.realName || userProgress.user_id);
            const avatarColor = this.generateAvatarColorForCache(userProgress.realName || userProgress.user_id);
            
            // 🔍 DEBUG: Log resultado para Felipe
            if (userProgress.user_id?.includes('felipe') || userProgress.user_id?.includes('Felipe') || userProgress.realName?.includes('Felipe')) {
              console.log('🔍 DEBUG Felipe Final Result:', {
                userId: userProgress.user_id,
                inputName: userProgress.realName || userProgress.user_id,
                generatedDisplayName: displayName,
                avatarColor: avatarColor
              });
            }
            
            // ✅ CORRIGIDO: Garantir que todos os campos obrigatórios estão preenchidos
            leaderboardEntries.push({
              user_id: userProgress.user_id || '',
              user_level: level || 'Inter',
              display_name: displayName || 'Anonymous',
              avatar_color: avatarColor || '#A3FF3C',
              level_number: Math.max(1, Math.floor(Math.sqrt((userProgress.total_xp || 0) / 50)) + 1),
              total_xp: userProgress.total_xp || 0,
              current_streak: userProgress.streak_days || 0,
              position: index + 1
            });
          });
      }

      if (leaderboardEntries.length === 0) {
        console.log('📝 No leaderboard entries to insert');
        return true;
      }

      console.log('🗑️ Clearing existing cache...');
      // Limpar cache existente
      await this.supabase
        .from('user_leaderboard_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      console.log('💾 Inserting new leaderboard data...');
      console.log('📝 Sample entry:', leaderboardEntries[0]);
      
      // ✅ CORRIGIDO: Usar UPSERT em vez de INSERT para evitar erro 409
      const { error: insertError } = await this.supabase
        .from('user_leaderboard_cache')
        .upsert(leaderboardEntries, { 
          onConflict: 'user_id,user_level',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('❌ Error inserting leaderboard cache:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        console.error('❌ Sample data that failed:', leaderboardEntries[0]);
        return false;
      }

      console.log('✅ Leaderboard cache populated successfully:', {
        totalEntries: leaderboardEntries.length,
        byLevel: {
          Novice: usersByLevel.Novice.length,
          Inter: usersByLevel.Inter.length,
          Advanced: usersByLevel.Advanced.length
        }
      });

      return true;

    } catch (error) {
      console.error('❌ Exception populating leaderboard cache:', error);
      return false;
    }
  }

  /**
   * Formatar nome para o cache (privacidade) - COM user_name
   */
  private formatDisplayNameForCache(fullName: string): string {
    // 🔍 DEBUG: Log entrada da função
    if (fullName?.includes('Felipe')) {
      console.log('🔍 DEBUG formatDisplayNameForCache INPUT:', {
        fullName,
        type: typeof fullName,
        length: fullName?.length,
        trimmed: fullName?.trim(),
        includesSpace: fullName?.includes(' ')
      });
    }
    
    if (!fullName || fullName.trim() === '') return 'Anonymous';
    
    // Se parece com user_id (sem espaços), gerar nome anônimo
    if (!fullName.includes(' ')) {
      const firstChar = fullName.charAt(0).toUpperCase();
      const hash = fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const number = (hash % 999) + 1;
      const result = `User ${firstChar}${number}`;
      
      // 🔍 DEBUG: Log quando gera User X
      if (fullName?.includes('Felipe')) {
        console.log('🔍 DEBUG formatDisplayNameForCache NO SPACE PATH:', {
          fullName,
          firstChar,
          hash,
          number,
          result
        });
      }
      
      return result;
    }
    
    // ✅ RESTAURADO: Formatar nome real (Primeiro Nome + Inicial do Último)
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    const result = `${firstName} ${lastInitial}.`;
    
    // 🔍 DEBUG: Log quando formata nome real
    if (fullName?.includes('Felipe')) {
      console.log('🔍 DEBUG formatDisplayNameForCache REAL NAME PATH:', {
        fullName,
        parts,
        firstName,
        lastInitial,
        result
      });
    }
    
    return result;
  }

  /**
   * Gerar cor determinística para avatar
   */
  private generateAvatarColorForCache(name: string): string {
    // ✅ CORRIGIDO: Verificar se name existe e não é vazio
    if (!name || typeof name !== 'string' || name.trim() === '') {
      name = 'Anonymous'; // Fallback para nome padrão
    }
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Testar e inicializar o sistema de leaderboard
   */
  async testAndInitializeLeaderboard() {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for testAndInitializeLeaderboard');
      return false;
    }

    try {
      console.log('🔍 Testing leaderboard system...');

      // 1. Verificar se as tabelas existem
      const { data: tables, error: tablesError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['user_progress', 'user_leaderboard_cache']);

      if (tablesError) {
        console.error('❌ Error checking tables:', tablesError);
        return false;
      }

      console.log('📋 Available tables:', tables?.map(t => t.table_name));

      // 2. Verificar quantos usuários existem
      const { count: userCount, error: userCountError } = await this.supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true });

      if (userCountError) {
        console.error('❌ Error counting users:', userCountError);
        return false;
      }

      console.log('👥 Total users in user_progress:', userCount);

      // 3. Verificar cache do leaderboard
      const { count: cacheCount, error: cacheCountError } = await this.supabase
        .from('user_leaderboard_cache')
        .select('*', { count: 'exact', head: true });

      if (cacheCountError) {
        console.error('❌ Error counting leaderboard cache:', cacheCountError);
        return false;
      }

      console.log('📊 Total entries in leaderboard cache:', cacheCount);

      // 4. Se não há cache, popular
      if (cacheCount === 0 && userCount && userCount > 0) {
        console.log('🔄 Populating leaderboard cache...');
        const populated = await this.populateLeaderboardCache();
        
        if (populated) {
          console.log('✅ Leaderboard cache populated successfully');
        } else {
          console.error('❌ Failed to populate leaderboard cache');
          return false;
        }
      }

      // 5. Testar busca por nível
      for (const level of ['Novice', 'Inter', 'Advanced']) {
        const { data: levelData, error: levelError } = await this.supabase
          .from('user_leaderboard_cache')
          .select('*')
          .eq('user_level', level)
          .limit(5);

        if (levelError) {
          console.error(`❌ Error fetching ${level} leaderboard:`, levelError);
        } else {
          console.log(`📈 ${level} leaderboard entries:`, levelData?.length || 0);
        }
      }

      console.log('✅ Leaderboard system test completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception testing leaderboard system:', error);
      return false;
    }
  }

  /**
   * Buscar avatar do usuário (Entra ID ou placeholder)
   */
  async getUserAvatar(userId: string): Promise<{ avatarUrl: string | null; fallbackInitial: string; fallbackColor: string }> {
    if (!this.supabase) {
      return { avatarUrl: null, fallbackInitial: 'U', fallbackColor: '#A3FF3C' };
    }

    try {
      // Buscar dados do usuário na tabela users (Entra ID)
      const { data: user, error } = await this.supabase
        .from('users')
        .select('name, entra_id')
        .eq('entra_id', userId)
        .single();

      if (error || !user) {
        console.log('❌ User not found for avatar:', userId);
        return { 
          avatarUrl: null, 
          fallbackInitial: userId.charAt(0).toUpperCase(), 
          fallbackColor: this.generateAvatarColorForCache(userId) 
        };
      }

      // ✅ INTEGRAÇÃO COM MICROSOFT GRAPH API
      try {
        // Importar o serviço de avatar do Graph (dynamic import para evitar problemas de SSR)
        const { graphAvatarService } = await import('./microsoft-graph-avatar-service');
        
        // Buscar avatar real do Microsoft Graph
        const graphResult = await graphAvatarService.getUserAvatarCached(userId, user.name);
        
        if (graphResult.avatarUrl) {
          console.log('✅ Successfully loaded avatar from Microsoft Graph for:', user.name);
          return graphResult;
        }
        // Fallback silencioso para usuários sem foto de perfil
      } catch (graphError) {
        console.warn('⚠️ Microsoft Graph API not available, using fallback:', graphError);
      }

      // Fallback com dados reais do usuário
      const name = user.name || 'Anonymous';
      const initial = name.charAt(0).toUpperCase();
      const color = this.generateAvatarColorForCache(name);

      return {
        avatarUrl: null, // Será null se Graph API não estiver disponível
        fallbackInitial: initial,
        fallbackColor: color
      };

    } catch (error) {
      console.error('❌ Error getting user avatar:', error);
      return { 
        avatarUrl: null, 
        fallbackInitial: 'U', 
        fallbackColor: '#A3FF3C' 
      };
    }
  }

  /**
   * Forçar atualização do cache do leaderboard
   */
  async forceRefreshLeaderboard() {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for forceRefreshLeaderboard');
      return false;
    }

    try {
      console.log('🔄 Force refreshing leaderboard cache...');
      
      // Limpar cache existente
      console.log('🗑️ Clearing existing cache...');
      await this.supabase
        .from('user_leaderboard_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Repopular com dados corretos
      const success = await this.populateLeaderboardCache();
      
      if (success) {
        console.log('✅ Leaderboard cache refreshed successfully');
      } else {
        console.error('❌ Failed to refresh leaderboard cache');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Exception force refreshing leaderboard:', error);
      return false;
    }
  }

  // 🔓 PUBLIC METHODS FOR ACHIEVEMENT VERIFICATION
  
  /**
   * Get achievements from database
   */
  async getAchievements(isActive: boolean = true) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getAchievements');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('achievements')
        .select('*')
        .eq('is_active', isActive)
        .order('sort_order');

      if (error) {
        console.error('❌ Error fetching achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching achievements:', error);
      return [];
    }
  }

  /**
   * Get user's earned achievement codes
   */
  async getUserAchievementCodes(userId: string) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getUserAchievementCodes');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('user_achievements')
        .select('achievement_code')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching user achievement codes:', error);
        return [];
      }

      return data?.map(ua => ua.achievement_code) || [];
    } catch (error) {
      console.error('❌ Exception fetching user achievement codes:', error);
      return [];
    }
  }

  /**
   * Get user practices for stats calculation
   */
  async getUserPracticesForStats(userId: string) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getUserPracticesForStats');
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('user_practices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user practices for stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Exception fetching user practices for stats:', error);
      return [];
    }
  }

  /**
   * Get user vocabulary count
   */
  async getUserVocabularyCount(userId: string) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for getUserVocabularyCount');
      return 0;
    }

    try {
      const { count, error } = await this.supabase
        .from('user_vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching user vocabulary count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Exception fetching user vocabulary count:', error);
      return 0;
    }
  }

  /**
   * Save new achievements to database
   */
  async saveNewAchievements(userId: string, achievements: any[]) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for saveNewAchievements');
      return false;
    }

    // Verificar se há achievements para salvar
    if (!achievements || achievements.length === 0) {
      console.log('ℹ️ No achievements to save');
      return true;
    }

    try {
      console.log('💾 Saving achievements to database:', achievements.length);
      console.log('🔍 Sample achievement:', JSON.stringify(achievements[0], null, 2));

      // ✅ CORRIGIDO: Usar service role key para operações de achievements
      const supabaseAdmin = getSupabaseClient();
      if (!supabaseAdmin) {
        throw new Error('Failed to initialize Supabase admin client');
      }

      const { data, error } = await supabaseAdmin
        .from('user_achievements')
        .insert(achievements)
        .select();

      if (error) {
        console.error('❌ Supabase error saving achievements:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      console.log('✅ Achievements saved successfully:', data?.length || 0);
      return true;
    } catch (error) {
      console.error('❌ Exception saving new achievements:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
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