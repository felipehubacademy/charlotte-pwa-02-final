import { NextRequest, NextResponse } from 'next/server';
import { ReengagementNotificationService, ReengagementType } from '@/lib/reengagement-notification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, ...params } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing userId or notification type' },
        { status: 400 }
      );
    }

    console.log(`🔔 [REENGAGEMENT API] Sending ${type} notification to user:`, userId);

    let success = false;

    switch (type as ReengagementType) {
      case 'streak_reminder':
        const { streakDays } = params;
        if (!streakDays) {
          return NextResponse.json(
            { error: 'streakDays is required for streak_reminder' },
            { status: 400 }
          );
        }
        success = await ReengagementNotificationService.sendStreakReminder(userId, streakDays);
        break;

      case 'weekly_challenge':
        const { challengeTitle } = params;
        if (!challengeTitle) {
          return NextResponse.json(
            { error: 'challengeTitle is required for weekly_challenge' },
            { status: 400 }
          );
        }
        success = await ReengagementNotificationService.sendWeeklyChallenge(userId, challengeTitle);
        break;

      case 'practice_reminder':
        const { preferredTime } = params;
        success = await ReengagementNotificationService.sendPracticeReminder(userId, preferredTime);
        break;

      case 'social_invite':
        const { inviterName, activityType } = params;
        if (!inviterName || !activityType) {
          return NextResponse.json(
            { error: 'inviterName and activityType are required for social_invite' },
            { status: 400 }
          );
        }
        success = await ReengagementNotificationService.sendSocialInvite(userId, inviterName, activityType);
        break;

      case 'goal_reminder':
        const { goalType, progress } = params;
        if (!goalType || progress === undefined) {
          return NextResponse.json(
            { error: 'goalType and progress are required for goal_reminder' },
            { status: 400 }
          );
        }
        success = await ReengagementNotificationService.sendGoalReminder(userId, goalType, progress);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    if (success) {
      console.log(`✅ [REENGAGEMENT API] ${type} notification sent successfully`);
      return NextResponse.json({
        success: true,
        message: `${type} notification sent successfully`,
        type,
        userId
      });
    } else {
      console.log(`❌ [REENGAGEMENT API] Failed to send ${type} notification`);
      return NextResponse.json({
        success: false,
        message: `Failed to send ${type} notification - no active FCM tokens found`,
        type,
        userId
      }, { status: 404 });
    }

  } catch (error) {
    console.error('❌ [REENGAGEMENT API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send reengagement notification',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 