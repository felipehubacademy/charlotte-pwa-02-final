/**
 * app/api/notifications/scheduler/route.ts
 *
 * RN-only notification scheduler. Meant to be called once per hour by
 * cron-job.org via GET with `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Every run the endpoint invokes every sender. Each sender filters users
 * by the user's OWN timezone (charlotte_users.timezone, default
 * America/Sao_Paulo) so that:
 *   - daily_reminder fires when the user's local hour == 11
 *   - goal_reminder when local hour == 16
 *   - praise + streak when local hour == 18
 *   - weekly_challenge when local day == Monday and local hour == 9
 *
 * With a single hourly cron the scheduling targets are inside the code,
 * not in cron-job.org — timezone changes per user are handled without
 * reconfiguring the cron.
 *
 * Also supports manual triggering via POST or `?force_task=TYPE` query
 * param (same CRON_SECRET).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendDailyReminders,
  sendCharlotteMessages,
  sendStreakReminders,
  sendGoalReminders,
  sendWeeklyChallenges,
  sendEngagementPushes,
} from '@/lib/expo-notification-service';
import { getSupabase } from '@/lib/supabase';

const CRON_SECRET = process.env.CRON_SECRET ?? '';

type TaskType = 'daily' | 'praise' | 'streak' | 'goal' | 'weekly' | 'engagement';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization') ?? '';
  const userAgent  = request.headers.get('user-agent') ?? '';
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  // cron-job.org sends its UA even without CRON_SECRET matching — accept as fallback
  // only if the secret is not configured (dev environments).
  if (!CRON_SECRET && userAgent.includes('cron-job.org')) return true;
  return false;
}

async function runTask(task: TaskType): Promise<{ task: TaskType }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client unavailable');

  switch (task) {
    case 'daily':
      await sendDailyReminders(supabase);
      break;
    case 'praise':
      await sendCharlotteMessages(supabase);
      break;
    case 'streak':
      await sendStreakReminders(supabase);
      break;
    case 'goal':
      await sendGoalReminders(supabase);
      break;
    case 'weekly':
      await sendWeeklyChallenges(supabase);
      break;
    case 'engagement':
      await sendEngagementPushes(supabase);
      break;
    default:
      throw new Error(`Unknown task: ${task}`);
  }
  return { task };
}

// Every hourly run invokes every sender. Each sender drops users whose
// per-user local hour does not match the task's target hour, so this is
// cheap when no one is at the right local time.
const HOURLY_TASKS: TaskType[] = ['daily', 'goal', 'praise', 'streak', 'weekly', 'engagement'];

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const forceTask = url.searchParams.get('force_task') as TaskType | null;

  try {
    if (forceTask) {
      const result = await runTask(forceTask);
      return NextResponse.json({
        success: true,
        forced: true,
        timestamp: new Date().toISOString(),
        ...result,
      });
    }

    const now = new Date();
    const results = await Promise.allSettled(HOURLY_TASKS.map(runTask));
    return NextResponse.json({
      success: true,
      hourUTC: now.getUTCHours(),
      results: results.map((r, i) => ({
        task: HOURLY_TASKS[i],
        status: r.status,
        error: r.status === 'rejected' ? String(r.reason) : undefined,
      })),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('❌ [SCHEDULER] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const task = body.task as TaskType | undefined;
    if (!task) {
      return NextResponse.json({ error: 'Missing body.task' }, { status: 400 });
    }
    const result = await runTask(task);
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('❌ [SCHEDULER] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
