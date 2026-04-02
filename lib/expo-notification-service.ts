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

// ── 1. Streak reminders ──────────────────────────────────────────────────────
export async function sendStreakReminders(supabase: any): Promise<void> {
  console.log('🔥 [Expo] Checking streak reminders...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // Users with streak > 0 who haven't practiced today in EITHER app (PWA or RN)
    const { data: usersAtRisk } = await supabase
      .from('rn_user_progress')
      .select('user_id, streak_days, users!inner(expo_push_token, user_level, name)')
      .gt('streak_days', 0)
      .not('user_id', 'in',
        `(SELECT DISTINCT user_id FROM rn_user_practices WHERE created_at::date = '${today}' UNION SELECT DISTINCT user_id FROM user_practices WHERE created_at::date = '${today}')`
      );

    if (!usersAtRisk?.length) {
      console.log('✅ [Expo] No streak risks today');
      return;
    }

    const messages: ExpoMessage[] = usersAtRisk
      .filter((u: any) => u.users?.expo_push_token?.startsWith('ExponentPushToken['))
      .map((u: any) => ({
        to: u.users.expo_push_token,
        title: '🔥 Streak em risco!',
        body: `Sua sequência de ${u.streak_days} ${u.streak_days === 1 ? 'dia' : 'dias'} está em risco. Pratique agora com a Charlotte!`,
        data: { screen: 'chat', type: 'streak_reminder' },
        sound: 'default',
        priority: 'high',
      }));

    const { sent, errors } = await sendExpoPush(messages);
    console.log(`✅ [Expo] Streak reminders: ${sent} sent, ${errors} errors`);
  } catch (e) {
    console.error('❌ [Expo] Streak reminder error:', e);
  }
}

// ── 2. Daily reminder ────────────────────────────────────────────────────────
export async function sendDailyReminders(supabase: any, currentHour: number): Promise<void> {
  console.log(`⏰ [Expo] Sending personalized daily reminders for preferred hour ${currentHour}h UTC...`);
  try {
    const today = new Date().toISOString().split('T')[0];
    const hourStr = `${String(currentHour).padStart(2, '0')}:00:00`;

    // Users whose preferred reminder time matches this hour AND haven't practiced today
    const { data: users } = await supabase
      .from('users')
      .select('id, name, expo_push_token, user_level, rn_user_progress(streak_days)')
      .not('expo_push_token', 'is', null)
      .eq('preferred_reminder_time', hourStr)
      .not('id', 'in',
        `(SELECT DISTINCT user_id FROM rn_user_practices WHERE created_at::date = '${today}' UNION SELECT DISTINCT user_id FROM user_practices WHERE created_at::date = '${today}')`
      );

    if (!users?.length) {
      console.log('✅ [Expo] All users practiced today');
      return;
    }

    const eligible = users.filter((u: any) => u.expo_push_token?.startsWith('ExponentPushToken['));
    console.log(`⏰ [Expo] Generating reminders for ${eligible.length} users who haven't practiced...`);

    const messages: ExpoMessage[] = [];
    for (const u of eligible) {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const streakDays = u.rn_user_progress?.[0]?.streak_days ?? 0;
      const msg = await generateReminderMessage(firstName, u.user_level ?? 'Inter', streakDays);
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
export async function sendCharlotteMessages(supabase: any, currentHour: number): Promise<void> {
  console.log(`💬 [Expo] Sending Charlotte praise for preferred hour ${currentHour}h UTC...`);
  try {
    const today = new Date().toISOString().split('T')[0];
    const hourStr = `${String(currentHour).padStart(2, '0')}:00:00`;

    // Users whose preferred reminder time matches this hour AND practiced today
    const { data: progressRows } = await supabase
      .from('rn_user_progress')
      .select('user_id, streak_days, users!inner(name, expo_push_token, user_level, preferred_reminder_time)')
      .not('users.expo_push_token', 'is', null)
      .eq('users.preferred_reminder_time', hourStr)
      .gt('updated_at', `${today}T00:00:00Z`); // updated today = practiced today

    if (!progressRows?.length) {
      console.log('✅ [Expo] No users practiced today yet');
      return;
    }

    const eligible = progressRows.filter(
      (r: any) => r.users?.expo_push_token?.startsWith('ExponentPushToken[')
    );

    console.log(`💬 [Expo] Generating personalized messages for ${eligible.length} users...`);

    // Generate personalized GPT message per user (sequential to avoid rate limits)
    const messages: ExpoMessage[] = [];
    for (const row of eligible) {
      const u = row.users;
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';

      // Fetch today's XP for this user
      const { data: practices } = await supabase
        .from('rn_user_practices')
        .select('xp_earned')
        .eq('user_id', row.user_id)
        .gte('created_at', `${today}T00:00:00Z`);
      const todayXP = (practices ?? []).reduce((s: number, p: any) => s + (p.xp_earned ?? 0), 0);

      const msg = await generateCharlotteMessage(firstName, u.user_level ?? 'Inter', row.streak_days ?? 0, todayXP);

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
      .from('users')
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

// ── runAll: called by scheduler every hour ───────────────────────────────────
// Cron fires every hour (UTC). We send to each user at THEIR preferred hour.
// preferred_reminder_time is stored as UTC time string "HH:00:00" in Supabase.
export async function runExpoNotifications(supabase: any, hour: number): Promise<void> {
  // Streak reminders always at 23h UTC (20h BRT) — not user-configurable
  if (hour === 23) {
    await sendStreakReminders(supabase);
  }

  // Daily reminder + praise: respect each user's preferred_reminder_time
  // Pass the current UTC hour so functions filter by matching users
  await sendDailyReminders(supabase, hour);
  await sendCharlotteMessages(supabase, hour);
}
