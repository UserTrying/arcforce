// ============================================================
// GROUP 1 — CONFIG
// your connection info. everything else references these.
// change values here and the whole file updates automatically
// ============================================================

const BIN_ID = "69bad304c3097a1dd53881f6"
// your specific bin on JSONBin — like a mailbox number

const API_KEY = "PASTE_YOUR_NEW_KEY_HERE"
// your restricted key — proves you're allowed in
// you need to regenerate this on JSONBin since it was exposed publicly

const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`
// full address of your bin
// uses BIN_ID directly via template literal so you only define it once

const HEADERS = {
  "X-Access-Key": API_KEY,
  "Content-Type": "application/json"
}
// package sent with every request to JSONBin
// X-Access-Key proves who you are
// Content-Type tells JSONBin you're sending JSON not plain text

const LOCAL_KEY = "arcforce_scores"
// the name used to store scores in the browser's localStorage
// like naming a folder on the device

const UNSYNCED_KEY = "arcforce_unsynced"
// separate folder for scores saved offline that haven't hit JSONBin yet


// ============================================================
// GROUP 2 — LOCALSTORAGE HELPERS
// read and write scores directly on the device
// no internet needed. these are the building blocks for offline support
// ============================================================

function getLocalScores() {
  const stored = localStorage.getItem(LOCAL_KEY)
  // getItem looks for data saved under that name
  // returns null if nothing saved yet

  return stored ? JSON.parse(stored) : []
  // ternary — shorthand if/else
  // if stored exists: parse text back into JS array
  // if nothing exists: return empty array so nothing breaks
}

function saveLocalScores(scores) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(scores))
  // localStorage can only hold text — stringify converts array to text first
}

function getUnsyncedScores() {
  const stored = localStorage.getItem(UNSYNCED_KEY)
  return stored ? JSON.parse(stored) : []
  // same pattern — separate bucket for offline-only scores
}

function saveUnsyncedScores(scores) {
  localStorage.setItem(UNSYNCED_KEY, JSON.stringify(scores))
}


// ============================================================
// GROUP 3 — SYNC
// runs on page load
// if scores were saved offline and we're now online, push them up
// clears the unsynced bucket once done
// ============================================================

async function syncToJSONBin() {
  const unsynced = getUnsyncedScores()
  // grab anything saved while offline

  if (!navigator.onLine || unsynced.length === 0) return
  // navigator.onLine = built-in browser check for connection
  // if offline OR nothing to sync — stop here, do nothing

  try {
    const response = await fetch(BIN_URL, {
      method: "GET",
      headers: HEADERS
    })
    const data = await response.json()
    const onlineScores = data.record.scores
    // read what's already on JSONBin first so we don't overwrite it

    const merged = [...onlineScores, ...unsynced]
    // spread operator — unpacks both arrays into one
    // like pouring two card decks into one pile

    await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ scores: merged })
    })
    // PUT sends the full merged array back up to JSONBin

    saveUnsyncedScores([])
    // clear the unsynced bucket — everything is now live
  } catch {
    // sync failed even though online — leave unsynced bucket as is
    // will try again next time the page loads
  }
}


// ============================================================
// GROUP 4 — READ SCORES
// runs on page load after sync
// online: fetches from JSONBin, caches a copy locally
// offline: reads from local cache instead
// displays top 5 prominently, next 20 below
// ============================================================

async function loadLeaderboard() {
  let scores = []

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, {
        method: "GET",
        headers: HEADERS
      })
      const data = await response.json()
      scores = data.record.scores
      saveLocalScores(scores)
      // cache fresh copy every successful fetch
      // so offline always has the latest version available
    } catch {
      scores = getLocalScores()
      // online but fetch failed — fall back to local cache
    }
  } else {
    scores = getLocalScores()
    // offline — go straight to local cache
  }

  const sorted = scores.sort((a, b) =>
    b.score - a.score || a.name.localeCompare(b.name)
  )
  // sort by score highest first
  // if two scores tie, sort those by name alphabetically
  // localeCompare handles accents and special characters by region

  const top5 = sorted.slice(0, 5)
  // positions 0,1,2,3,4

  const next20 = sorted.slice(5, 25)
  // positions 5 through 24 — picks up exactly where top5 left off

  const box = document.getElementById("leaderboard")
  // grabs <div id="leaderboard"> from index.html

  box.innerHTML =
    top5.map(s => `<p class="top">${s.name} — ${s.score}</p>`).join("") +
    next20.map(s => `<p>${s.name} — ${s.score}</p>`).join("")
  // map turns each score object into an HTML string
  // class="top" on top5 so you can style them differently in CSS
  // join("") stitches the array of strings into one block
  // + concatenates top5 block and next20 block together
}


// ============================================================
// GROUP 5 — WRITE A SCORE
// called automatically when a game ends
// always saves locally first — then tries JSONBin if online
// if offline or fetch fails, flags score for sync later
// ============================================================

async function submitScore(playerName, playerScore) {
  const newScore = { name: playerName, score: playerScore }
  // package name and score together as one object

  const localScores = getLocalScores()
  localScores.push(newScore)
  saveLocalScores(localScores)
  // save locally first no matter what
  // device always has a copy even if everything else fails

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, {
        method: "GET",
        headers: HEADERS
      })
      const data = await response.json()
      const scores = data.record.scores
      // read first so we don't overwrite existing scores

      scores.push(newScore)
      // add new score to the existing list

      await fetch(BIN_URL, {
        method: "PUT",
        headers: HEADERS,
        body: JSON.stringify({ scores: scores })
      })
      // PUT sends the full updated list back to JSONBin
      // JSON.stringify converts JS object to text for sending
      // opposite of what .json() did when reading

    } catch {
      const unsynced = getUnsyncedScores()
      unsynced.push(newScore)
      saveUnsyncedScores(unsynced)
      // online but fetch failed — flag for next sync
    }
  } else {
    const unsynced = getUnsyncedScores()
    unsynced.push(newScore)
    saveUnsyncedScores(unsynced)
    // offline — flag for sync when back online
  }

  loadLeaderboard()
  // refresh the display immediately so new score shows up
}


// ============================================================
// INIT — runs when page loads
// sync first, then display
// ============================================================

async function openLeaderboard() {
  const modal = document.getElementById("lb-modal")
  const box = document.getElementById("lb-scores")
  // grab the modal and the scores container inside it

  modal.classList.remove("hidden")
  // remove hidden class to show the modal

  let scores = []

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
      const data = await response.json()
      scores = data.record.scores
      saveLocalScores(scores)
    } catch {
      scores = getLocalScores()
    }
  } else {
    scores = getLocalScores()
  }
  // same online/offline logic as loadLeaderboard
  // reused here so modal always shows freshest possible data

  const sorted = scores.sort((a, b) =>
    b.score - a.score || a.name.localeCompare(b.name)
  )

  const top5 = sorted.slice(0, 5)
  const next20 = sorted.slice(5, 25)

  box.innerHTML =
    top5.map(s => `<p class="top">${s.name} — ${s.score}</p>`).join("") +
    next20.map(s => `<p>${s.name} — ${s.score}</p>`).join("")
}

function closeLeaderboard() {
  document.getElementById("lb-modal").classList.add("hidden")
  // add hidden back to close the modal
}

syncToJSONBin()
loadLeaderboard()
