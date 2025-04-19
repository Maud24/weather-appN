const cacheName = "weathapp-cache-v1";
const assets = [
  "./",
  "./index.html",
  "./assets/css/Style.css",
  "./assets/js/App1.js",
  "./assets/js/module.js",
  "./assets/js/route.js",
  "./assets/images/logoWeather.PNG",
  "./assets/images/openweather.png",
  "./assets/manifest.webmanifest", // ← corriger l'extension ici
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js"
];

// Installation du service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assets);
    })
  );
  self.skipWaiting(); // active immédiatement
});

// Activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim(); // prendre le contrôle immédiatement
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
