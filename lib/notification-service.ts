// Enhanced Notification Service with iOS 16.4+ Support
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

export interface IOSCapabilities {
  isIOS: boolean;
  isIPadOS: boolean;
  version: number;
  isPWAInstalled: boolean;
  supportsNotifications: boolean;
  supportsWebPush: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private isSupported: boolean = false;
  private isSubscribed: boolean = false;
  private subscription: PushSubscription | null = null;
  private iosCapabilities: IOSCapabilities;

  constructor() {
    this.iosCapabilities = this.detectIOSCapabilities();
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
   * Detecta capacidades específicas do iOS
   */
  private detectIOSCapabilities(): IOSCapabilities {
    if (typeof window === 'undefined') {
      return {
        isIOS: false,
        isIPadOS: false,
        version: 0,
        isPWAInstalled: false,
        supportsNotifications: false,
        supportsWebPush: false
      };
    }

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isIPadOS = /iPad/.test(userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Detectar versão do iOS
    let version = 0;
    if (isIOS || isIPadOS) {
      const match = userAgent.match(/OS (\d+)_(\d+)/);
      if (match) {
        version = parseFloat(`${match[1]}.${match[2]}`);
      }
    }

    // Verificar se PWA foi instalado
    const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          (navigator as any).standalone === true;

    // iOS 16.4+ é necessário para push notifications
    const supportsNotifications = (isIOS || isIPadOS) && version >= 16.4 && isPWAInstalled;
    const supportsWebPush = supportsNotifications;

    const capabilities = {
      isIOS: isIOS || isIPadOS,
      isIPadOS,
      version,
      isPWAInstalled,
      supportsNotifications,
      supportsWebPush
    };

    console.log('🍎 iOS Capabilities detected:', capabilities);
    return capabilities;
  }

  /**
   * Verifica suporte para notificações
   */
  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }

    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;

    // Para iOS, requer PWA instalado
    if (this.iosCapabilities.isIOS) {
      this.isSupported = this.iosCapabilities.supportsNotifications && 
                        hasServiceWorker && 
                        hasPushManager && 
                        hasNotifications;
      
      console.log('🍎 iOS Support check:', {
        hasServiceWorker,
        hasPushManager,
        hasNotifications,
        iosVersion: this.iosCapabilities.version,
        isPWAInstalled: this.iosCapabilities.isPWAInstalled,
        finalSupport: this.isSupported
      });
    } else {
      // Para outras plataformas
      this.isSupported = hasServiceWorker && hasPushManager && hasNotifications;
    }
  }

  /**
   * Inicializa estado de subscription
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
        
        // Para iOS, verificar se subscription ainda é válida
        if (this.iosCapabilities.isIOS) {
          await this.validateIOSSubscription(existingSubscription);
        }
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
   * Valida subscription específica para iOS
   */
  private async validateIOSSubscription(subscription: PushSubscription): Promise<void> {
    try {
      // Para iOS, podemos tentar fazer um teste simples
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          platform: 'ios',
          test: true
        })
      });

      if (!response.ok) {
        console.log('🍎 iOS subscription validation failed, will recreate');
        await subscription.unsubscribe();
        this.subscription = null;
        this.isSubscribed = false;
      } else {
        console.log('🍎 iOS subscription validated successfully');
      }
    } catch (error) {
      console.error('🍎 iOS subscription validation error:', error);
    }
  }

  /**
   * Verifica permissão atual
   */
  async checkPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Solicita permissão - versão iOS otimizada
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      if (this.iosCapabilities.isIOS && !this.iosCapabilities.isPWAInstalled) {
        throw new Error('iOS requires PWA installation first');
      }
      throw new Error('Push notifications not supported');
    }

    try {
      // Para iOS, mostrar guidance antes de solicitar
      if (this.iosCapabilities.isIOS) {
        console.log('🍎 Requesting permission on iOS 16.4+');
      }

      const permission = await Notification.requestPermission();
      console.log('🔔 Permission result:', permission);
      
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return false;
    }
  }

  /**
   * Cria subscription - versão iOS otimizada
   */
  async subscribe(userId?: string): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Para iOS, verificar se ainda temos suporte
      if (this.iosCapabilities.isIOS && !this.iosCapabilities.isPWAInstalled) {
        throw new Error('iOS PWA not properly installed');
      }

      // Verificar subscription existente
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription;
        this.isSubscribed = true;
        
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

      const subscriptionOptions: PushSubscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      };

      // Para iOS, adicionar configurações específicas se disponíveis
      if (this.iosCapabilities.isIOS) {
        console.log('🍎 Creating iOS-optimized subscription');
        // iOS não suporta parâmetros extras, manter simples
      }

      const subscription = await registration.pushManager.subscribe(subscriptionOptions);

      this.subscription = subscription;
      this.isSubscribed = true;

      if (userId) {
        await this.saveSubscriptionToServer(subscription, userId);
      }

      console.log('✅ Push subscription created for iOS:', subscription.endpoint.substring(0, 50) + '...');
      return subscription;

    } catch (error) {
      console.error('❌ iOS subscription failed:', error);
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
   * Envia notificação local - iOS otimizada
   */
  async sendLocalNotification(message: NotificationMessage): Promise<void> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.log('📢 Using in-app notification instead');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Configurações iOS-específicas
      const notificationOptions: NotificationOptions = {
        body: message.body,
        icon: message.icon || '/icons/icon-192x192.png',
        badge: message.badge || '/icons/icon-72x72.png',
        data: { url: message.url, platform: 'ios', ...message.data },
        tag: 'charlotte-notification',
        requireInteraction: this.iosCapabilities.isIOS, // iOS precisa de interação
        silent: false
      };

      // iOS tem limitações com actions
      if (message.actions && !this.iosCapabilities.isIOS) {
        notificationOptions.actions = message.actions;
      } else if (this.iosCapabilities.isIOS && message.actions) {
        // iOS suporta apenas 1-2 actions simples
        notificationOptions.actions = message.actions.slice(0, 1);
      }

      await registration.showNotification(message.title, notificationOptions);
      console.log('🍎 iOS notification sent');
    } catch (error) {
      console.error('❌ iOS local notification failed:', error);
    }
  }

  /**
   * Utilitários
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

  private async saveSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<void> {
    const platform = this.iosCapabilities.isIOS ? 'ios' : this.detectPlatform();
    
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
      is_active: true,
      subscription_type: 'web_push',
      ios_version: this.iosCapabilities.version
    };

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      throw new Error('Failed to save iOS subscription to server');
    }

    console.log('🍎 iOS subscription saved to server');
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private detectPlatform(): 'ios' | 'android' | 'desktop' {
    if (this.iosCapabilities.isIOS) return 'ios';
    
    const userAgent = navigator.userAgent;
    if (/Android/.test(userAgent)) return 'android';
    return 'desktop';
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

  get isIOSDevice(): boolean {
    return this.iosCapabilities.isIOS;
  }

  get iOSCapabilities(): IOSCapabilities {
    return { ...this.iosCapabilities };
  }

  /**
   * Método para debug/teste específico iOS
   */
  async testIOSNotification(): Promise<void> {
    if (!this.iosCapabilities.isIOS) {
      console.log('❌ Not an iOS device');
      return;
    }

    await this.sendLocalNotification({
      title: '🧪 iOS Test',
      body: 'Push notifications working on iOS 16.4+!',
      url: '/chat',
      data: { test: true, platform: 'ios' }
    });
  }
}

export default NotificationService;