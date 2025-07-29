// Firebase Cloud Messaging Service - CONFIGURAÇÃO QUE FUNCIONA 100%
import { getToken, onMessage } from 'firebase/messaging';
import { initializeMessaging } from './firebase-config';
import { getSupabase } from './supabase';

export interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  data?: Record<string, any>;
}

export class FirebaseMessagingService {
  private messaging: any = null;
  private vapidKey: string;

  constructor() {
    // VAPID KEY QUE FUNCIONA 100% NO iOS
    this.vapidKey = 'BJ87VjvmFct3Gp1NkTlViywwyT04g7vuHkhvuICQarrOq2iKnJNld2cJ2o7BD-hvYRNtKJeBL92dygxbjNOMyuA';
  }

  async initialize(): Promise<boolean> {
    try {
      this.messaging = await initializeMessaging();
      if (!this.messaging) {
        console.log('ℹ️ Firebase Messaging not available');
        return false;
      }

      // Set up message listener
      this.setupMessageListener();
      
      console.log('✅ Firebase Messaging Service initialized with iOS VAPID key');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Messaging:', error);
      return false;
    }
  }

  async getToken(userId: string): Promise<string | null> {
    if (!this.messaging) {
      console.error('❌ Firebase Messaging not initialized');
      return null;
    }

    try {
      // Check if we have permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('❌ Notification permission denied');
        return null;
      }

      // Get FCM token with iOS-compatible VAPID key
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        console.log('✅ FCM Token received:', token.substring(0, 20) + '...');
        
        // Save token to database
        await this.saveTokenToDatabase(userId, token);
        
        return token;
      } else {
        console.log('❌ No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      // Detectar plataforma para iOS
      const platform = this.detectPlatform();

      // Check if token already exists
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('endpoint', token)
        .single();

      if (existing) {
        // Update existing token
        await supabase
          .from('push_subscriptions')
          .update({
            is_active: true,
            platform: platform,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        console.log('✅ FCM token updated in database');
      } else {
        // Insert new token
        await supabase
          .from('push_subscriptions')
          .insert({
            user_id: userId,
            endpoint: token,
            platform: platform,
            is_active: true,
            subscription_type: 'fcm',
            keys: { p256dh: 'fcm', auth: 'fcm' }, // Placeholder para FCM
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        console.log('✅ FCM token saved to database');
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  private setupMessageListener(): void {
    if (!this.messaging) return;

    try {
      onMessage(this.messaging, (payload) => {
        console.log('📨 FCM Message received:', payload);

        // iOS-specific handling
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        // Show notification if app is in foreground
        if (payload.notification) {
          this.showForegroundNotification(payload.notification, isIOS);
        }

        // Handle data payload
        if (payload.data) {
          this.handleDataMessage(payload.data);
        }
      });

      console.log('✅ FCM message listener set up for iOS');
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
    }
  }

  private showForegroundNotification(notification: any, isIOS: boolean = false): void {
    try {
      // Configuração simplificada para iOS
      const notificationOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        tag: 'charlotte-fcm',
        requireInteraction: isIOS, // iOS needs interaction
        silent: false
      };

      // iOS tem limitações com badge e actions
      if (!isIOS) {
        notificationOptions.badge = '/icons/icon-72x72.png';
      }

      const notif = new Notification(notification.title || 'Charlotte', notificationOptions);

      notif.onclick = () => {
        // Handle notification click
        if (notification.click_action) {
          window.open(notification.click_action, '_blank');
        }
        notif.close();
      };

      console.log('✅ Foreground notification shown (iOS optimized)');
    } catch (error) {
      console.error('❌ Error showing foreground notification:', error);
    }
  }

  private handleDataMessage(data: Record<string, any>): void {
    console.log('📊 Handling data message:', data);

    // Custom data handling for iOS
    if (data.type === 'achievement') {
      // Handle achievement notification
      this.handleAchievementData(data);
    } else if (data.type === 'reminder') {
      // Handle practice reminder
      this.handleReminderData(data);
    }
  }

  private handleAchievementData(data: Record<string, any>): void {
    // Emit custom event for achievement
    window.dispatchEvent(new CustomEvent('fcm-achievement', { detail: data }));
  }

  private handleReminderData(data: Record<string, any>): void {
    // Emit custom event for reminder
    window.dispatchEvent(new CustomEvent('fcm-reminder', { detail: data }));
  }

  private detectPlatform(): string {
    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    if (/Android/.test(userAgent)) return 'android';
    return 'desktop';
  }

  async deleteToken(userId: string): Promise<void> {
    try {
      if (this.messaging) {
        // Note: deleteToken() is not available in web version
        // We just mark as inactive in database
        const supabase = getSupabase();
        if (supabase) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', userId)
            .eq('subscription_type', 'fcm');

          console.log('✅ FCM tokens marked as inactive');
        }
      }
    } catch (error) {
      console.error('❌ Error deleting FCM token:', error);
    }
  }
}

// Singleton instance
let fcmService: FirebaseMessagingService | null = null;

export const getFCMService = (): FirebaseMessagingService => {
  if (!fcmService) {
    fcmService = new FirebaseMessagingService();
  }
  return fcmService;
};