/**
 * PWA Utilities
 * Service worker registration, push notifications, offline support
 */

export interface PWAConfig {
  swPath: string;
  enableNotifications: boolean;
  enableOfflineSupport: boolean;
  enableBackgroundSync: boolean;
}

class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: PWAConfig;

  constructor(config: PWAConfig) {
    this.config = config;
  }

  /**
   * Initialize PWA
   */
  async init(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Workers not supported");
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.config.swPath);
      console.log("Service Worker registered successfully");

      // Check for updates periodically
      setInterval(() => {
        this.registration?.update();
      }, 60000); // Check every minute

      // Handle service worker updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker available
              this.notifyUpdate();
            }
          });
        }
      });

      if (this.config.enableNotifications) {
        await this.requestNotificationPermission();
      }

      if (this.config.enableBackgroundSync) {
        await this.registerBackgroundSync();
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error("Service Worker not registered");
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
      });

      return subscription;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return null;
    }
  }

  /**
   * Send notification
   */
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      console.error("Service Worker not registered");
      return;
    }

    try {
      await this.registration.showNotification(title, {
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        ...options,
      });
    } catch (error) {
      console.error("Send notification failed:", error);
    }
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(): Promise<void> {
    if (!this.registration || !("sync" in this.registration)) {
      console.warn("Background Sync not supported");
      return;
    }

    try {
      const syncManager = (this.registration as any).sync;
      await syncManager.register("sync-enrollments");
      await syncManager.register("sync-progress");
      console.log("Background sync registered");
    } catch (error) {
      console.error("Background sync registration failed:", error);
    }
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get cache
   */
  async getFromCache(url: string): Promise<Response | undefined> {
    const cache = await caches.open("paeds-resus-v1");
    return cache.match(url);
  }

  /**
   * Add to cache
   */
  async addToCache(url: string, response: Response): Promise<void> {
    const cache = await caches.open("paeds-resus-v1");
    await cache.put(url, response);
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  /**
   * Notify user of update
   */
  private notifyUpdate(): void {
    const message = document.createElement("div");
    message.className = "pwa-update-notification";
    message.innerHTML = `
      <div class="pwa-update-content">
        <p>A new version of Paeds Resus is available!</p>
        <button id="pwa-update-btn">Update Now</button>
        <button id="pwa-dismiss-btn">Dismiss</button>
      </div>
    `;

    document.body.appendChild(message);

    const updateBtn = document.getElementById("pwa-update-btn") as HTMLButtonElement | null;
    const dismissBtn = document.getElementById("pwa-dismiss-btn") as HTMLButtonElement | null;

    if (updateBtn) {
      updateBtn.addEventListener("click", () => {
        if (this.registration?.waiting) {
          (this.registration.waiting as any).postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        message.remove();
      });
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      const code = rawData.charCodeAt(i);
      outputArray[i] = code;
    }
    return outputArray;
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
    }
  }
}

// Initialize PWA manager
export const pwaManager = new PWAManager({
  swPath: "/service-worker.js",
  enableNotifications: true,
  enableOfflineSupport: true,
  enableBackgroundSync: true,
});

// Auto-initialize on app load
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    pwaManager.init();
  });
}
