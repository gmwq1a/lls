// LLS standalone offline support: network-first with cache fallback (borrowed pattern from LLS9, runtime caching for hashed assets).
const cacheName = 'lls-standalone-1.0.3'
const core = ['./', './index.html']
self.addEventListener('install', event => event.waitUntil((async () => {
  await (await caches.open(cacheName)).addAll(core)
  await self.skipWaiting()
})()))
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('lls-standalone-') && k !== cacheName) await caches.delete(k)
  await self.clients.claim()
})()))
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== location.origin) return
  event.respondWith((async () => {
    const cache = await caches.open(cacheName)
    try {
      const response = await fetch(event.request)
      if (response.ok) await cache.put(event.request, response.clone())
      return response
    } catch {
      const hit = await cache.match(event.request, { ignoreSearch: true })
      if (hit) return hit
      if (event.request.mode === 'navigate') return await cache.match('./index.html') || Response.error()
      return Response.error()
    }
  })())
})
