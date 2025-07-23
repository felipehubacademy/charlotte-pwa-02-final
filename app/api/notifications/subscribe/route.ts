import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, platform, user_id, subscription_type } = body;

    // Validate required fields - for FCM, keys can be placeholders
    if (!endpoint || !user_id) {
      return NextResponse.json(
        { error: 'Missing required data (endpoint, user_id)' },
        { status: 400 }
      );
    }

    // For FCM tokens, we don't need real p256dh/auth keys
    const isFCM = platform === 'fcm' || subscription_type === 'fcm';
    if (!isFCM && (!keys?.p256dh || !keys?.auth)) {
      return NextResponse.json(
        { error: 'Missing required web push keys (p256dh, auth)' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Check if subscription already exists for this user and endpoint
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('endpoint', endpoint)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          keys: keys || { p256dh: 'fcm', auth: 'fcm' },
          platform: platform || 'unknown',
          subscription_type: isFCM ? 'fcm' : 'web_push',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);

      if (error) {
        console.error('❌ Error updating subscription:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated',
        subscriptionId: existingSubscription.id
      });
    }

    // Create new subscription
    const { data: newSubscription, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user_id,
        endpoint,
        keys: keys || { p256dh: 'fcm', auth: 'fcm' },
        platform: platform || 'unknown',
        subscription_type: isFCM ? 'fcm' : 'web_push',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    console.log('✅ Push subscription created:', {
      userId: user_id,
      platform,
      subscriptionId: newSubscription.id
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription created',
      subscriptionId: newSubscription.id
    });

  } catch (error) {
    console.error('❌ Subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 