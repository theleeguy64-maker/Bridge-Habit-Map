// Bridge Habit Map — service worker
// Pattern: PWA.md → "Simple PWA Pattern" (cache-first shell, no API calls to handle).
// Bump SHELL_CACHE on every code change to force re-install.

const SHELL_CACHE = "habit-map-v0.3.0";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./app.js",
  "./checklists.js",
  "./styles.css",
  "./manifest.json",
  "./icon-180.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // No API calls — habit map is localStorage-only.
  // Cache-first for the shell with background refresh.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request)
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => null);
      return cached || networkFetch || new Response("Offline", { status: 503 });
    })
  );
});
