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

// ── Charlotte motivational messages ─────────────────────────────────────────
const CHARLOTTE_MESSAGES = {
  Novice: [
    { title: '👋 Oi! Sou a Charlotte', body: 'Pronta para praticar inglês hoje? Vamos bater um papo!' },
    { title: '🌟 Você está indo bem!', body: 'Cada prática conta. Vamos conversar um pouco hoje?' },
    { title: '💬 Charlotte está aqui!', body: 'Que tal uma conversa rápida em inglês hoje?' },
  ],
  Inter: [
    { title: '🔥 Keep the momentum!', body: "Let's practice English together today. I'm ready when you are!" },
    { title: '📈 Your English is improving!', body: 'A quick chat with Charlotte today will keep you sharp.' },
    { title: "💡 Charlotte's tip", body: "The more you practice, the more natural it feels. Let's talk!" },
  ],
  Advanced: [
    { title: '🎯 Challenge yourself today', body: "Let's have a real conversation. I'll push you to go further." },
    { title: '🧠 Stay sharp', body: "Advanced learners never stop. Ready for today's session?" },
    { title: '⚡ Your English, elevated', body: "Let's talk about something interesting today. I'm ready." },
  ],
};

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
export async function sendDailyReminders(supabase: any): Promise<void> {
  console.log('⏰ [Expo] Sending daily reminders...');
  try {
    const today = new Date().toISOString().split('T')[0];

    // Users with expo token who haven't practiced today in EITHER app (PWA or RN)
    const { data: users } = await supabase
      .from('users')
      .select('id, name, expo_push_token, user_level')
      .not('expo_push_token', 'is', null)
      .not('id', 'in',
        `(SELECT DISTINCT user_id FROM rn_user_practices WHERE created_at::date = '${today}' UNION SELECT DISTINCT user_id FROM user_practices WHERE created_at::date = '${today}')`
      );

    if (!users?.length) {
      console.log('✅ [Expo] All users practiced today');
      return;
    }

    const messages: ExpoMessage[] = users
      .filter((u: any) => u.expo_push_token?.startsWith('ExponentPushToken['))
      .map((u: any) => {
        const firstName = u.name?.split(' ')[0] ?? 'você';
        return {
          to: u.expo_push_token,
          title: '📚 Hora de praticar!',
          body: `${firstName}, a Charlotte está esperando por você. Pratique inglês hoje!`,
          data: { screen: 'chat', type: 'daily_reminder' },
          sound: 'default',
          priority: 'high',
        };
      });

    const { sent, errors } = await sendExpoPush(messages);
    console.log(`✅ [Expo] Daily reminders: ${sent} sent, ${errors} errors`);
  } catch (e) {
    console.error('❌ [Expo] Daily reminder error:', e);
  }
}

// ── 3. Charlotte message (motivational) ─────────────────────────────────────
export async function sendCharlotteMessages(supabase: any): Promise<void> {
  console.log('💬 [Expo] Sending Charlotte messages...');
  try {
    // Only send to ~30% of users per day to avoid fatigue
    const { data: users } = await supabase
      .from('users')
      .select('id, expo_push_token, user_level')
      .eq('is_active', true)
      .not('expo_push_token', 'is', null);

    if (!users?.length) return;

    // Random subset (30%)
    const subset = users
      .filter((u: any) => u.expo_push_token?.startsWith('ExponentPushToken['))
      .filter(() => Math.random() < 0.3);

    const messages: ExpoMessage[] = subset.map((u: any) => {
      const level = u.user_level ?? 'Inter';
      const pool = CHARLOTTE_MESSAGES[level as keyof typeof CHARLOTTE_MESSAGES]
        ?? CHARLOTTE_MESSAGES.Inter;
      const msg = pool[Math.floor(Math.random() * pool.length)];
      return {
        to: u.expo_push_token,
        title: msg.title,
        body: msg.body,
        data: { screen: 'chat', type: 'charlotte_message' },
        sound: 'default',
        priority: 'high',
      };
    });

    const { sent, errors } = await sendExpoPush(messages);
    console.log(`✅ [Expo] Charlotte messages: ${sent} sent, ${errors} errors`);
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

// ── runAll: called by scheduler ──────────────────────────────────────────────
export async function runExpoNotifications(supabase: any, hour: number): Promise<void> {
  // 8pm (20h UTC-3 = 23h UTC): streak reminders
  if (hour === 23) {
    await sendStreakReminders(supabase);
  }

  // 11am (11h UTC-3 = 14h UTC): daily reminder + Charlotte message
  if (hour === 14) {
    await sendDailyReminders(supabase);
    await sendCharlotteMessages(supabase);
  }
}
