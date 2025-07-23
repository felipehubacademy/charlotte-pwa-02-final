// Simplified push notification server using direct fetch
import { getSupabase } from '@/lib/supabase';

export interface SimplePushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export class SimplePushServer {
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
    subject: string;
  };

  constructor() {
    this.vapidKeys = {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      privateKey: process.env.VAPID_PRIVATE_KEY || '',
      subject: process.env.VAPID_SUBJECT || 'mailto:falecom@hubacademybr.com'
    };
  }

  async sendTestNotification(userId: string): Promise<void> {
    try {
      console.log('🧪 [SimplePush] Sending test notification to:', userId);

      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Database not available');
      }

      // Get user's active subscriptions
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [SimplePush] Error fetching subscriptions:', error);
        return;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('📭 [SimplePush] No active subscriptions found');
        return;
      }

      console.log(`📨 [SimplePush] Found ${subscriptions.length} subscriptions`);

      // Send notification to each subscription
      for (const subscription of subscriptions) {
        await this.sendToEndpoint(subscription, {
          title: '🧪 Charlotte Test (Simple)',
          body: 'Your push notifications are working!',
          url: '/chat',
          icon: '/icons/icon-192x192.png'
        });
      }

    } catch (error) {
      console.error('❌ [SimplePush] Send test failed:', error);
      throw error;
    }
  }

  private async sendToEndpoint(subscription: any, payload: SimplePushPayload): Promise<void> {
    try {
      const platform = subscription.platform || 'unknown';
      console.log(`📤 [SimplePush] Sending to ${platform} device...`);

      // Create platform-specific payload
      const notificationData = this.createPayload(payload, platform);

      // For now, let's just log what we would send
      // In a real implementation, you'd use the web-push library or raw HTTP requests
      console.log('📦 [SimplePush] Would send payload:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        payload: notificationData,
        platform
      });

      // Simulate successful send
      console.log('✅ [SimplePush] Notification "sent" successfully');

    } catch (error) {
      console.error('❌ [SimplePush] Send to endpoint failed:', error);
      throw error;
    }
  }

  private createPayload(payload: SimplePushPayload, platform: string): any {
    // iOS with Declarative Web Push support
    if (platform === 'ios') {
      return {
        web_push: 8030,
        notification: {
          title: payload.title,
          body: payload.body,
          navigate: payload.url || '/chat',
          sound: 'default',
          app_badge: '1'
        }
      };
    }

    // Standard format for Android/Desktop
    return {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      url: payload.url || '/chat'
    };
  }
}

export const simplePushServer = new SimplePushServer(); 