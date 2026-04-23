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

// Stable hash for a template (ignoring placeholders) so we can recognise
// the same variant across users and avoid repeating it to the same user.
function variantHash(tpl: MsgTemplate): string {
  const raw = `${tpl.title}|${tpl.body}`;
  // Tiny non-crypto FNV-1a — plenty to distinguish a handful of pool variants.
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}

// Pick a template, excluding any whose hash already appeared in the user's
// recent history (novelty decay), then substitute {name}/{xp}/{streak}.
// Returns both the rendered message and the variant hash so the caller can
// log which variant was sent.
function pickTemplate(
  pool: MsgTemplate[],
  fallback: MsgTemplate,
  firstName: string,
  xp?: number,
  streak?: number,
  excludeHashes: Set<string> = new Set(),
): { msg: MsgTemplate; hash: string } {
  const eligible = pool.filter(t => !excludeHashes.has(variantHash(t)));
  const source = eligible.length > 0 ? eligible : (pool.length > 0 ? pool : [fallback]);
  const tpl    = source[Math.floor(Math.random() * source.length)];
  const replace = (s: string) => s
    .replace(/\{name\}/g, firstName)
    .replace(/\{xp\}/g, xp != null ? String(xp) : '')
    .replace(/\{streak\}/g, streak != null ? String(streak) : '');
  return {
    msg: { title: replace(tpl.title), body: replace(tpl.body) },
    hash: variantHash(tpl),
  };
}

// ── Timezone helpers ────────────────────────────────────────────────────────
// Users set charlotte_users.timezone when the app foregrounds
// (AuthProvider.tsx calls deviceTimezone() → IANA zone string). NULL means
// the user has not opened the app yet — default to Sao Paulo so the existing
// Brazil-heavy base is never silently dropped.
const DEFAULT_TZ = 'America/Sao_Paulo';

function localHourInTz(utc: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false })
      .formatToParts(utc);
    const h = parts.find(p => p.type === 'hour')?.value ?? '0';
    const n = parseInt(h, 10);
    return Number.isFinite(n) ? n % 24 : 0;
  } catch {
    return localHourInTz(utc, DEFAULT_TZ);
  }
}

function localDayInTz(utc: Date, tz: string): number {
  try {
    // 'en-US' weekday short: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(utc);
    return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd] ?? 0;
  } catch {
    return localDayInTz(utc, DEFAULT_TZ);
  }
}

// Filter users (with optional timezone field) to those whose local hour
// matches targetHour right now. If targetDayOfWeek is supplied, also check
// that the user's local weekday matches (used by weekly_challenge).
function usersAtLocalHour<T extends { id: string; timezone?: string | null }>(
  users: T[],
  targetHour: number,
  targetDayOfWeek?: number,
): T[] {
  const now = new Date();
  return users.filter(u => {
    const tz = u.timezone || DEFAULT_TZ;
    if (localHourInTz(now, tz) !== targetHour) return false;
    if (targetDayOfWeek != null && localDayInTz(now, tz) !== targetDayOfWeek) return false;
    return true;
  });
}

// ── Log / frequency-cap / novelty-decay helpers ─────────────────────────────
// All three share the notifications.notification_logs table (see
// supabase/migrations/20260423_extend_notification_logs_for_rn.sql).

interface NotificationType {
  id: 'streak_reminder' | 'daily_reminder' | 'charlotte_message'
     | 'xp_milestone' | 'goal_reminder' | 'weekly_challenge';
}

// Max sends per user per UTC day, per type. Each cron fires once a day
// (weekly_challenge once a week), so in practice 1 is just a safety net
// against duplicate runs (retries, double cron triggers).
const FREQUENCY_CAP: Record<NotificationType['id'], number> = {
  streak_reminder:   1,
  daily_reminder:    1,
  charlotte_message: 1,
  xp_milestone:      3, // multiple milestones can legitimately hit in one day
  goal_reminder:     1,
  weekly_challenge:  1,
};

// How many of the user's most recent variants to exclude when picking a
// template (novelty decay). 3 = "don't repeat the last 3 we sent them".
const NOVELTY_WINDOW = 3;

// Returns the set of userIds that have already received `type` today and
// should be skipped. Single round-trip for the whole send batch.
async function filterFrequencyCap(
  supabase: any,
  userIds: string[],
  type: NotificationType['id'],
): Promise<string[]> {
  if (!userIds.length) return userIds;
  const cap = FREQUENCY_CAP[type];
  const sinceMidnightUtc = new Date();
  sinceMidnightUtc.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .schema('notifications')
    .from('notification_logs')
    .select('user_id')
    .in('user_id', userIds)
    .eq('notification_type', type)
    .eq('status', 'sent')
    .gte('created_at', sinceMidnightUtc.toISOString());

  if (error) {
    console.warn(`⚠️ [Expo] frequency-cap query error (${type}):`, error.message);
    return userIds; // fail open — better to send than to silently block
  }

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as any[]) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }
  return userIds.filter(uid => (counts.get(uid) ?? 0) < cap);
}

// Recent variant hashes per user, for pickTemplate's exclude list.
async function fetchRecentVariantHashes(
  supabase: any,
  userIds: string[],
  type: NotificationType['id'],
): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  if (!userIds.length) return out;
  // Last 14 days is more than enough — templates refresh daily via GPT
  // anyway, so older hashes are unlikely to reappear.
  const since = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
  const { data, error } = await supabase
    .schema('notifications')
    .from('notification_logs')
    .select('user_id, metadata, created_at')
    .in('user_id', userIds)
    .eq('notification_type', type)
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn(`⚠️ [Expo] recent-variants query error (${type}):`, error.message);
    return out;
  }
  for (const row of (data ?? []) as any[]) {
    const hash = row.metadata?.variant_hash;
    if (!hash) continue;
    const set = out.get(row.user_id) ?? new Set<string>();
    if (set.size < NOVELTY_WINDOW) set.add(hash);
    out.set(row.user_id, set);
  }
  return out;
}

// One row per (user, send attempt). Written after sendExpoPush returns.
async function logRnPushes(
  supabase: any,
  rows: Array<{
    userId: string;
    type: NotificationType['id'];
    variantHash?: string;
    platform?: string;
    status?: 'sent' | 'failed';
    title?: string;
    body?: string;
    errorMessage?: string;
  }>,
): Promise<void> {
  if (!rows.length) return;
  const payload = rows.map(r => ({
    user_id:            r.userId,
    notification_type:  r.type,
    status:             r.status ?? 'sent',
    message_title:      r.title ?? null,
    message_body:       r.body ?? null,
    platform:           r.platform ?? 'ios', // Expo push covers both; platform is opaque here
    error_message:      r.errorMessage ?? null,
    metadata:           r.variantHash ? { variant_hash: r.variantHash } : null,
  }));
  const { error } = await supabase
    .schema('notifications')
    .from('notification_logs')
    .insert(payload);
  if (error) {
    console.warn('⚠️ [Expo] notification_logs insert error:', error.message);
  }
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

/** Fetch charlotte_users rows for a list of user_ids (token + name + level + tz). */
async function fetchCharlotteUsers(supabase: any, userIds: string[]) {
  if (!userIds.length) return [];
  const { data } = await supabase
    .from('charlotte_users')
    .select('id, name, expo_push_token, charlotte_level, timezone')
    .in('id', userIds)
    .not('expo_push_token', 'is', null);
  return (data ?? []).filter((u: any) => u.expo_push_token?.startsWith('ExponentPushToken['));
}

// ── Per-type target LOCAL hour (in each user's own timezone) ────────────────
// The scheduler runs hourly; each sender drops users whose local hour does
// not match these constants. Monday 9 is weekday 1.
const TARGET_HOUR_DAILY    = 11;
const TARGET_HOUR_GOAL     = 16;
const TARGET_HOUR_STREAK   = 18;
const TARGET_HOUR_PRAISE   = 18;
const TARGET_HOUR_WEEKLY   = 9;
const WEEKLY_DAY_OF_WEEK   = 1; // Monday

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

    const allUserIds = atRisk.map((r: any) => r.user_id);
    const allowedIds = await filterFrequencyCap(supabase, allUserIds, 'streak_reminder');
    const skipped = allUserIds.length - allowedIds.length;
    if (skipped > 0) console.log(`⏭️ [Expo] streak: skipping ${skipped} user(s) at daily cap`);
    if (!allowedIds.length) return;

    const allUsers = await fetchCharlotteUsers(supabase, allowedIds);
    const cuUsers = usersAtLocalHour(allUsers, TARGET_HOUR_STREAK);
    if (!cuUsers.length) { console.log(`⏱️ [Expo] streak: no users at local ${TARGET_HOUR_STREAK}h this run`); return; }
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
    await logRnPushes(supabase, cuUsers.map((u: any, i: number) => ({
      userId: u.id,
      type: 'streak_reminder',
      title: messages[i]?.title,
      body:  messages[i]?.body,
    })));
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
      .select('id, name, expo_push_token, charlotte_level, timezone')
      .not('expo_push_token', 'is', null);
    if (practicedIds.length) {
      q = q.not('id', 'in', `(${practicedIds.map(id => `"${id}"`).join(',')})`);
    }
    const { data: cuUsers, error: usersErr } = await q;
    if (usersErr) { console.error('❌ [Expo] users query error:', usersErr.message); return; }

    const withToken = (cuUsers ?? []).filter((u: any) =>
      u.expo_push_token?.startsWith('ExponentPushToken[')
    );
    if (!withToken.length) { console.log('✅ [Expo] No eligible users for daily reminder'); return; }

    const tzFiltered = usersAtLocalHour(withToken, TARGET_HOUR_DAILY);
    if (!tzFiltered.length) { console.log(`⏱️ [Expo] daily: no users at local ${TARGET_HOUR_DAILY}h this run`); return; }

    const allowedIds = await filterFrequencyCap(
      supabase,
      tzFiltered.map((u: any) => u.id),
      'daily_reminder',
    );
    const skipped = tzFiltered.length - allowedIds.length;
    if (skipped > 0) console.log(`⏭️ [Expo] daily: skipping ${skipped} user(s) at daily cap`);
    const allowed = new Set(allowedIds);
    const eligible = tzFiltered.filter((u: any) => allowed.has(u.id));
    if (!eligible.length) return;

    const { data: progRows } = await supabase
      .from('charlotte_progress')
      .select('user_id, streak_days')
      .in('user_id', allowedIds);
    const streakMap = Object.fromEntries((progRows ?? []).map((r: any) => [r.user_id, r.streak_days ?? 0]));

    const hasAnyStreak = eligible.some((u: any) => (streakMap[u.id] ?? 0) > 0);

    // Generate 2 pools (Novice PT + Advanced EN) — 2 GPT calls total regardless of user count
    const [poolNovice, poolAdvanced, recentHashes] = await Promise.all([
      generateTemplatePool('reminder', true,  hasAnyStreak),
      generateTemplatePool('reminder', false, hasAnyStreak),
      fetchRecentVariantHashes(supabase, allowedIds, 'daily_reminder'),
    ]);

    const fallbackNovice   = { title: '📚 Hora de praticar!', body: '{name}, a Charlotte está esperando por você hoje!' };
    const fallbackAdvanced = { title: '📚 Time to practice!', body: '{name}, Charlotte is ready for you today!' };

    console.log(`⏰ [Expo] Sending reminders to ${eligible.length} users...`);

    const perUserHash: Record<string, string> = {};
    const messages: ExpoMessage[] = eligible.map((u: any) => {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const isNovice  = u.charlotte_level === 'Novice';
      const streak    = streakMap[u.id] ?? 0;
      const { msg, hash } = pickTemplate(
        isNovice ? poolNovice : poolAdvanced,
        isNovice ? fallbackNovice : fallbackAdvanced,
        firstName,
        undefined,
        streak > 0 ? streak : undefined,
        recentHashes.get(u.id) ?? new Set(),
      );
      perUserHash[u.id] = hash;
      return { to: u.expo_push_token, ...msg, data: { screen: 'chat', type: 'daily_reminder' }, sound: 'default', priority: 'high' };
    });

    const { sent, errors } = await sendExpoPush(messages, supabase);
    console.log(`✅ [Expo] Daily reminders: ${sent} sent, ${errors} errors`);
    await logRnPushes(supabase, eligible.map((u: any, i: number) => ({
      userId: u.id,
      type: 'daily_reminder',
      variantHash: perUserHash[u.id],
      title: messages[i]?.title,
      body:  messages[i]?.body,
    })));
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

    const rawUsers = await fetchCharlotteUsers(supabase, practicedIds);
    if (!rawUsers.length) return;

    const tzFiltered = usersAtLocalHour(rawUsers, TARGET_HOUR_PRAISE);
    if (!tzFiltered.length) { console.log(`⏱️ [Expo] praise: no users at local ${TARGET_HOUR_PRAISE}h this run`); return; }

    const allowedIds = await filterFrequencyCap(
      supabase,
      tzFiltered.map((u: any) => u.id),
      'charlotte_message',
    );
    const skipped = tzFiltered.length - allowedIds.length;
    if (skipped > 0) console.log(`⏭️ [Expo] praise: skipping ${skipped} user(s) at daily cap`);
    const allowed = new Set(allowedIds);
    const cuUsers = tzFiltered.filter((u: any) => allowed.has(u.id));
    if (!cuUsers.length) return;

    // Fetch XP and streak per user
    const { data: progRows } = await supabase
      .from('charlotte_progress')
      .select('user_id, streak_days, total_xp')
      .in('user_id', allowedIds);
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
    const [poolNovice, poolAdvanced, recentHashes] = await Promise.all([
      generateTemplatePool('praise', true,  false),
      generateTemplatePool('praise', false, false),
      fetchRecentVariantHashes(supabase, allowedIds, 'charlotte_message'),
    ]);

    const fallbackNovice   = { title: 'Otimo trabalho hoje!', body: '{name}, voce praticou hoje e ganhou {xp} XP! Continue assim.' };
    const fallbackAdvanced = { title: 'Great work today!',    body: '{name}, you practiced today and earned {xp} XP! Keep it up.' };

    console.log(`💬 [Expo] Sending praise to ${cuUsers.length} users...`);

    const perUserHash: Record<string, string> = {};
    const messages: ExpoMessage[] = cuUsers.map((u: any) => {
      const firstName = u.name?.split(/[\s\-]+/)[0] ?? 'there';
      const isNovice  = u.charlotte_level === 'Novice';
      const xp        = todayXpMap[u.id] ?? 0;
      const streak    = streakMap[u.id] ?? 0;
      const { msg, hash } = pickTemplate(
        isNovice ? poolNovice : poolAdvanced,
        isNovice ? fallbackNovice : fallbackAdvanced,
        firstName,
        xp > 0 ? xp : undefined,
        streak > 0 ? streak : undefined,
        recentHashes.get(u.id) ?? new Set(),
      );
      perUserHash[u.id] = hash;
      return { to: u.expo_push_token, ...msg, data: { screen: 'chat', type: 'charlotte_message' }, sound: 'default', priority: 'high' };
    });

    const { sent, errors } = await sendExpoPush(messages, supabase);
    console.log(`✅ [Expo] Charlotte praise: ${sent} sent, ${errors} errors`);
    await logRnPushes(supabase, cuUsers.map((u: any, i: number) => ({
      userId: u.id,
      type: 'charlotte_message',
      variantHash: perUserHash[u.id],
      title: messages[i]?.title,
      body:  messages[i]?.body,
    })));
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

    const allowed = await filterFrequencyCap(supabase, [userId], 'xp_milestone');
    if (!allowed.length) {
      console.log(`⏭️ [Expo] xp_milestone ${milestone} skipped — user at daily cap`);
      return;
    }

    const firstName = user.name?.split(' ')[0] ?? 'Você';
    const title = '🎉 Marco alcançado!';
    const body  = `${firstName} chegou a ${milestone.toLocaleString('pt-BR')} XP! Continue praticando!`;
    await sendExpoPush([{
      to: user.expo_push_token,
      title, body,
      data: { screen: 'chat', type: 'xp_milestone', milestone },
      sound: 'default',
      priority: 'high',
    }], supabase);

    console.log(`✅ [Expo] XP milestone ${milestone} sent to ${userId}`);
    await logRnPushes(supabase, [{ userId, type: 'xp_milestone', title, body }]);
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

    const allUsers = await fetchCharlotteUsers(supabase, near.map(n => n.userId));
    const tzFiltered = usersAtLocalHour(allUsers, TARGET_HOUR_GOAL);
    if (!tzFiltered.length) { console.log(`⏱️ [Expo] goal: no users at local ${TARGET_HOUR_GOAL}h this run`); return; }

    const allowedIds = await filterFrequencyCap(
      supabase,
      tzFiltered.map((u: any) => u.id),
      'goal_reminder',
    );
    const skipped = tzFiltered.length - allowedIds.length;
    if (skipped > 0) console.log(`⏭️ [Expo] goal: skipping ${skipped} user(s) at daily cap`);
    if (!allowedIds.length) return;

    const allowed = new Set(allowedIds);
    const cuUsers = tzFiltered.filter((u: any) => allowed.has(u.id));
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
    await logRnPushes(supabase, cuUsers.map((u: any, i: number) => ({
      userId: u.id,
      type: 'goal_reminder',
      title: messages[i]?.title,
      body:  messages[i]?.body,
    })));
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

    const allUsers = await fetchCharlotteUsers(supabase, activeIds);
    const tzFiltered = usersAtLocalHour(allUsers, TARGET_HOUR_WEEKLY, WEEKLY_DAY_OF_WEEK);
    if (!tzFiltered.length) {
      console.log(`⏱️ [Expo] weekly: no users at Mon ${TARGET_HOUR_WEEKLY}h local this run`);
      return;
    }

    const allowedIds = await filterFrequencyCap(supabase, tzFiltered.map((u: any) => u.id), 'weekly_challenge');
    const skipped = tzFiltered.length - allowedIds.length;
    if (skipped > 0) console.log(`⏭️ [Expo] weekly: skipping ${skipped} user(s) at daily cap`);
    if (!allowedIds.length) return;

    const allowed = new Set(allowedIds);
    const cuUsers = tzFiltered.filter((u: any) => allowed.has(u.id));
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
    await logRnPushes(supabase, cuUsers.map((u: any, i: number) => ({
      userId: u.id,
      type: 'weekly_challenge',
      title: messages[i]?.title,
      body:  messages[i]?.body,
    })));
  } catch (e) {
    console.error('❌ [Expo] Weekly challenge error:', e);
  }
}
