const CACHE_NAME = "vitaquest-shell-v3"
const DATA_CACHE_NAME = "vitaquest-data-v1"
const APP_SHELL = ["/manifest.webmanifest", "/icon-192.svg", "/icon-512.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  ) {
    return
  }

  const requestUrl = new URL(event.request.url)
  const isNavigation = event.request.mode === "navigate"
  const isNextAsset = requestUrl.pathname.startsWith("/_next/")
  const isApi = requestUrl.pathname.startsWith("/api/")

  if (isNavigation || isNextAsset) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((cached) => cached ?? Response.error()),
      ),
    )
    return
  }

  if (isApi) {
    // Lecturas de datos: red primero, caché como respaldo y como memoria para modo offline.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(DATA_CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached ?? Response.error())),
    )
    return
  }

  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)))
})
