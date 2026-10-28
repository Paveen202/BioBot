const BASE = new URL(".", self.location).pathname;
const CACHE = "biobot-shell-v2";
const SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "animalpedia.html",
  BASE + "minigames.html",
  BASE + "bio-city.html",
  BASE + "styles.css",
  BASE + "animalpedia.js",
  BASE + "minigames.js",
  BASE + "bio-city.js",
  BASE + "profile.js",
  BASE + "supabase-config.js",
  BASE + "bio-city-catalog.json",
  BASE + "iucn-animals-1000.js",
  BASE + "manifest.webmanifest",
  BASE + "icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match(BASE + "index.html"))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
    return response;
  })));
});
