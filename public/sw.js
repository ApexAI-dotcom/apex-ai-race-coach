/**
 * ApexAI — Service Worker DÉSACTIVÉ (stub auto-destructeur).
 *
 * Le SW a causé des états périmés (écran noir après déploiement, ancien tier
 * affiché). Le navigateur détecte toujours les changements de ce fichier et
 * installe cette version, qui se désinscrit elle-même et purge tous les
 * caches — ça répare automatiquement les navigateurs restés sur l'ancien SW.
 * Aucune interception de requête : tout passe directement au réseau.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) { /* noop */ }
      await self.registration.unregister();
      const clients = await self.clients.matchAll();
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});
