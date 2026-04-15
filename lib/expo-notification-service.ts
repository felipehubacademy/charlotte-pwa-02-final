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

// ── GPT-generated daily reminder (hasn't practiced yet) ─────────────────────
async function generateReminderMessage(
  firstName: string,
  level: string,
  streakDays: number,
): Promise<{ title: string; body: string }> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return { title: '📚 Hora de praticar!', body: `${firstName}, a Charlotte está esperando por você hoje!` };
  }

  const isNovice = level === 'Novice';
  const lang = isNovice ? 'Portuguese (Brazil)' : 'English';
  const streakNote = streakDays > 1
    ? (isNovice
        ? `Atenção: eles têm uma sequência de ${streakDays} dias que pode ser perdida hoje!`
        : `Heads up: they have a ${streakDays}-day streak at risk today!`)
    : '';

  const prompt = `You are Charlotte, an AI English teacher. Write a push notification IN FIRST PERSON inviting a student to practice today — they haven't practiced yet.
- Student first name: ${firstName}
- Level: ${level}
${streakNote ? `- Extra context: ${streakNote}` : ''}
- Language: Write in ${lang}
- Tone: warm, personal, gently motivating — like a friend checking in, NOT pushy or guilt-tripping
- Write in FIRST PERSON as Charlotte ("I", "me", "my") — never refer to yourself in third person
- Title: 4-6 words max, use 1 relevant emoji
- Body: 1 sentence max (under 90 chars), mention their name, first person
- Example body: "I saved a spot for you today, Felipe — come chat with me!"
Return ONLY valid JSON: {"title": "...", "body": "..."}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 80,
        response_format: { type: 'json_object' },
      }),
    });
    const json = await res.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? '{}');
    if (parsed.title && parsed.body) return parsed;
  } catch (e) {
    console.warn('⚠️ [Expo] GPT reminder generation failed, using fallback:', e);
  }

  return isNovice
    ? { title: '📚 Hora de praticar!', body: `${firstName}, a Charlotte está esperando por você hoje!` }
    : { title: '📚 Time to practice!', body: `${firstName}, Charlotte is ready for you today!` };
}

// ── GPT-generated Charlotte message ─────────────────────────────────────────
async function generateCharlotteMessage(
  firstName: string,
  level: string,
  streakDays: number,
  todayXP: number,
): Promise<{ title: string; body: string }> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    // Fallback if key missing
    return { title: '🌟 Great work today!', body: `${firstName}, you practiced today! Keep it up.` };
  }

  const isNovice = level === 'Novice';
  const lang = isNovice ? 'Portuguese (Brazil)' : 'English';
  const streakNote = streakDays > 1
    ? (isNovice ? `Ela está em uma sequência de ${streakDays} dias!` : `They're on a ${streakDays}-day streak!`)
    : '';

  const prompt = `You are Charlotte, a warm and encouraging English AI teacher.
Write a short push notification (title + body) celebrating a student who just practiced English today.
- Student first name: ${firstName}
- Level: ${level}
- Today's XP earned: ${todayXP}
${streakNote ? `- Extra context: ${streakNote}` : ''}
- Language: Write in ${lang}
- Tone: warm, personal, genuinely proud — like a teacher celebrating their student's effort
- Write in FIRST PERSON as Charlotte ("I", "me", "my") — never refer to yourself in third person
- Title: 4-6 words max, use 1 relevant emoji
- Body: 1 sentence max (under 90 chars), mention their name, first person, be specific
- Example body: "I loved our session today, ${firstName} — ${todayXP} XP and counting!"
Return ONLY valid JSON: {"title": "...", "body": "..."}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 80,
        response_format: { type: 'json_object' },
      }),
    });
    const json = await res.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? '{}');
    if (parsed.title && parsed.body) return parsed;
  } catch (e) {
    console.warn('⚠️ [Expo] GPT message generation failed, using fallback:', e);
  }

  // Fallback
  return isNovice
    ? { title: '🌟 Ótimo trabalho hoje!', body: `${firstName}, você praticou hoje! Continue assim.` }
    : { title: '🌟 Great work today!', body: `${firstName}, you practiced today! Keep it up.` };
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
      sent += items.filter((r: any) => r.status === 'ok').length;
      errors += items.filter((r: any) => r.status === 'error').length;
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

    // Users with streak > 0 who haven't practiced today
    const { data: atRisk } = await supabase
      .from('charlotte_progress')
      .select('user_id, streak_days')
      .gt('streak_days', 0)
      .not('user_id', 'in',
        `(SELECT DISTINCT user_id FROM charlotte_practices WHERE created_at::date = '${today}')`
      );

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
  console.log('⏰ [Expo] Sending personalized daily reminders...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // charlotte_users who have a token and haven't practiced today
    const { data: cuUsers } = await supabase
      .from('charlotte_users')
      .select('id, name, expo_push_token, charlotte_level')
      .not('expo_push_token', 'is', null)
      .not('id', 'in',
        `(SELECT DISTINCT user_id FROM charlotte_practices WHERE created_at::date = '${today}')`
      );

    const eligible = (cuUsers ?? []).filter((u: any) =>
      u.expo_push_token?.startsWith('ExponentPushToken[')
    );

    if (!eligible.length) { console.log('✅ [Expo] All users practiced today'); return; }

    // Fetch streaks for eligible users
    const userIds = eligible.map((u: any) => u.id);
    const { data: progRows } = await supabase
      .from('charlotte_progress')
      .select('user_id, streak_days')
      .in('user_id', userIds);
    const streakMap = Object.fromEntries((progRows ?? []).map((r: any) => [r.user_id, r.streak_days]));

    console.log(`⏰ [Expo] Generating reminders for ${eligible.length} users...`);

    const messages: ExpoMessage[] = [];
    for (const u of eligible) {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const streakDays = streakMap[u.id] ?? 0;
      const msg = await generateReminderMessage(firstName, u.charlotte_level ?? 'Inter', streakDays);
      messages.push({
        to: u.expo_push_token,
        title: msg.title,
        body: msg.body,
        data: { screen: 'chat', type: 'daily_reminder' },
        sound: 'default',
        priority: 'high',
      });
    }

    const { sent, errors } = await sendExpoPush(messages);
    console.log(`✅ [Expo] Daily reminders: ${sent} sent, ${errors} errors`);
  } catch (e) {
    console.error('❌ [Expo] Daily reminder error:', e);
  }
}

// ── 3. Charlotte message (motivational) ─────────────────────────────────────
export async function sendCharlotteMessages(supabase: any): Promise<void> {
  console.log('💬 [Expo] Sending Charlotte praise messages to users who practiced today...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // Users who practiced today via charlotte_practices
    const { data: practicedRows } = await supabase
      .from('charlotte_practices')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00Z`);

    const practicedIds = [...new Set((practicedRows ?? []).map((r: any) => r.user_id))] as string[];
    if (!practicedIds.length) { console.log('✅ [Expo] No users practiced today yet'); return; }

    const cuUsers = await fetchCharlotteUsers(supabase, practicedIds);
    if (!cuUsers.length) return;

    // Fetch streaks + today XP for these users
    const { data: progRows } = await supabase
      .from('charlotte_progress')
      .select('user_id, streak_days')
      .in('user_id', practicedIds);
    const streakMap = Object.fromEntries((progRows ?? []).map((r: any) => [r.user_id, r.streak_days]));

    const { data: xpRows } = await supabase
      .from('charlotte_practices')
      .select('user_id, xp_earned')
      .in('user_id', practicedIds)
      .gte('created_at', `${today}T00:00:00Z`);
    const xpMap: Record<string, number> = {};
    for (const r of (xpRows ?? [])) {
      xpMap[r.user_id] = (xpMap[r.user_id] ?? 0) + (r.xp_earned ?? 0);
    }

    console.log(`💬 [Expo] Generating personalized messages for ${cuUsers.length} users...`);

    const messages: ExpoMessage[] = [];
    for (const u of cuUsers) {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const msg = await generateCharlotteMessage(
        firstName,
        u.charlotte_level ?? 'Inter',
        streakMap[u.id] ?? 0,
        xpMap[u.id] ?? 0
      );
      messages.push({
        to: u.expo_push_token,
        title: msg.title,
        body: msg.body,
        data: { screen: 'chat', type: 'charlotte_message' },
        sound: 'default',
        priority: 'high',
      });
    }

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
