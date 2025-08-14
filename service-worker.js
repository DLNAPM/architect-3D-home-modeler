/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'architect-3d-pwa-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx', // Requested by the browser
  '/manifest.webmanifest',
  '/favicon.svg',
  // Key third-party scripts from CDN that don't have versioning issues
  'https://cdn.tailwindcss.com',
  'https://ga.jspm.io/npm:es-module-shims@1.10.0/dist/es-module-shims.js',
  // Icons for PWA
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/icon-maskable-512x512.svg',
  '/apple-touch-icon.svg'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE).catch(error => {
          console.error('Failed to cache app shell resources. Offline functionality may be limited.', error);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For non-GET requests (e.g., POST), use the original body-buffering logic.
  // This is a workaround for browsers that do not support ReadableStream in request bodies (e.g., Safari on iOS).
  if (request.method !== 'GET') {
    if (request.body && request.method !== 'HEAD') {
      event.respondWith(
        (async () => {
          try {
            const requestClone = request.clone();
            const bodyBlob = await requestClone.blob();
            console.log(`Service Worker: Buffering body for ${request.method} request to ${request.url}`);
            const newRequest = new Request(request.url, {
              method: request.method,
              headers: request.headers,
              mode: request.mode,
              credentials: request.credentials,
              cache: request.cache,
              redirect: request.redirect,
              referrer: request.referrer,
              integrity: request.integrity,
              signal: request.signal,
              body: bodyBlob,
            });
            return await fetch(newRequest);
          } catch (error) {
            console.error(`Service Worker: Error handling non-GET request for ${request.url}.`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new Response(JSON.stringify({
                error: 'Service Worker fetch failed',
                details: errorMessage
              }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        })()
      );
    } else {
      event.respondWith(fetch(request));
    }
    return;
  }

  // For GET requests, use a "Cache-first, then network" strategy.
  // Dynamically cache third-party scripts as well.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // If we have a response in the cache, serve it.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from the network.
      return fetch(request).then((networkResponse) => {
          // For third-party assets (like esm.sh), cache them on the fly
          // so they are available for offline use next time.
          if (networkResponse && networkResponse.status === 200 && (request.url.startsWith('https://esm.sh/'))) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
              });
          }
          return networkResponse;
      }).catch(error => {
        // This will be triggered if the network request fails, e.g., offline.
        console.log('Service Worker: Fetch failed; returning offline fallback if available.', request.url, error);
        // Let the browser's default offline error show.
      });
    })
  );
});