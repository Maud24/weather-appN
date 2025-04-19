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
  "./assets/manifest.json",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
