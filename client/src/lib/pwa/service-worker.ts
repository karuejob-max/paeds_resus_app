/**
 * Service Worker for PaedsResusGPS
 * 
 * Handles offline asset caching, background sync, and push notifications
 */

const CACHE_NAME = 'paeds-resus-v1';
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache critical assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('Failed to cache critical assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first strategy for assets, network-first for API
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, fallback to cache
  if (request.url.includes('/api/') || request.url.includes('/trpc/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets - cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok && !request.url.includes('?')) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-clinical-data') {
    event.waitUntil(syncClinicalData());
  }
});

async function syncClinicalData(): Promise<void> {
  try {
    // Get pending clinical data from IndexedDB
    const db = await openDatabase();
    const pendingData = await getPendingData(db);

    // Push to server
    for (const data of pendingData) {
      try {
        const response = await fetch('/api/sync-clinical-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          // Mark as synced in IndexedDB
          await markAsSynced(db, data.id);
        }
      } catch (error) {
        console.error('Failed to sync clinical data:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PaedsResusGPS', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('clinicalData')) {
        db.createObjectStore('clinicalData', { keyPath: 'id' });
      }
    };
  });
}

function getPendingData(db: IDBDatabase): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['clinicalData'], 'readonly');
    const store = transaction.objectStore('clinicalData');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const pending = request.result.filter((item: any) => !item.synced);
      resolve(pending);
    };
  });
}

function markAsSynced(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['clinicalData'], 'readwrite');
    const store = transaction.objectStore('clinicalData');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const data = getRequest.result;
      data.synced = true;
      const updateRequest = store.put(data);
      updateRequest.onerror = () => reject(updateRequest.error);
      updateRequest.onsuccess = () => resolve();
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Push notification handler
self.addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'PaedsResusGPS';
  const options = {
    body: data.body || 'Clinical update',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'clinical-update',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return (client as any).focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
