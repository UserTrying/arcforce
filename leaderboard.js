// ============================================================
// GROUP 1 — CONFIG
// all the settings and addresses used by everything below
// think of this like a contact card for JSONBin
// ============================================================

const BIN_ID = "69bad304c3097a1dd53881f6"
// your bin's unique ID on JSONBin — like a mailbox number

const API_KEY = "$2a$10$UfULXxWgjXmfHAXfs7EqEu2psvZz7yGwJtrKP29ff/cNt2E/huo92"
// your restricted key — proves you're allowed to access the bin

const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`
// full web address of your bin
// the ${BIN_ID} part automatically fills in your bin ID

const HEADERS = {
  "X-Access-Key": API_KEY,
  "Content-Type": "application/json"
}
// package sent with every request
// tells JSONBin who you are and that you're sending JSON

const LOCAL_KEY = "arcforce_scores"
// the name used to save scores on this device

const UNSYNCED_KEY = "arcforce_unsynced"
// the name used to save scores that haven't reached JSONBin yet


// ============================================================
// GROUP 2 — LOCALSTORAGE HELPERS
// localStorage is like a tiny notepad saved in your browser
// keeps data even when you close the tab
// these four functions make reading and writing easy
// ============================================================

function getLocalScores() {
  const stored = localStorage.getItem(LOCAL_KEY)
  return stored ? JSON.parse(stored) : []
  // tries to find saved scores on device
  // JSON.parse converts stored text back into a JS array
  // if nothing found, returns empty array instead of crashing
}

function saveLocalScores(scores) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(scores))
  // JSON.stringify converts the array into text for saving
  // opposite of JSON.parse
}

function getUnsyncedScores() {
  const stored = localStorage.getItem(UNSYNCED_KEY)
  return stored ? JSON.parse(stored) : []
  // same as getLocalScores but for offline scores waiting to sync
}

function saveUnsyncedScores(scores) {
  localStorage.setItem(UNSYNCED_KEY, JSON.stringify(scores))
  // same as saveLocalScores but for unsynced scores
}


// ============================================================
// GROUP 3 — SYNC
// runs on page load
// if you scored offline, this sends those scores to JSONBin
// when you're back online
// ============================================================

async function syncToJSONBin() {
  const unsynced = getUnsyncedScores()
  // grab any scores saved while offline

  if (!navigator.onLine || unsynced.length === 0) return
  // navigator.onLine checks if device has internet
  // if offline OR nothing to sync, stop here and do nothing

  try {
    const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
    const data = await response.json()
    const onlineScores = data.record.scores
    // fetch the current scores from JSONBin

    const merged = [...onlineScores, ...unsynced]
    // ... spreads both arrays into one combined list
    // like pouring two cups of water into one bigger cup

    await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ scores: merged })
    })
    // PUT sends the merged list back to JSONBin

    saveUnsyncedScores([])
    // clear the unsynced list since they uploaded successfully

  } catch {
    // if anything fails, do nothing
    // it'll try again next time the page loads
  }
}


// ============================================================
// GROUP 4 — READ SCORES
// grabs scores and displays them on the main menu
// uses JSONBin if online, device storage if offline
// ============================================================

async function loadLeaderboard() {
  let scores = []
  // start with an empty list

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
      const data = await response.json()
      scores = data.record.scores
      saveLocalScores(scores)
      // got online scores, save them on device for offline use later
    } catch {
      scores = getLocalScores()
      // online fetch failed, use what's saved on device
    }
  } else {
    scores = getLocalScores()
    // no internet, use device storage
  }

  const sorted = scores.sort((a, b) =>
    b.score - a.score || a.name.localeCompare(b.name)
  )
  // sort by highest score first
  // if two scores are equal, sort alphabetically by name
  // localeCompare handles accents and special characters properly

  const top5 = sorted.slice(0, 5)
  // grab positions 0 through 4 — the top 5

  const next20 = sorted.slice(5, 25)
  // grab positions 5 through 24 — the next 20

  const box = document.getElementById("leaderboard")
  // grab the leaderboard div from index.html

  box.innerHTML =
    top5.map(s => `<p class="top">${s.name} — ${s.score}</p>`).join("") +
    next20.map(s => `<p>${s.name} — ${s.score}</p>`).join("")
  // map turns each score object into a line of HTML
  // top 5 get the green 'top' class, next 20 get grey
  // join("") stitches all lines into one block the browser can render
}


// ============================================================
// GROUP 5 — WRITE A SCORE
// called when a game ends and player submits their name
// always saves locally first, then tries JSONBin
// queues for later if offline
// ============================================================

async function submitScore(playerName, playerScore) {
  const newScore = { name: playerName, score: playerScore, time: Date.now() }
  // package name, score, and current timestamp into one object
  // Date.now() gives current time in milliseconds
  // timestamp is used later so the clear function knows what's recent

  const localScores = getLocalScores()
  localScores.push(newScore)
  saveLocalScores(localScores)
  // always save to device first no matter what
  // push() adds the new score to the end of the array

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
      const data = await response.json()
      const scores = data.record.scores
      // get current online scores

      scores.push(newScore)
      // add new score to the list

      await fetch(BIN_URL, {
        method: "PUT",
        headers: HEADERS,
        body: JSON.stringify({ scores: scores })
      })
      // send updated list back to JSONBin

    } catch {
      const unsynced = getUnsyncedScores()
      unsynced.push(newScore)
      saveUnsyncedScores(unsynced)
      // online but request failed, queue it for next load
    }
  } else {
    const unsynced = getUnsyncedScores()
    unsynced.push(newScore)
    saveUnsyncedScores(unsynced)
    // offline, queue it to sync when back online
  }

  loadLeaderboard()
  // refresh the display so new score shows up immediately
}


// ============================================================
// GROUP 6 — LEADERBOARD MODAL
// handles opening and closing the score popup
// same fetch logic as loadLeaderboard but fills the popup box
// ============================================================

async function openLeaderboard() {
  const modal = document.getElementById("lb-modal")
  const box = document.getElementById("lb-scores")
  modal.classList.remove("hidden")
  // remove 'hidden' class so the popup appears on screen

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

  const sorted = scores.sort((a, b) =>
    b.score - a.score || a.name.localeCompare(b.name)
  )
  const top5 = sorted.slice(0, 5)
  const next20 = sorted.slice(5, 25)

  box.innerHTML =
    top5.map(s => `<p class="top">${s.name} — ${s.score}</p>`).join("") +
    next20.map(s => `<p>${s.name} — ${s.score}</p>`).join("")
  // fills popup with scores same way as the main menu
}

function closeLeaderboard() {
  document.getElementById("lb-modal").classList.add("hidden")
  // adds 'hidden' class back so popup disappears
}


// ============================================================
// GROUP 7 — CLEAR SCORES
// triggered secretly by typing 'clear' anywhere on the site
// keeps scores submitted within the last 1 minute
// wipes everything older than that
// ============================================================

async function clearScores() {
  const oneMinute = 60 * 1000
  // 60 seconds x 1000 milliseconds = one minute in ms

  const cutoff = Date.now() - oneMinute
  // any score with a timestamp older than this gets deleted

  if (navigator.onLine) {
    const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
    const data = await response.json()
    const kept = data.record.scores.filter(s => s.time && s.time > cutoff)
    // filter keeps only scores newer than 1 minute ago
    // scores without a timestamp (old ones) get wiped too

    await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ scores: kept })
    })
    // send the cleaned list back to JSONBin
  }

  const local = getLocalScores().filter(s => s.time && s.time > cutoff)
  saveLocalScores(local)
  // same filter on device storage

  loadLeaderboard()
  openLeaderboard()
  // refresh the display immediately
}


// ============================================================
// INIT — runs automatically when the page loads
// ============================================================

syncToJSONBin()
// check for unsynced offline scores and upload them

loadLeaderboard()
// load and display scores on the main menu
