// Firebase Admin Service for Server-side FCM
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getSupabase } from './supabase';

export interface FCMServerPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  data?: Record<string, any>;
}

class FirebaseAdminService {
  private app: any = null;
  private messaging: any = null;

  constructor() {
    this.initializeAdmin();
  }

  private initializeAdmin(): void {
    try {
      // Check if already initialized
      if (getApps().length > 0) {
        this.app = getApps()[0];
      } else {
        // Initialize with service account
        const serviceAccount: ServiceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID || '',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
        };

        this.app = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }

      this.messaging = getMessaging(this.app);
      console.log('✅ Firebase Admin initialized');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error);
    }
  }

  async sendToUser(userId: string, payload: FCMServerPayload): Promise<boolean> {
    try {
      if (!this.messaging) {
        console.error('❌ Firebase Admin not initialized');
        return false;
      }

      // Get user's FCM tokens from database
      const tokens = await this.getUserTokens(userId);
      
      if (tokens.length === 0) {
        console.log('📭 No FCM tokens found for user:', userId);
        return false;
      }

      console.log(`📨 Sending FCM to ${tokens.length} devices for user:`, userId);

      // Prepare FCM message
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image
        },
        data: {
          url: payload.url || '/chat',
          type: 'charlotte_notification',
          timestamp: Date.now().toString(),
          ...payload.data
        },
        webpush: {
          notification: {
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            requireInteraction: true,
            actions: [
              {
                action: 'open',
                title: 'Open Charlotte'
              }
            ]
          },
          fcmOptions: {
            link: payload.url || '/chat'
          }
        }
      };

      // Send to multiple tokens
      const results = await Promise.allSettled(
        tokens.map(token => 
          this.messaging.send({
            ...message,
            token: token.endpoint
          })
        )
      );

      // Process results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 FCM Results: ${successful} successful, ${failed} failed`);

      // Clean up invalid tokens
      await this.cleanupInvalidTokens(results, tokens);

      return successful > 0;

    } catch (error) {
      console.error('❌ Error sending FCM notification:', error);
      return false;
    }
  }

  async sendToMultipleUsers(userIds: string[], payload: FCMServerPayload): Promise<number> {
    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.sendToUser(userId, payload))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      console.log(`📊 Multi-user FCM: ${successful}/${userIds.length} users notified`);
      
      return successful;
    } catch (error) {
      console.error('❌ Error sending multi-user FCM:', error);
      return 0;
    }
  }

  private async getUserTokens(userId: string): Promise<any[]> {
    try {
      const supabase = getSupabase();
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('subscription_type', 'fcm');

      if (error) {
        console.error('❌ Error fetching FCM tokens:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting user tokens:', error);
      return [];
    }
  }

  private async cleanupInvalidTokens(results: any[], tokens: any[]): Promise<void> {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const invalidTokens: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const error = result.reason;
          // Check if it's an invalid token error
          if (error?.code === 'messaging/registration-token-not-registered' ||
              error?.code === 'messaging/invalid-registration-token') {
            invalidTokens.push(tokens[index].id);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .in('id', invalidTokens);

        console.log(`🧹 Cleaned up ${invalidTokens.length} invalid FCM tokens`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up tokens:', error);
    }
  }

  // Test method
  async testNotification(userId: string): Promise<boolean> {
    return this.sendToUser(userId, {
      title: '🧪 FCM Test from Charlotte',
      body: 'Real Firebase Cloud Messaging is working!',
      url: '/chat',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Singleton instance
let firebaseAdminService: FirebaseAdminService | null = null;

export const getFirebaseAdminService = (): FirebaseAdminService => {
  if (!firebaseAdminService) {
    firebaseAdminService = new FirebaseAdminService();
  }
  return firebaseAdminService;
}; 