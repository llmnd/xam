"use strict";

const CACHE_NAME = "xamsamed-pwa-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./mobile.html",
  "./workflow.html",
  "./sources.html",
  "./presentation.html",
  "./manifest.webmanifest",
  "./pwa.js",
  "./service-worker.js",
  "./style.css",
  "./style-upgrade.css",
  "./mobile.css",
  "./app.js",
  "./mobile.js",
  "./theme.js",
  "./workflow-demo.js",
  "./presentation.js",
  "./assets/xamsamed-icon.svg",
  "./assets/xamsamed-icon-180.png",
  "./assets/xamsamed-icon-192.png",
  "./assets/xamsamed-icon-512.png",
  "./assets/pharmacy-showcase-1.jpg",
  "./assets/pharmacy-showcase-2.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("xamsamed-pwa-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage || caches.match("./mobile.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      });
    })
  );
});
