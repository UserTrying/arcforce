// ============================================================
// GROUP 1 — CONFIG
// your connection info. everything else references these.
// change values here and the whole file updates automatically
// ============================================================

const BIN_ID = "69bad304c3097a1dd53881f6"
// your specific bin on JSONBin — like a mailbox number

const API_KEY = "PASTE_YOUR_NEW_KEY_HERE"
// your restricted key — regenerate on JSONBin since old one was exposed

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
// name used to store scores in the browser's localStorage
// like naming a folder on the device

const UNSYNCED_KEY = "arcforce_unsynced"
// separate folder for scores saved offline that haven't hit JSONBin yet


// ============================================================
// GROUP 2 — LOCALSTORAGE HELPERS
// read and write scores directly on the device
// no internet needed. building blocks for offline support
// ============================================================

function getLocalScores() {
  const stored = localStorage.getItem(LOCAL_KEY)
  // getItem looks for data saved under that name
  // returns null if nothing saved yet
  return stored ? JSON.parse(stored) : []
  // ternary — if stored exists parse it back into JS array
  // if nothing exists return empty array so nothing breaks
}

function saveLocalScores(scores) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(scores))
  // localStorage only holds text — stringify converts array first
}

function getUnsyncedScores() {
  const stored = localStorage.getItem(UNSYNCED_KEY)
  return stored ? JSON.parse(stored) : []
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

  if (!navigator.onLine || unsynced.length === 0) return
  // navigator.onLine = built-in browser connection check
  // if offline OR nothing to sync — stop, do nothing

  try {
    const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
    const data = await response.json()
    const onlineScores = data.record.scores
    // read what's already on JSONBin first so we don't overwrite it

    const merged = [...onlineScores, ...unsynced]
    // spread operator — unpacks both arrays into one pile

    await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ scores: merged })
    })

    saveUnsyncedScores([])
    // clear unsynced bucket — everything is now live
  } catch {
    // sync failed — leave unsynced bucket as is, try again next load
  }
}


// ============================================================
// GROUP 4 — READ SCORES
// runs on page load after sync
// online: fetches from JSONBin, caches locally
// offline: reads from local cache
// displays top 5 prominently, next 20 below
// ============================================================

async function loadLeaderboard() {
  let scores = []

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
      const data = await response.json()
      scores = data.record.scores
      saveLocalScores(scores)
      // cache fresh copy every successful fetch
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
  // ties broken alphabetically by name
  // localeCompare handles accents and special characters by region

  const top5 = sorted.slice(0, 5)
  const next20 = sorted.slice(5, 25)

  const box = document.getElementById("leaderboard")
  box.innerHTML =
    top5.map(s => `<p class="top">${s.name} — ${s.score}</p>`).join("") +
    next20.map(s => `<p>${s.name} — ${s.score}</p>`).join("")
}


// ============================================================
// GROUP 5 — WRITE A SCORE
// called automatically when a game ends
// always saves locally first
// then tries JSONBin if online
// flags for sync if offline or fetch fails
// ============================================================

async function submitScore(playerName, playerScore) {
  const newScore = { name: playerName, score: playerScore }

  const localScores = getLocalScores()
  localScores.push(newScore)
  saveLocalScores(localScores)
  // save locally first no matter what

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
      const data = await response.json()
      const scores = data.record.scores
      scores.push(newScore)

      await fetch(BIN_URL, {
        method: "PUT",
        headers: HEADERS,
        body: JSON.stringify({ scores: scores })
      })
    } catch {
      const unsynced = getUnsyncedScores()
      unsynced.push(newScore)
      saveUnsyncedScores(unsynced)
      // online but failed — flag for next sync
    }
  } else {
    const unsynced = getUnsyncedScores()
    unsynced.push(newScore)
    saveUnsyncedScores(unsynced)
    // offline — flag for sync when back online
  }

  loadLeaderboard()
}


// ============================================================
// GROUP 6 — LEADERBOARD MODAL
// opens and closes the ACF SCORES popup
// fetches fresh data every time it opens
// ============================================================

async function openLeaderboard() {
  const modal = document.getElementById("lb-modal")
  const box = document.getElementById("lb-scores")

  modal.classList.remove("hidden")
  // remove hidden to show modal

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
  // add hidden back to close modal
}


// ============================================================
// INIT — runs when page loads
// ============================================================

syncToJSONBin()
loadLeaderboard()
