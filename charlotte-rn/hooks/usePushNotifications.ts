// hooks/usePushNotifications.ts
// Registers Expo Push Token, saves to Supabase, handles received notifications

import React from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

const EXPO_PROJECT_ID = 'da14586b-2944-4150-b8ad-5ff7e32af6e2';

// How notifications appear while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── XP milestone thresholds ──────────────────────────────────────────────────
const XP_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];

export function checkXPMilestone(prevXP: number, newXP: number): number | null {
  for (const milestone of XP_MILESTONES) {
    if (prevXP < milestone && newXP >= milestone) return milestone;
  }
  return null;
}

export async function sendXPMilestoneNotification(milestone: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Marco alcançado!',
      body: `Você chegou a ${milestone.toLocaleString()} XP! Continue praticando com a Charlotte.`,
      sound: true,
    },
    trigger: null, // immediately
  });
}

// ── Main hook ────────────────────────────────────────────────────────────────
export function usePushNotifications(userId?: string) {
  const notificationListener = React.useRef<Notifications.Subscription>();
  const responseListener = React.useRef<Notifications.Subscription>();

  React.useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const setup = async () => {
      const token = await registerForPushNotifications();
      if (token && mounted) {
        await saveTokenToSupabase(userId, token);
      }

      // Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('charlotte', {
          name: 'Charlotte AI',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#A3FF3C',
        });
      }
    };

    setup();

    // Notification received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Push received:', notification.request.content.title);
    });

    // User tapped a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      console.log('👆 Push tapped:', data);
      // Future: router.push(data.screen) for deep linking
    });

    return () => {
      mounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId]);
}

// ── Registration ─────────────────────────────────────────────────────────────
async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Push permission denied');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });

    console.log('✅ Expo Push Token:', token);
    return token;
  } catch (e) {
    console.warn('❌ Push registration failed:', e);
    return null;
  }
}

// ── Save token to Supabase ───────────────────────────────────────────────────
async function saveTokenToSupabase(userId: string, token: string) {
  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: token })
    .eq('id', userId);

  if (error) {
    console.warn('❌ Failed to save push token:', error.message);
  } else {
    console.log('✅ Push token saved to Supabase');
  }
}
