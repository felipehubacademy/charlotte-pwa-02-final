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
async function sendExpoPush(messages: ExpoMessage[]): Promise<{ sent: number; errors: number }> {
  if (messages.length === 0) return { sent: 0, errors: 0 };

  let sent = 0;
  let errors = 0;
  const BATCH_SIZE = 100;

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
          const token = batch[idx]?.to?.slice(0, 30) ?? 'unknown';
          const details = r.details ? ` details=${JSON.stringify(r.details)}` : '';
          console.error(`❌ [Expo] token=${token} error="${r.message ?? 'unknown'}"${details}`);
        }
      });
    } catch (e) {
      console.error('❌ Expo Push batch error:', e);
      errors += batch.length;
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

    const { sent, errors } = await sendExpoPush(messages);
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

    const { sent, errors } = await sendExpoPush(messages);
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

    const { sent, errors } = await sendExpoPush(messages);
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
    }]);

    console.log(`✅ [Expo] XP milestone ${milestone} sent to ${userId}`);
  } catch (e) {
    console.error('❌ [Expo] XP milestone error:', e);
  }
}

// ── runAll: called by scheduler ──────────────────────────────────────────────
// Fixed schedule — optimise with analytics once we have data on when users study.
// Current times (UTC):
//   14h UTC = 11h BRT  → daily reminder (morning, before lunch)
//   21h UTC = 18h BRT  → praise for who practiced + streak reminder (end of day)
export async function runExpoNotifications(supabase: any, hour: number): Promise<void> {
  if (hour === 14) {
    // Morning: remind everyone who hasn't practiced yet
    await sendDailyReminders(supabase);
  }

  if (hour === 21) {
    // Evening: celebrate who practiced today + warn streak at risk
    await sendCharlotteMessages(supabase);
    await sendStreakReminders(supabase);
  }
}
