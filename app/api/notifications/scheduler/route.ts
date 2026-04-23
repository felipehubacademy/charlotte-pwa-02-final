/**
 * app/api/notifications/scheduler/route.ts
 *
 * RN-only notification scheduler. Called by cron-job.org at specific times
 * via GET with a Bearer token. Also supports manual triggering via POST or
 * a `?force_task=TYPE` query param (protected by CRON_SECRET).
 *
 * Cron-job.org schedule (America/Sao_Paulo timezone):
 *   - 11h BRT (14h UTC): daily_reminder for users who haven't practiced today
 *   - 18h BRT (21h UTC): praise for who practiced + streak reminder for who didn't
 *   - 16h BRT (19h UTC): goal_reminder for users close to weekly XP goal
 *   - Mon 9h BRT (12h UTC): weekly_challenge for users active last 7 days
 *
 * PWA web-push paths were removed — PWA is being deprecated.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendDailyReminders,
  sendCharlotteMessages,
  sendStreakReminders,
  sendGoalReminders,
  sendWeeklyChallenges,
} from '@/lib/expo-notification-service';
import { getSupabase } from '@/lib/supabase';

const CRON_SECRET = process.env.CRON_SECRET ?? '';

type TaskType = 'daily' | 'praise' | 'streak' | 'goal' | 'weekly';

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
    default:
      throw new Error(`Unknown task: ${task}`);
  }
  return { task };
}

function tasksForHour(hourUTC: number, dayOfWeekUTC: number): TaskType[] {
  // Scheduled times (UTC) — assumes users' local = BRT for now.
  // TODO: per-user timezone support.
  const tasks: TaskType[] = [];
  if (hourUTC === 14) tasks.push('daily');               // 11h BRT
  if (hourUTC === 19) tasks.push('goal');                // 16h BRT
  if (hourUTC === 21) tasks.push('praise', 'streak');    // 18h BRT
  if (dayOfWeekUTC === 1 && hourUTC === 12) tasks.push('weekly'); // Mon 9h BRT
  return tasks;
}

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

    const now       = new Date();
    const hourUTC   = now.getUTCHours();
    const dayUTC    = now.getUTCDay();
    const scheduled = tasksForHour(hourUTC, dayUTC);

    if (scheduled.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No scheduled tasks for ${hourUTC}:00 UTC (day ${dayUTC})`,
        timestamp: now.toISOString(),
      });
    }

    const results = await Promise.allSettled(scheduled.map(runTask));
    return NextResponse.json({
      success: true,
      hourUTC,
      dayUTC,
      results: results.map((r, i) => ({
        task: scheduled[i],
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
