/**
 * ApexAI — Service Worker
 *
 * Stratégie CRITIQUE : le HTML doit toujours venir du réseau en priorité.
 * Un cache-first sur index.html sert un document périmé après chaque
 * déploiement, qui référence des bundles JS supprimés → écran noir
 * ("Failed to load module script ... MIME type text/html").
 *
 *   - navigation / HTML  -> network-first (fallback cache hors-ligne)
 *   - /assets/* hashés   -> cache-first (noms immuables, sûrs à garder)
 *   - reste (icônes...)  -> stale-while-revalidate
 *   - jamais de cache    -> API, autres origines, requêtes non-GET
 */
const VERSION = 'v3';
const HTML_CACHE = `apexai-html-${VERSION}`;
const ASSET_CACHE = `apexai-assets-${VERSION}`;
const STATIC_CACHE = `apexai-static-${VERSION}`;

const PRECACHE = [
  '/favicon.ico',
  '/favicon.svg',
  '/site.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([HTML_CACHE, ASSET_CACHE, STATIC_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jamais de service worker sur les appels d'API / autres origines
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // 1. Navigations & HTML : réseau d'abord, cache en secours hors-ligne
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(HTML_CACHE).then((c) => c.put('/index.html', copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match('/index.html').then((r) => r || Response.error()))
    );
    return;
  }

  // 2. Bundles hashés : cache d'abord (le nom change à chaque build)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. Reste des statiques : on sert le cache et on rafraîchit en arrière-plan
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
