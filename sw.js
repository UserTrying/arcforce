const CACHE_NAME = "arcforce-v2"
// bumped to v2 — forces browser to dump old cache and download fresh files
// bump this number any time you make CSS or JS changes

const FILES_TO_CACHE = [
  "/arcforce/",
  "/arcforce/index.html",
  "/arcforce/style.css",
  "/arcforce/game.js",
  "/arcforce/leaderboard.js"
]
// every file your game needs to run offline
// stored exactly as they appear in your GitHub Pages URL

self.addEventListener("install", event => {
  // self = the service worker itself, not the page
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE)
      // opens your named cache box
      // addAll fetches and saves every file in the list
    })
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          // find any cache that isn't the current version
          .map(key => caches.delete(key))
          // delete each outdated one
      )
    }).then(() => self.clients.claim())
    // take control of the page immediately after cleanup
  )
})

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      // got it in cache — serve it, no internet needed

      return fetch(event.request).then(response => {
        // not cached — go get it from network
        const copy = response.clone()
        // clone because a response can only be read once
        // one copy for the cache, one for the page
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy)
          // save fresh copy for next time
        })
        return response
      })
    })
  )
})
