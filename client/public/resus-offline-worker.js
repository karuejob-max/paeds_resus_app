/**
 * ResusGPS Offline Service Worker
 * 
 * Enables offline-first ResusGPS with local caching and sync.
 * Providers can use ResusGPS without internet; sessions sync when connectivity returns.
 * 
 * Strategic alignment: Resilience for low-resource hospitals with unreliable connectivity
 * Critical for reducing preventable mortality in areas with poor infrastructure
 */

const CACHE_VERSION = 'resus-offline-v1';
const RESUS_CACHE = `${CACHE_VERSION}-resus`;
const SESSION_DB = 'resus-sessions';
const SESSION_STORE = 'sessions';

// Install event - cache critical ResusGPS assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RESUS_CACHE).then((cache) => {
      return cache.addAll([
        '/resus-offline-app.html',
        '/resus-pathways.json',
        '/resus-protocols.json',
        '/resus-guidelines.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('resus-offline-') && name !== RESUS_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // ResusGPS API calls - cache-first with network fallback
  if (url.pathname.includes('/api/trpc/resus')) {
    event.respondWith(handleResusAPI(request));
    return;
  }

  // Static assets - cache-first
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // HTML pages - network-first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHTML(request));
    return;
  }
});

/**
 * Handle ResusGPS API calls with offline support
 */
async function handleResusAPI(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(RESUS_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed - try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // No cache - return offline response
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'ResusGPS is offline. Sessions will sync when connectivity returns.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RESUS_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not available offline', { status: 404 });
  }
}

/**
 * Handle HTML pages with network-first strategy
 */
async function handleHTML(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Page not available offline', { status: 404 });
  }
}

/**
 * Handle background sync for offline sessions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-resus-sessions') {
    event.waitUntil(syncResusSessionsToServer());
  }
});

/**
 * Sync offline ResusGPS sessions to server when connectivity returns
 */
async function syncResusSessionsToServer() {
  try {
    const db = await openDB(SESSION_DB);
    const sessions = await getAllFromStore(db, SESSION_STORE);

    for (const session of sessions) {
      if (!session.synced) {
        try {
          const response = await fetch('/api/trpc/resusSessionAnalytics.recordSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session),
          });

          if (response.ok) {
            // Mark as synced
            await updateInStore(db, SESSION_STORE, {
              ...session,
              synced: true,
              syncedAt: new Date().toISOString(),
            });

            // Notify client
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'session-synced',
                  sessionId: session.id,
                });
              });
            });
          }
        } catch (error) {
          console.error('Failed to sync session:', error);
        }
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

/**
 * IndexedDB helpers
 */
function openDB(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function updateInStore(db, storeName, item) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Message handler for client communication
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'save-session') {
    saveSessionLocally(event.data.session);
  } else if (event.data.type === 'sync-sessions') {
    syncResusSessionsToServer();
  }
});

async function saveSessionLocally(session) {
  try {
    const db = await openDB(SESSION_DB);
    await updateInStore(db, SESSION_STORE, {
      ...session,
      synced: false,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to save session locally:', error);
  }
}
