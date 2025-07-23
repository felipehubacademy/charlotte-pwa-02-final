// lib/push-notification-server.ts
// Server-side push notification service

import { getSupabase } from '@/lib/supabase';

// Types for notification sending
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
  // iOS specific fields
  sound?: string;
}

export interface TargetUser {
  user_id: string;
  platform?: 'ios' | 'android' | 'desktop';
}

export class PushNotificationServer {
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
    subject: string;
  };

  constructor() {
    // Initialize VAPID keys from environment
    this.vapidKeys = {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      privateKey: process.env.VAPID_PRIVATE_KEY || '',
      subject: process.env.VAPID_SUBJECT || 'mailto:admin@charlotte-app.com'
    };

    if (!this.vapidKeys.publicKey || !this.vapidKeys.privateKey) {
      console.warn('⚠️ VAPID keys not configured - push notifications will not work');
    }
  }

  /**
   * Send push notification to specific users
   */
  async sendToUsers(users: TargetUser[], payload: PushNotificationPayload): Promise<void> {
    if (!this.vapidKeys.publicKey || !this.vapidKeys.privateKey) {
      throw new Error('VAPID keys not configured');
    }

    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Database not available');
    }

    try {
      // Get active subscriptions for target users
      const userIds = users.map(u => u.user_id);
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching subscriptions:', error);
        return;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('📭 No active subscriptions found for target users');
        return;
      }

      // Send notifications
      const promises = subscriptions.map(subscription => 
        this.sendToSubscription(subscription, payload)
      );

      const results = await Promise.allSettled(promises);
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📨 Push notifications sent: ${successful} successful, ${failed} failed`);

    } catch (error) {
      console.error('❌ Error sending push notifications:', error);
      throw error;
    }
  }

  /**
   * Send push notification to all users with a specific user level
   */
  async sendToUserLevel(
    userLevel: 'Novice' | 'Inter' | 'Advanced', 
    payload: PushNotificationPayload
  ): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Database not available');
    }

    try {
      // Get users with specific level
      const { data: users, error } = await supabase
        .from('users')
        .select('entra_id')
        .eq('user_level', userLevel);

      if (error || !users) {
        console.error('❌ Error fetching users by level:', error);
        return;
      }

      const targetUsers = users.map(user => ({ user_id: user.entra_id }));
      await this.sendToUsers(targetUsers, payload);

    } catch (error) {
      console.error('❌ Error sending notifications to user level:', error);
      throw error;
    }
  }

  /**
   * Send individual notification to a subscription
   */
  private async sendToSubscription(
    subscription: any, 
    payload: PushNotificationPayload
  ): Promise<void> {
         try {
       // Detect platform and create appropriate payload
       const platform = subscription.platform || 'unknown';
       const notificationPayload = this.createPlatformSpecificPayload(payload, platform);

       // Dynamic import of web-push (only available server-side)
       // NOTE: Install web-push: npm install web-push @types/web-push
       let webPush: any;
       
       try {
         // Use eval to prevent TypeScript from checking the import during compilation
         const webPushModule = await eval('import("web-push")');
         webPush = webPushModule.default || webPushModule;
       } catch (importError) {
         console.error('❌ web-push library not installed. Run: npm install web-push @types/web-push');
         throw new Error('web-push library not available');
       }
       
       // Configure web-push
       webPush.setVapidDetails(
         this.vapidKeys.subject,
         this.vapidKeys.publicKey,
         this.vapidKeys.privateKey
       );

       // Create subscription object
       const pushSubscription = {
         endpoint: subscription.endpoint,
         keys: {
           p256dh: subscription.keys.p256dh,
           auth: subscription.keys.auth
         }
       };

       // Send notification
       await webPush.sendNotification(
         pushSubscription,
         JSON.stringify(notificationPayload),
         {
           TTL: 24 * 60 * 60, // 24 hours
           urgency: 'normal',
         }
       );

       console.log(`✅ Notification sent to ${platform} device`);

     } catch (error: any) {
      console.error('❌ Failed to send notification:', error);

      // Handle subscription errors (410 = Gone, 413 = Payload too large)
      if (error.statusCode === 410) {
        await this.handleInvalidSubscription(subscription.id);
      }

      throw error;
    }
  }

  /**
   * Create platform-specific notification payload
   */
  private createPlatformSpecificPayload(
    payload: PushNotificationPayload, 
    platform: string
  ): any {
    const basePayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      url: payload.url || '/chat',
      data: payload.data || {}
    };

    // iOS with Declarative Web Push support (iOS 18.4+)
    if (platform === 'ios') {
      return {
        web_push: 8030, // Magic number for declarative web push
        notification: {
          title: payload.title,
          body: payload.body,
          navigate: payload.url || '/chat',
          sound: payload.sound || 'default',
          app_badge: '1' // Simple badge increment
        }
      };
    }

    // Standard format for Android/Desktop
    return basePayload;
  }

  /**
   * Handle invalid/expired subscriptions
   */
  private async handleInvalidSubscription(subscriptionId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('id', subscriptionId);

      console.log(`🗑️ Deactivated invalid subscription: ${subscriptionId}`);
    } catch (error) {
      console.error('❌ Error deactivating subscription:', error);
    }
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(
    userId: string, 
    achievement: { title: string; description: string }
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: `🏆 ${achievement.title}`,
      body: achievement.description,
      icon: '/icons/icon-192x192.png',
      url: '/chat',
      data: { type: 'achievement', achievement }
    };

    await this.sendToUsers([{ user_id: userId }], payload);
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(
    userId: string, 
    message: string = 'Time to practice English with Charlotte!'
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'Charlotte - English Practice',
      body: message,
      icon: '/icons/icon-192x192.png',
      url: '/chat',
      data: { type: 'reminder' }
    };

    await this.sendToUsers([{ user_id: userId }], payload);
  }
}

// Singleton instance
export const pushNotificationServer = new PushNotificationServer(); 