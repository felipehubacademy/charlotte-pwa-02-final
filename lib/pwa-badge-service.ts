/**
 * PWA Badge Service
 * Gerencia badges no ícone PWA para mostrar notificações/achievements pendentes
 */

export class PWABadgeService {
  private static badgeCount = 0;
  private static readonly DB_NAME = 'charlotte-badges';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'badges';

  /**
   * Verificar se Badge API é suportada
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
  }

  /**
   * Abrir IndexedDB para persistir badge
   */
  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  /**
   * Salvar contagem no storage persistente
   */
  private static async saveBadgeCount(count: number): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      await new Promise((resolve, reject) => {
        const request = store.put({ value: count }, 'count');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      this.badgeCount = count;
    } catch (error) {
      console.error('❌ Erro ao salvar badge count:', error);
    }
  }

  /**
   * Carregar contagem do storage persistente
   */
  private static async loadBadgeCount(): Promise<number> {
    try {
      const db = await this.openDB();
      const tx = db.transaction([this.STORE_NAME], 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const result: any = await new Promise((resolve, reject) => {
        const request = store.get('count');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return result?.value || 0;
    } catch (error) {
      console.error('❌ Erro ao carregar badge count:', error);
      return 0;
    }
  }

  /**
   * Sincronizar badge count com storage
   */
  static async syncBadgeCount(): Promise<void> {
    try {
      this.badgeCount = await this.loadBadgeCount();
      if (this.isSupported() && this.badgeCount > 0) {
        await (navigator as any).setAppBadge(this.badgeCount);
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar badge:', error);
    }
  }

  /**
   * Definir badge no ícone PWA
   */
  static async setBadge(count: number = 1): Promise<void> {
    if (!this.isSupported()) {
      console.log('🏷️ Badge API não suportada neste dispositivo');
      return;
    }

    try {
      this.badgeCount = count;
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
        console.log(`🏷️ Badge definido: ${count}`);
      } else {
        await this.clearBadge();
      }
      await this.saveBadgeCount(count);
    } catch (error) {
      console.error('❌ Erro ao definir badge:', error);
    }
  }

  /**
   * Incrementar badge
   */
  static async incrementBadge(): Promise<void> {
    await this.setBadge(this.badgeCount + 1);
  }

  /**
   * Limpar badge
   */
  static async clearBadge(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await (navigator as any).clearAppBadge();
      this.badgeCount = 0;
      await this.saveBadgeCount(0);
      console.log('🏷️ Badge limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar badge:', error);
    }
  }

  /**
   * Limpar badge quando app é aberto (usar no useEffect principal)
   */
  static async clearBadgeOnAppOpen(): Promise<void> {
    console.log('🏷️ App aberto, limpando badge...');
    await this.clearBadge();
  }

  /**
   * Obter contagem atual do badge
   */
  static getBadgeCount(): number {
    return this.badgeCount;
  }

  /**
   * Definir badge para achievements não vistos
   */
  static async setBadgeForAchievements(count: number): Promise<void> {
    await this.setBadge(count);
  }

  /**
   * Definir badge para notificações pendentes
   */
  static async setBadgeForNotifications(count: number): Promise<void> {
    await this.setBadge(count);
  }

  /**
   * Inicializar badge service (chamar no início do app)
   */
  static async initialize(): Promise<void> {
    await this.syncBadgeCount();
    console.log(`🏷️ Badge Service inicializado. Count atual: ${this.badgeCount}`);
  }
} 