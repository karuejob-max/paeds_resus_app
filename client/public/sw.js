/**
 * Paeds Resus Service Worker
 * 
 * Implements offline-first architecture for clinical decision support.
 * Critical for LMICs where connectivity is intermittent.
 * 
 * Strategy:
 * - Cache clinical data (PR-DC, guidelines) on install
 * - Serve from cache first, update in background
 * - Queue failed requests for retry when online
 * - Sync assessment data when connectivity restored
 */

const CACHE_VERSION = 'paeds-resus-v1';
const CLINICAL_DATA_CACHE = 'clinical-data-v1';
const RUNTIME_CACHE = 'runtime-v1';

// Critical clinical resources to cache immediately
const CLINICAL_RESOURCES = [
  '/clinical-assessment',
  '/docs/PR-DC_V1.0_Drug_Compendium.md',
  '/docs/Clinical_Guideline_V1.0.md',
  '/shared/weightEstimation.js',
  '/shared/drugCalculations.js',
];

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/manifest.json',
];

/**
 * Install event - cache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    (async () => {
      // Cache static assets
      const staticCache = await caches.open(CACHE_VERSION);
      await staticCache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: 'reload' })));

      // Cache clinical data
      const clinicalCache = await caches.open(CLINICAL_DATA_CACHE);
      await clinicalCache.addAll(CLINICAL_RESOURCES.map((url) => new Request(url, { cache: 'reload' })));

      console.log('[SW] Service worker installed successfully');

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== CLINICAL_DATA_CACHE && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );

      // Claim all clients immediately
      await self.clients.claim();

      console.log('[SW] Service worker activated successfully');
    })()
  );
});

/**
 * Fetch event - serve from cache first, then network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle clinical data requests (cache-first)
  if (isClinicalResource(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, CLINICAL_DATA_CACHE));
    return;
  }

  // Handle static assets (cache-first with network fallback)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_VERSION));
    return;
  }

  // Handle API requests (network-first with cache fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

/**
 * Cache-first strategy
 * Try cache first, fall back to network, update cache in background
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(`[SW] Serving from cache: ${request.url}`);

      // Update cache in background
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
        })
        .catch(() => {
          // Network failed, but we already have cached version
        });

      return cachedResponse;
    }

    // Cache miss - fetch from network
    console.log(`[SW] Cache miss, fetching from network: ${request.url}`);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error(`[SW] Cache-first strategy failed for ${request.url}:`, error);

    // Return offline page if available
    const cache = await caches.open(CACHE_VERSION);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Last resort: generic error response
    return new Response('Offline - Clinical data unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

/**
 * Network-first strategy
 * Try network first, fall back to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(`[SW] Network failed, trying cache: ${request.url}`);

    // Network failed - try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(`[SW] Serving from cache (offline): ${request.url}`);
      return cachedResponse;
    }

    // No cache available
    console.error(`[SW] No cache available for ${request.url}`);
    return new Response('Offline - No cached data available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

/**
 * Check if URL is a clinical resource
 */
function isClinicalResource(pathname) {
  return (
    pathname.startsWith('/docs/') ||
    pathname.startsWith('/shared/') ||
    pathname === '/clinical-assessment' ||
    pathname.includes('Drug_Compendium') ||
    pathname.includes('Clinical_Guideline')
  );
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
}

/**
 * Background sync event - retry failed requests
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-assessments') {
    event.waitUntil(syncAssessments());
  }
});

/**
 * Sync pending assessments when back online
 */
async function syncAssessments() {
  try {
    // Get pending assessments from IndexedDB
    const db = await openDatabase();
    const tx = db.transaction('pendingAssessments', 'readonly');
    const store = tx.objectStore('pendingAssessments');
    const pendingAssessments = await store.getAll();

    console.log(`[SW] Syncing ${pendingAssessments.length} pending assessments`);

    // Sync each assessment
    for (const assessment of pendingAssessments) {
      try {
        const response = await fetch('/api/trpc/assessment.save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assessment.data),
        });

        if (response.ok) {
          // Remove from pending queue
          const deleteTx = db.transaction('pendingAssessments', 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingAssessments');
          await deleteStore.delete(assessment.id);
          console.log(`[SW] Synced assessment ${assessment.id}`);
        }
      } catch (error) {
        console.error(`[SW] Failed to sync assessment ${assessment.id}:`, error);
      }
    }

    console.log('[SW] Assessment sync complete');
  } catch (error) {
    console.error('[SW] Assessment sync failed:', error);
  }
}

/**
 * Open IndexedDB database
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PaedsResusDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('pendingAssessments')) {
        db.createObjectStore('pendingAssessments', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('clinicalData')) {
        db.createObjectStore('clinicalData', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_CLINICAL_DATA') {
    event.waitUntil(cacheClinicalData(event.data.payload));
  }
});

/**
 * Cache clinical data from client
 */
async function cacheClinicalData(data) {
  try {
    const db = await openDatabase();
    const tx = db.transaction('clinicalData', 'readwrite');
    const store = tx.objectStore('clinicalData');

    await store.put({
      key: data.key,
      value: data.value,
      timestamp: Date.now(),
    });

    console.log(`[SW] Cached clinical data: ${data.key}`);
  } catch (error) {
    console.error('[SW] Failed to cache clinical data:', error);
  }
}

console.log('[SW] Service worker script loaded');
