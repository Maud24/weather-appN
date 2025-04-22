const cacheName = "weathapp-cache-v1";

const assets = [
  "./",
  "./index.html",
  "./assets/css/Style.css",
  "./assets/js/App1.js",
  "./assets/js/module.js",
  "./assets/js/route.js",
  "./assets/js/assist-meteo.js",
  "./assets/images/logoWeather.PNG",
  "./assets/images/openweather.png",
  "./assets/images/weather_icons/04n.png",
  "./assets/images/weather_icons/04d.png",
  "./manifest.webmanifest",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js"
];

// INSTALLATION
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return Promise.all(
        assets.map((url) =>
          fetch(url)
            .then((response) => {
              if (!response.ok) throw new Error(`Failed to fetch ${url}`);
              return cache.put(url, response);
            })
            .catch((err) => {
              console.warn(`[SW] Asset not cached: ${url}`, err);
            })
        )
      );
    })
  );
  self.skipWaiting();
});

// ACTIVATION
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
