/**
 * Paeds Resus Platform — Service Worker v3
 *
 * Strategy:
 *   - Cache-first for static assets (JS/CSS/fonts/images)
 *   - Network-first with cache fallback for API calls
 *   - Stale-while-revalidate for HTML navigation
 *   - Background sync for analytics queue and SAMPLE history queue
 *
 * Critical for LMIC settings where connectivity is intermittent.
 */

const CACHE_VERSION = 'paeds-resus-v3';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE     = `${CACHE_VERSION}-api`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
];

const CACHEABLE_API_PREFIXES = [
  '/api/trpc/drugCalculations',
  '/api/trpc/weightEstimation',
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch((err) => console.warn('[SW] Shell cache partial fail:', err)))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('paeds-resus-') && k !== STATIC_CACHE && k !== RUNTIME_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname !== self.location.hostname) return;

  // Static assets — cache first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Cacheable API calls — network first, cache fallback
  if (CACHEABLE_API_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // All other API/tRPC — skip (analytics queue handles retry)
  if (url.pathname.startsWith('/api/')) return;

  // HTML navigation — stale-while-revalidate, fallback to shell
  event.respondWith(navigationHandler(request));
});

// ─── Background Sync ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-queue-drain') {
    event.waitUntil(drainAnalyticsQueue());
  }
  if (event.tag === 'sample-history-sync') {
    event.waitUntil(drainSampleHistoryQueue());
  }
});

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Paeds Resus', {
      body: data.body || '',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: data.tag || 'paeds-resus',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

// ─── Message Handler ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => cache.addAll(event.data.urls || []))
    );
  }
});

// ─── Fetch Helpers ────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request) ||
                   await caches.match('/') ||
                   await caches.match('/index.html');
    return cached || new Response('Offline', { status: 503 });
  }
}

// ─── Background Sync Helpers ──────────────────────────────────────────────────
async function drainAnalyticsQueue() {
  try {
    const db = await openIDB('paeds-resus-offline', 3);
    const tx = db.transaction('analyticsQueue', 'readwrite');
    const store = tx.objectStore('analyticsQueue');
    const events = await idbGetAll(store);
    if (!events.length) return;
    for (const evt of events) {
      try {
        const res = await fetch('/api/trpc/events.trackEvent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: evt.payload }),
        });
        if (res.ok) store.delete(evt.id);
      } catch (_) { /* leave in queue */ }
    }
    await txComplete(tx);
  } catch (err) {
    console.warn('[SW] Analytics drain failed:', err);
  }
}

async function drainSampleHistoryQueue() {
  try {
    const db = await openIDB('paeds-resus-offline', 3);
    if (!db.objectStoreNames.contains('sampleHistoryQueue')) return;
    const tx = db.transaction('sampleHistoryQueue', 'readwrite');
    const store = tx.objectStore('sampleHistoryQueue');
    const items = await idbGetAll(store);
    if (!items.length) return;
    for (const item of items) {
      try {
        const res = await fetch('/api/trpc/sampleHistory.saveSampleHistory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: item.payload }),
        });
        if (res.ok) store.delete(item.id);
      } catch (_) { /* leave in queue */ }
    }
    await txComplete(tx);
  } catch (err) {
    console.warn('[SW] SAMPLE history drain failed:', err);
  }
}

function openIDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => { /* stores managed by client */ };
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
