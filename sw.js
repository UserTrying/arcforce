const CACHE_NAME = "arcforce-v1"
// name of your cache — like a labeled storage box
// change the version number anytime you want to force a fresh cache

const FILES_TO_CACHE = [
  "/arcforce/",
  "/arcforce/index.html",
  "/arcforce/style.css",
  "/arcforce/game.js",
  "/arcforce/leaderboard.js"
]
// every file your game needs to run
// stored exactly as they appear in your GitHub Pages URL
self.addEventListener("install", event => {
  // self = the service worker itself, not the page
  // addEventListener listens for the install moment

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
          // .map here isn't displaying anything — it's
          // transforming each old key into a delete action
      )
    }).then(() => self.clients.claim())
    // take control of the page immediately after cleanup
  )
})
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      // check if we have this file saved already

      if (cached) return cached
      // got it — serve from cache, no internet needed

      return fetch(event.request).then(response => {
        // not cached — go get it from network

        const copy = response.clone()
        // clone it because a response can only be read once
        // one copy for the cache, one copy for the page

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy)
          // save the fresh copy for next time
        })

        return response
        // send the original to the page
      })
    })
  )
})
