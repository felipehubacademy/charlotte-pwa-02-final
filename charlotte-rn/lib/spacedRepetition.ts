// lib/spacedRepetition.ts
// Sistema de revisão espaçada: re-quiz de tópicos concluídos a 3, 7, 14, 30 dias.
// Também gerencia o tracking de erros em exercícios.

import { supabase } from './supabase';

// ── Intervalos de revisão (dias) ────────────────────────────────────────────

const REVIEW_INTERVALS = [3, 7, 14, 30];

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ReviewItem {
  id: number;
  userLevel: string;
  moduleIndex: number;
  topicIndex: number;
  topicTitle: string;
  reviewInterval: number;
  reviewDue: string;       // 'YYYY-MM-DD'
}

export interface ExerciseError {
  userLevel: string;
  moduleIndex: number;
  topicIndex: number;
  exerciseType: string;
  exerciseData: Record<string, unknown>;
}

// ── Agendar revisões quando tópico é concluído ──────────────────────────────

/**
 * Chamado quando o usuário conclui um tópico.
 * Cria 4 entradas de revisão: 3, 7, 14, 30 dias a partir de agora.
 */
export async function scheduleReviews(
  userId: string,
  level: string,
  moduleIndex: number,
  topicIndex: number,
  topicTitle: string,
): Promise<void> {
  const now = new Date();
  const completedAt = now.toISOString();

  const rows = REVIEW_INTERVALS.map(days => {
    const due = new Date(now);
    due.setDate(due.getDate() + days);
    const dueDateStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;

    return {
      user_id:         userId,
      user_level:      level,
      module_index:    moduleIndex,
      topic_index:     topicIndex,
      topic_title:     topicTitle,
      completed_at:    completedAt,
      review_interval: days,
      review_due:      dueDateStr,
    };
  });

  const { error } = await supabase
    .from('charlotte_review_schedule')
    .insert(rows);

  if (error) console.warn('[spacedRep] schedule error:', error.message);
}

// ── Buscar revisões pendentes (due hoje ou antes) ───────────────────────────

export async function getPendingReviews(userId: string): Promise<ReviewItem[]> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('charlotte_review_schedule')
    .select('id, user_level, module_index, topic_index, topic_title, review_interval, review_due')
    .eq('user_id', userId)
    .eq('review_done', false)
    .lte('review_due', todayStr)
    .order('review_due', { ascending: true })
    .limit(10);

  if (error) {
    console.warn('[spacedRep] getPending error:', error.message);
    return [];
  }

  return (data ?? []).map(r => ({
    id:             r.id,
    userLevel:      r.user_level,
    moduleIndex:    r.module_index,
    topicIndex:     r.topic_index,
    topicTitle:     r.topic_title ?? '',
    reviewInterval: r.review_interval,
    reviewDue:      r.review_due,
  }));
}

// ── Marcar revisão como concluída ───────────────────────────────────────────

export async function markReviewDone(reviewId: number): Promise<void> {
  const { error } = await supabase
    .from('charlotte_review_schedule')
    .update({
      review_done:    true,
      review_done_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) console.warn('[spacedRep] markDone error:', error.message);
}

// ── Reagendar revisão com erros ─────────────────────────────────────────────

/**
 * Reschedula uma revisão que teve erros: marca a atual como concluída e
 * agenda uma nova revisão em 3 dias (menor intervalo) para reforço.
 */
export async function rescheduleReview(
  reviewId: number,
  userId: string,
  level: string,
  moduleIndex: number,
  topicIndex: number,
  topicTitle: string,
): Promise<void> {
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 3);
  const dueDateStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;

  await Promise.all([
    // Mark current review done
    supabase
      .from('charlotte_review_schedule')
      .update({ review_done: true, review_done_at: now.toISOString() })
      .eq('id', reviewId),
    // Insert new review in 3 days (upsert to avoid duplicates if already exists)
    supabase
      .from('charlotte_review_schedule')
      .upsert({
        user_id: userId,
        user_level: level,
        module_index: moduleIndex,
        topic_index: topicIndex,
        topic_title: topicTitle,
        completed_at: now.toISOString(),
        review_interval: 3,
        review_due: dueDateStr,
        review_done: false,
      }, { onConflict: 'user_id,user_level,module_index,topic_index,review_interval', ignoreDuplicates: false }),
  ]);
}

// ── Registrar erro em exercício ─────────────────────────────────────────────

export async function trackExerciseError(
  userId: string,
  error: ExerciseError,
): Promise<void> {
  const { error: dbErr } = await supabase
    .from('charlotte_exercise_errors')
    .insert({
      user_id:       userId,
      user_level:    error.userLevel,
      module_index:  error.moduleIndex,
      topic_index:   error.topicIndex,
      exercise_type: error.exerciseType,
      exercise_data: error.exerciseData,
    });

  if (dbErr) console.warn('[spacedRep] trackError error:', dbErr.message);
}

// ── Buscar erros frequentes por tópico ──────────────────────────────────────

export async function getErrorsByTopic(
  userId: string,
  level: string,
  moduleIndex: number,
  topicIndex: number,
): Promise<ExerciseError[]> {
  const { data, error } = await supabase
    .from('charlotte_exercise_errors')
    .select('user_level, module_index, topic_index, exercise_type, exercise_data')
    .eq('user_id', userId)
    .eq('user_level', level)
    .eq('module_index', moduleIndex)
    .eq('topic_index', topicIndex)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];

  return (data ?? []).map(r => ({
    userLevel:    r.user_level,
    moduleIndex:  r.module_index,
    topicIndex:   r.topic_index,
    exerciseType: r.exercise_type,
    exerciseData: r.exercise_data,
  }));
}
