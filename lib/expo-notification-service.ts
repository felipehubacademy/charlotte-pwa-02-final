// lib/expo-notification-service.ts
// Sends push notifications to React Native (Charlotte AI) via Expo Push API

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: 'default';
  priority: 'high';
}

// ── Message template (placeholder {name} replaced per user) ─────────────────
interface MsgTemplate { title: string; body: string }

// Generate a pool of N variant templates in a single GPT call.
// Uses {name} placeholder — replaced per user at send time.
async function generateTemplatePool(
  type: 'reminder' | 'praise',
  isNovice: boolean,
  hasStreak: boolean,
  count = 4,
): Promise<MsgTemplate[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const lang = isNovice ? 'Portuguese (Brazil)' : 'English';
  const streakNote = hasStreak
    ? (isNovice ? 'Muitos estudantes têm sequências em risco hoje.' : 'Many students have streaks at risk today.')
    : '';

    const promptReminder = `You are Charlotte, an AI English teacher. Write ${count} different push notification variants IN FIRST PERSON inviting students to practice today.
- Use {name} as placeholder for the student's first name
- Use {streak} as placeholder for streak days (e.g. "your {streak}-day streak")— only include if it adds value
- Language: ${lang}
- Tone: warm, personal, gently motivating — like a friend checking in
- Write in FIRST PERSON as Charlotte ("I", "me", "my")
${streakNote ? `- Context: ${streakNote}` : ''}
- Title: 4-6 words max, use 1 relevant emoji
- Body: 1 sentence max (under 90 chars), include {name}, first person
- Example: "I saved a spot for you today, {name} — don't lose that {streak}-day streak!"
Return ONLY valid JSON: {"variants": [{"title": "...", "body": "..."}, ...]}`;

  const promptPraise = `You are Charlotte, a warm and encouraging English AI teacher. Write ${count} different push notification variants IN FIRST PERSON celebrating students who practiced today.
- Use {name} as placeholder for the student's first name
- Use {xp} as placeholder for XP earned today (e.g. "{xp} XP")
- Use {streak} as placeholder for streak days (e.g. "{streak}-day streak") — only include if it adds value
- Language: ${lang}
- Tone: warm, personal, genuinely proud — like a teacher celebrating effort
- Write in FIRST PERSON as Charlotte ("I", "me", "my")
- Title: 4-6 words max, use 1 relevant emoji
- Body: 1 sentence max (under 90 chars), include {name}, mention {xp}, first person
- Example: "I loved our session today, {name} — {xp} XP and your {streak}-day streak is alive!"
Return ONLY valid JSON: {"variants": [{"title": "...", "body": "..."}, ...]}`;

  if (!OPENAI_API_KEY) return [];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: type === 'reminder' ? promptReminder : promptPraise }],
        temperature: 0.9,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });
    const json = await res.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? '{}');
    if (Array.isArray(parsed.variants) && parsed.variants.length > 0) return parsed.variants;
  } catch (e) {
    console.warn('⚠️ [Expo] GPT pool generation failed:', e);
  }
  return [];
}

// Pick a random template and replace {name}, {xp}, {streak} placeholders
function pickTemplate(
  pool: MsgTemplate[],
  fallback: MsgTemplate,
  firstName: string,
  xp?: number,
  streak?: number,
): MsgTemplate {
  const tpl = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : fallback;
  const replace = (s: string) => s
    .replace(/\{name\}/g, firstName)
    .replace(/\{xp\}/g, xp != null ? String(xp) : '')
    .replace(/\{streak\}/g, streak != null ? String(streak) : '');
  return { title: replace(tpl.title), body: replace(tpl.body) };
}

// ── Core send function ───────────────────────────────────────────────────────
async function sendExpoPush(
  messages: ExpoMessage[],
  supabase?: any,
): Promise<{ sent: number; errors: number }> {
  if (messages.length === 0) return { sent: 0, errors: 0 };

  let sent = 0;
  let errors = 0;
  const BATCH_SIZE = 100;
  const invalidTokens: string[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      const result = await response.json();
      const items = result.data ?? [];
      // Per-token accounting — Expo returns one status entry per message
      // in the same order as the request batch.
      items.forEach((r: any, idx: number) => {
        if (r.status === 'ok') {
          sent += 1;
        } else {
          errors += 1;
          const token = batch[idx]?.to ?? '';
          const details = r.details ? ` details=${JSON.stringify(r.details)}` : '';
          console.error(`❌ [Expo] token=${token.slice(0, 30)} error="${r.message ?? 'unknown'}"${details}`);
          // Collect tokens for users who uninstalled or revoked credentials —
          // these are gone for good, drop them from the DB.
          if (r.details?.error === 'DeviceNotRegistered' && token) {
            invalidTokens.push(token);
          }
        }
      });
    } catch (e) {
      console.error('❌ Expo Push batch error:', e);
      errors += batch.length;
    }
  }

  // Token cleanup — null out dead tokens so we stop trying to send to them.
  if (supabase && invalidTokens.length > 0) {
    try {
      const { error } = await supabase
        .from('charlotte_users')
        .update({ expo_push_token: null })
        .in('expo_push_token', invalidTokens);
      if (error) {
        console.warn('⚠️ [Expo] token cleanup error:', error.message);
      } else {
        console.log(`🧹 [Expo] Cleared ${invalidTokens.length} dead token(s)`);
      }
    } catch (e) {
      console.warn('⚠️ [Expo] token cleanup exception:', e);
    }
  }

  return { sent, errors };
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Fetch charlotte_users rows for a list of user_ids (token + name + level). */
async function fetchCharlotteUsers(supabase: any, userIds: string[]) {
  if (!userIds.length) return [];
  const { data } = await supabase
    .from('charlotte_users')
    .select('id, name, expo_push_token, charlotte_level')
    .in('id', userIds)
    .not('expo_push_token', 'is', null);
  return (data ?? []).filter((u: any) => u.expo_push_token?.startsWith('ExponentPushToken['));
}

// ── 1. Streak reminders ──────────────────────────────────────────────────────
export async function sendStreakReminders(supabase: any): Promise<void> {
  console.log('🔥 [Expo] Checking streak reminders...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1) Fetch user_ids who practiced today (raw list — PostgREST does not
    //    support inline SQL subqueries, so we do it in two queries).
    const { data: practicedRows, error: practicedErr } = await supabase
      .from('charlotte_practices')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00Z`);
    if (practicedErr) { console.error('❌ [Expo] practices query error:', practicedErr.message); return; }
    const practicedIds = [...new Set((practicedRows ?? []).map((r: any) => r.user_id))] as string[];

    // 2) Users with streak > 0 who haven't practiced today.
    let q = supabase
      .from('charlotte_progress')
      .select('user_id, streak_days')
      .gt('streak_days', 0);
    if (practicedIds.length) {
      q = q.not('user_id', 'in', `(${practicedIds.map(id => `"${id}"`).join(',')})`);
    }
    const { data: atRisk, error: atRiskErr } = await q;
    if (atRiskErr) { console.error('❌ [Expo] at-risk query error:', atRiskErr.message); return; }

    if (!atRisk?.length) { console.log('✅ [Expo] No streak risks today'); return; }

    const userIds = atRisk.map((r: any) => r.user_id);
    const cuUsers = await fetchCharlotteUsers(supabase, userIds);
    const streakMap = Object.fromEntries(atRisk.map((r: any) => [r.user_id, r.streak_days]));

    const messages: ExpoMessage[] = cuUsers.map((u: any) => {
      const days = streakMap[u.id] ?? 1;
      return {
        to: u.expo_push_token,
        title: '🔥 Streak em risco!',
        body: `Sua sequência de ${days} ${days === 1 ? 'dia' : 'dias'} está em risco. Pratique agora com a Charlotte!`,
        data: { screen: 'chat', type: 'streak_reminder' },
        sound: 'default',
        priority: 'high',
      };
    });

    const { sent, errors } = await sendExpoPush(messages, supabase);
    console.log(`✅ [Expo] Streak reminders: ${sent} sent, ${errors} errors`);
  } catch (e) {
    console.error('❌ [Expo] Streak reminder error:', e);
  }
}

// ── 2. Daily reminder ────────────────────────────────────────────────────────
export async function sendDailyReminders(supabase: any): Promise<void> {
  console.log('⏰ [Expo] Sending daily reminders...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1) Fetch user_ids who practiced today (PostgREST doesn't support inline
    //    SQL subqueries, so we split into two queries).
    const { data: practicedRows, error: practicedErr } = await supabase
      .from('charlotte_practices')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00Z`);
    if (practicedErr) { console.error('❌ [Expo] practices query error:', practicedErr.message); return; }
    const practicedIds = [...new Set((practicedRows ?? []).map((r: any) => r.user_id))] as string[];

    // 2) Users with token who haven't practiced today.
    let q = supabase
      .from('charlotte_users')
      .select('id, name, expo_push_token, charlotte_level')
      .not('expo_push_token', 'is', null);
    if (practicedIds.length) {
      q = q.not('id', 'in', `(${practicedIds.map(id => `"${id}"`).join(',')})`);
    }
    const { data: cuUsers, error: usersErr } = await q;
    if (usersErr) { console.error('❌ [Expo] users query error:', usersErr.message); return; }

    const eligible = (cuUsers ?? []).filter((u: any) =>
      u.expo_push_token?.startsWith('ExponentPushToken[')
    );
    if (!eligible.length) { console.log('✅ [Expo] No eligible users for daily reminder'); return; }

    const userIds = eligible.map((u: any) => u.id);
    const { data: progRows } = await supabase
      .from('charlotte_progress')
      .select('user_id, streak_days')
      .in('user_id', userIds);
    const streakMap = Object.fromEntries((progRows ?? []).map((r: any) => [r.user_id, r.streak_days ?? 0]));

    const hasAnyStreak = eligible.some((u: any) => (streakMap[u.id] ?? 0) > 0);

    // Generate 2 pools (Novice PT + Advanced EN) — 2 GPT calls total regardless of user count
    const [poolNovice, poolAdvanced] = await Promise.all([
      generateTemplatePool('reminder', true,  hasAnyStreak),
      generateTemplatePool('reminder', false, hasAnyStreak),
    ]);

    const fallbackNovice   = { title: '📚 Hora de praticar!', body: '{name}, a Charlotte está esperando por você hoje!' };
    const fallbackAdvanced = { title: '📚 Time to practice!', body: '{name}, Charlotte is ready for you today!' };

    console.log(`⏰ [Expo] Sending reminders to ${eligible.length} users...`);

    const messages: ExpoMessage[] = eligible.map((u: any) => {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const isNovice  = u.charlotte_level === 'Novice';
      const streak    = streakMap[u.id] ?? 0;
      const msg = pickTemplate(isNovice ? poolNovice : poolAdvanced, isNovice ? fallbackNovice : fallbackAdvanced, firstName, undefined, streak > 0 ? streak : undefined);
      return { to: u.expo_push_token, ...msg, data: { screen: 'chat', type: 'daily_reminder' }, sound: 'default', priority: 'high' };
    });

    const { sent, errors } = await sendExpoPush(messages, supabase);
    console.log(`✅ [Expo] Daily reminders: ${sent} sent, ${errors} errors`);
  } catch (e) {
    console.error('❌ [Expo] Daily reminder error:', e);
  }
}

// ── 3. Charlotte message (motivational) ─────────────────────────────────────
export async function sendCharlotteMessages(supabase: any): Promise<void> {
  console.log('💬 [Expo] Sending Charlotte praise messages...');
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: practicedRows } = await supabase
      .from('charlotte_practices')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00Z`);

    const practicedIds = [...new Set((practicedRows ?? []).map((r: any) => r.user_id))] as string[];
    if (!practicedIds.length) { console.log('✅ [Expo] No users practiced today yet'); return; }

    const cuUsers = await fetchCharlotteUsers(supabase, practicedIds);
    if (!cuUsers.length) return;

    // Fetch XP and streak per user
    const { data: progRows } = await supabase
      .from('charlotte_progress')
      .select('user_id, streak_days, total_xp')
      .in('user_id', practicedIds);
    const xpMap     = Object.fromEntries((progRows ?? []).map((r: any) => [r.user_id, r.total_xp ?? 0]));
    const streakMap = Object.fromEntries((progRows ?? []).map((r: any) => [r.user_id, r.streak_days ?? 0]));

    // Fetch today XP from charlotte_practices
    const { data: todayRows } = await supabase
      .from('charlotte_practices')
      .select('user_id, xp_earned')
      .gte('created_at', `${today}T00:00:00Z`);
    const todayXpMap: Record<string, number> = {};
    for (const r of (todayRows ?? [])) {
      todayXpMap[r.user_id] = (todayXpMap[r.user_id] ?? 0) + (r.xp_earned ?? 0);
    }

    // Generate 2 pools (Novice PT + Advanced EN) — 2 GPT calls total
    const [poolNovice, poolAdvanced] = await Promise.all([
      generateTemplatePool('praise', true,  false),
      generateTemplatePool('praise', false, false),
    ]);

    const fallbackNovice   = { title: 'Otimo trabalho hoje!', body: '{name}, voce praticou hoje e ganhou {xp} XP! Continue assim.' };
    const fallbackAdvanced = { title: 'Great work today!',    body: '{name}, you practiced today and earned {xp} XP! Keep it up.' };

    console.log(`💬 [Expo] Sending praise to ${cuUsers.length} users...`);

    const messages: ExpoMessage[] = cuUsers.map((u: any) => {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const isNovice  = u.charlotte_level === 'Novice';
      const xp        = todayXpMap[u.id] ?? 0;
      const streak    = streakMap[u.id] ?? 0;
      const msg = pickTemplate(isNovice ? poolNovice : poolAdvanced, isNovice ? fallbackNovice : fallbackAdvanced, firstName, xp > 0 ? xp : undefined, streak > 0 ? streak : undefined);
      return { to: u.expo_push_token, ...msg, data: { screen: 'chat', type: 'charlotte_message' }, sound: 'default', priority: 'high' };
    });

    const { sent, errors } = await sendExpoPush(messages, supabase);
    console.log(`✅ [Expo] Charlotte praise: ${sent} sent, ${errors} errors`);
  } catch (e) {
    console.error('❌ [Expo] Charlotte message error:', e);
  }
}

// ── 4. XP milestone (called from server after XP is awarded) ────────────────
export async function sendXPMilestoneNotification(
  supabase: any,
  userId: string,
  milestone: number
): Promise<void> {
  try {
    const { data: user } = await supabase
      .from('charlotte_users')
      .select('expo_push_token, name')
      .eq('id', userId)
      .single();

    if (!user?.expo_push_token?.startsWith('ExponentPushToken[')) return;

    const firstName = user.name?.split(' ')[0] ?? 'Você';
    await sendExpoPush([{
      to: user.expo_push_token,
      title: '🎉 Marco alcançado!',
      body: `${firstName} chegou a ${milestone.toLocaleString('pt-BR')} XP! Continue praticando!`,
      data: { screen: 'chat', type: 'xp_milestone', milestone },
      sound: 'default',
      priority: 'high',
    }], supabase);

    console.log(`✅ [Expo] XP milestone ${milestone} sent to ${userId}`);
  } catch (e) {
    console.error('❌ [Expo] XP milestone error:', e);
  }
}

// ── 5. Goal reminders ────────────────────────────────────────────────────────
// Users close to their weekly XP goal (80–99% of WEEKLY_XP_GOAL) get a nudge
// in late afternoon. Helps convert near-misses into completed weeks.
const WEEKLY_XP_GOAL = 100;

export async function sendGoalReminders(supabase: any): Promise<void> {
  console.log('🎯 [Expo] Checking goal reminders...');
  try {
    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7)); // Mon start

    // Sum XP per user this week
    const { data: rows, error } = await supabase
      .from('charlotte_practices')
      .select('user_id, xp_earned')
      .gte('created_at', weekStart.toISOString());
    if (error) { console.error('❌ [Expo] goal query error:', error.message); return; }

    const xpByUser = new Map<string, number>();
    for (const r of (rows ?? []) as any[]) {
      xpByUser.set(r.user_id, (xpByUser.get(r.user_id) ?? 0) + (r.xp_earned ?? 0));
    }

    const near = Array.from(xpByUser.entries())
      .filter(([, xp]) => xp >= WEEKLY_XP_GOAL * 0.8 && xp < WEEKLY_XP_GOAL)
      .map(([userId, xp]) => ({ userId, xp, missing: WEEKLY_XP_GOAL - xp }));

    if (!near.length) { console.log('✅ [Expo] No users near weekly goal'); return; }

    const cuUsers = await fetchCharlotteUsers(supabase, near.map(n => n.userId));
    const missingMap = Object.fromEntries(near.map(n => [n.userId, n.missing]));

    const messages: ExpoMessage[] = cuUsers.map((u: any) => {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const isNovice  = u.charlotte_level === 'Novice';
      const missing   = missingMap[u.id] ?? 0;
      const title = isNovice ? '🎯 Meta quase lá!' : '🎯 Almost at your goal!';
      const body  = isNovice
        ? `${firstName}, só faltam ${missing} XP para completar sua meta semanal!`
        : `${firstName}, only ${missing} XP to hit your weekly goal!`;
      return {
        to: u.expo_push_token,
        title, body,
        data: { screen: 'chat', type: 'goal_reminder', missingXP: missing },
        sound: 'default',
        priority: 'high',
      };
    });

    const { sent, errors } = await sendExpoPush(messages, supabase);
    console.log(`✅ [Expo] Goal reminders: ${sent} sent, ${errors} errors`);
  } catch (e) {
    console.error('❌ [Expo] Goal reminder error:', e);
  }
}

// ── 6. Weekly challenge ──────────────────────────────────────────────────────
// Monday morning broadcast to users who practiced at least once last week.
// Challenge title rotates deterministically by ISO week number so everyone
// receives the same theme at the same time.
const WEEKLY_CHALLENGES_PT = [
  { title: '💪 Desafio da semana', body: 'Essa semana, fale 3 frases em inglês sobre seu final de semana!' },
  { title: '🎧 Desafio da semana', body: 'Ouça a Charlotte e repita 5 frases com entonação natural.' },
  { title: '📝 Desafio da semana', body: 'Escreva um parágrafo sobre um hobby usando o passado simples.' },
  { title: '🗣️ Desafio da semana', body: 'Conte uma história curta em 1 minuto — sem pausas!' },
  { title: '🔁 Desafio da semana', body: 'Use 3 phrasal verbs novos em conversas esta semana.' },
  { title: '✨ Desafio da semana', body: 'Pronuncie as vogais longas/curtas em 5 palavras diferentes.' },
  { title: '🎯 Desafio da semana', body: 'Faça 5 sessões de chat de pelo menos 3 minutos cada.' },
  { title: '🔥 Desafio da semana', body: 'Complete 7 dias de streak — um pouquinho por dia!' },
];
const WEEKLY_CHALLENGES_EN = [
  { title: '💪 Weekly challenge', body: 'This week, say 3 sentences about your weekend in English!' },
  { title: '🎧 Weekly challenge', body: 'Listen to Charlotte and repeat 5 phrases with natural intonation.' },
  { title: '📝 Weekly challenge', body: 'Write a paragraph about a hobby using the simple past.' },
  { title: '🗣️ Weekly challenge', body: 'Tell a short story in 1 minute — no pauses!' },
  { title: '🔁 Weekly challenge', body: 'Use 3 new phrasal verbs in conversations this week.' },
  { title: '✨ Weekly challenge', body: 'Pronounce long/short vowels in 5 different words.' },
  { title: '🎯 Weekly challenge', body: 'Do 5 chat sessions of at least 3 minutes each.' },
  { title: '🔥 Weekly challenge', body: 'Keep a 7-day streak — a little every day!' },
];

function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function sendWeeklyChallenges(supabase: any): Promise<void> {
  console.log('💪 [Expo] Sending weekly challenges...');
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 86400000);

    // Users active in last 7 days
    const { data: activeRows, error: activeErr } = await supabase
      .from('charlotte_practices')
      .select('user_id')
      .gte('created_at', lastWeek.toISOString());
    if (activeErr) { console.error('❌ [Expo] active-users query error:', activeErr.message); return; }
    const activeIds = [...new Set((activeRows ?? []).map((r: any) => r.user_id))] as string[];
    if (!activeIds.length) { console.log('✅ [Expo] No active users last week'); return; }

    const cuUsers = await fetchCharlotteUsers(supabase, activeIds);
    if (!cuUsers.length) return;

    const weekIdx = isoWeekNumber(now) % WEEKLY_CHALLENGES_PT.length;
    const chPt = WEEKLY_CHALLENGES_PT[weekIdx];
    const chEn = WEEKLY_CHALLENGES_EN[weekIdx];

    const messages: ExpoMessage[] = cuUsers.map((u: any) => {
      const isNovice = u.charlotte_level === 'Novice';
      const ch = isNovice ? chPt : chEn;
      return {
        to: u.expo_push_token,
        title: ch.title,
        body: ch.body,
        data: { screen: 'chat', type: 'weekly_challenge', weekIdx },
        sound: 'default',
        priority: 'high',
      };
    });

    const { sent, errors } = await sendExpoPush(messages, supabase);
    console.log(`✅ [Expo] Weekly challenges: ${sent} sent, ${errors} errors (week ${weekIdx})`);
  } catch (e) {
    console.error('❌ [Expo] Weekly challenge error:', e);
  }
}
