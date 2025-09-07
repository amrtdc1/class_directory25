const CACHE_NAME = "class-dir-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./directory.json",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install event: cache everything
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch event: serve from cache, fall back to network
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});