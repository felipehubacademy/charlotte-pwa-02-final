export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationMessage {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  url?: string;
  actions?: NotificationAction[];
}

export interface NotificationSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  platform: 'ios' | 'android' | 'desktop';
  created_at: string;
  is_active: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private isSupported: boolean = false;
  private isSubscribed: boolean = false;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.checkSupport();
    this.initializeSubscriptionState();
  }

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  /**
   * Inicializa o estado de subscription verificando se já existe
   */
  private async initializeSubscriptionState(): Promise<void> {
    if (!this.isSupported || typeof window === 'undefined') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        this.subscription = existingSubscription;
        this.isSubscribed = true;
        console.log('✅ Found existing push subscription');
      } else {
        this.subscription = null;
        this.isSubscribed = false;
        console.log('📭 No existing push subscription found');
      }
    } catch (error) {
      console.error('❌ Error checking subscription state:', error);
      this.subscription = null;
      this.isSubscribed = false;
    }
  }

  /**
   * Verifica se push notifications são suportadas no dispositivo atual
   */
  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }

    // Verificação abrangente de suporte
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;

    // iOS específico: apenas funciona se PWA foi instalado (A2HS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          (navigator as any).standalone === true;

    if (isIOS && !isPWAInstalled) {
      console.log('🍎 iOS detected: Push notifications require Add to Home Screen first');
      this.isSupported = false;
      return;
    }

    this.isSupported = hasServiceWorker && hasPushManager && hasNotifications;
    console.log('📱 Push notification support:', {
      hasServiceWorker,
      hasPushManager, 
      hasNotifications,
      isIOS,
      isPWAInstalled,
      supported: this.isSupported
    });
  }

  /**
   * Verifica se o usuário já deu permissão
   */
  async checkPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported on this device');
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission request result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return false;
    }
  }

  /**
   * Cria uma subscription para push notifications
   */
  async subscribe(userId?: string): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    try {
      // Verificar se já tem subscription ativa
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        this.subscription = existingSubscription;
        this.isSubscribed = true;
        console.log('✅ Using existing subscription');
        
        // Update subscription on server if userId provided
        if (userId) {
          await this.saveSubscriptionToServer(existingSubscription, userId);
        }
        
        return existingSubscription;
      }

      // Criar nova subscription
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      this.subscription = subscription;
      this.isSubscribed = true;

      // Salvar subscription no backend
      if (userId) {
        await this.saveSubscriptionToServer(subscription, userId);
      }

      console.log('✅ Push subscription created:', subscription);
      return subscription;

    } catch (error) {
      console.error('❌ Subscription failed:', error);
      return null;
    }
  }

  /**
   * Remove subscription
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        await this.removeSubscriptionFromServer();
        this.subscription = null;
        this.isSubscribed = false;
        console.log('✅ Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Envia notificação local (fallback)
   */
  async sendLocalNotification(message: NotificationMessage): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.log('📢 Using in-app notification instead');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(message.title, {
        body: message.body,
        icon: message.icon || '/icons/icon-192x192.png',
        badge: message.badge || '/icons/icon-72x72.png',
        data: { url: message.url, ...message.data },
        tag: 'charlotte-notification',
        requireInteraction: false,
        silent: false
      });
    } catch (error) {
      console.error('❌ Local notification failed:', error);
    }
  }

  /**
   * Utilitário para converter VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Salva subscription no backend
   */
  private async saveSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<void> {
    const platform = this.detectPlatform();
    
    const subscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh') ? 
          btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
        auth: subscription.getKey('auth') ? 
          btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
      },
      platform,
      is_active: true
    };

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription to server');
    }
  }

  /**
   * Remove subscription do backend
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Detecta platform do usuário
   */
  private detectPlatform(): 'ios' | 'android' | 'desktop' {
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    } else if (/Android/.test(userAgent)) {
      return 'android';
    } else {
      return 'desktop';
    }
  }

  // Getters
  get supported(): boolean {
    return this.isSupported;
  }

  get subscribed(): boolean {
    return this.isSubscribed;
  }

  get currentSubscription(): PushSubscription | null {
    return this.subscription;
  }
}

export default NotificationService; 