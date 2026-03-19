const CACHE_NAME = "arcforce-v5"
// name for this version of the saved files
// change the number when you update files so old cache clears

const FILES_TO_CACHE = [
  "/arcforce/",
  "/arcforce/index.html",
  "/arcforce/style.css",
  "/arcforce/game.js",
  "/arcforce/leaderboard.js"
]
// every file to save on the device for offline use

self.addEventListener("install", event => {
  // runs once when service worker is first set up
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE)
      // downloads and saves every file in the list
    })
  )
})

self.addEventListener("activate", event => {
  // runs after install, cleans up old cached versions
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          // find any cache that isn't the current version
          .map(key => caches.delete(key))
          // delete it
      )
    }).then(() => self.clients.claim())
    // take control of the page immediately
  )
})

self.addEventListener("fetch", event => {
  // runs every time the page tries to load something
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      // if we have it saved locally, serve it from cache
      // this is what makes it work offline

      return fetch(event.request).then(response => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy)
          // save a copy of new files as they load for future offline use
        })
        return response
        // also return the real response to the page
      })
    })
  )
})
