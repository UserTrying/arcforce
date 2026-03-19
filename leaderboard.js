// ============================================================
// GROUP 1 — CONFIG
// your settings, keys and addresses used by everything below
// ============================================================

const BIN_ID = "69bad304c3097a1dd53881f6"
// your bin's unique address on JSONBin

const API_KEY = "$2a$10$UfULXxWgjXmfHAXfs7EqEu2psvZz7yGwJtrKP29ff/cNt2E/huo92"
// your restricted key, proves you're allowed to access the bin

const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`
// full web address of your bin, built using BIN_ID above

const HEADERS = {
  "X-Access-Key": API_KEY,
  "Content-Type": "application/json"
}
// package sent with every request
// tells JSONBin who you are and that you're sending JSON data

const LOCAL_KEY = "arcforce_scores"
// the name used to save scores on this device (localStorage)

const UNSYNCED_KEY = "arcforce_unsynced"
// the name used to save scores that haven't reached JSONBin yet


// ============================================================
// GROUP 2 — LOCALSTORAGE HELPERS
// localStorage is like a tiny notepad saved in your browser
// it keeps data even when you close the tab
// these four functions make reading and writing to it easy
// ============================================================

function getLocalScores() {
  const stored = localStorage.getItem(LOCAL_KEY)
  // tries to find saved scores on this device
  return stored ? JSON.parse(stored) : []
  // if found, converts text back to JS array
  // if not found, returns empty array instead of crashing
}

function saveLocalScores(scores) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(scores))
  // converts scores array to text and saves it on this device
  // JSON.stringify is the opposite of JSON.parse
}

function getUnsyncedScores() {
  const stored = localStorage.getItem(UNSYNCED_KEY)
  return stored ? JSON.parse(stored) : []
  // same as getLocalScores but for scores waiting to sync
}

function saveUnsyncedScores(scores) {
  localStorage.setItem(UNSYNCED_KEY, JSON.stringify(scores))
  // same as saveLocalScores but for unsynced scores
}


// ============================================================
// GROUP 3 — SYNC
// runs on page load, checks if there are scores saved offline
// that never made it to JSONBin, and sends them now if online
// ============================================================

async function syncToJSONBin() {
  const unsynced = getUnsyncedScores()
  // grab any scores that were saved while offline

  if (!navigator.onLine || unsynced.length === 0) return
  // navigator.onLine checks if device has internet
  // if offline OR nothing to sync, stop here

  try {
    const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
    const data = await response.json()
    const onlineScores = data.record.scores
    // fetch the current scores from JSONBin

    const merged = [...onlineScores, ...unsynced]
    // ... spreads both arrays into one combined list

    await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({ scores: merged })
    })
    // PUT sends the merged list back to JSONBin, replacing old data

    saveUnsyncedScores([])
    // clear the unsynced list since they're uploaded now

  } catch {
    // if anything fails (bad connection etc), do nothing
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
  // start with empty list

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
      const data = await response.json()
      scores = data.record.scores
      // got online scores successfully
      saveLocalScores(scores)
      // save them on device so they work offline later
    } catch {
      scores = getLocalScores()
      // online fetch failed, fall back to device storage
    }
  } else {
    scores = getLocalScores()
    // offline, use device storage
  }

  const sorted = scores.sort((a, b) =>
    b.score - a.score || a.name.localeCompare(b.name)
  )
  // sort by highest score first
  // if scores are equal, sort by name alphabetically

  const top5 = sorted.slice(0, 5)
  // first 5 entries (positions 0-4)

  const next20 = sorted.slice(5, 25)
  // next 20 entries (positions 5-24)

  const box = document.getElementById("leaderboard")
  // grabs the leaderboard div from index.html

  box.innerHTML =
    top5.map(s => `<p class="top">${s.name} — ${s.score}</p>`).join("") +
    next20.map(s => `<p>${s.name} — ${s.score}</p>`).join("")
  // map turns each score object into a line of HTML
  // top5 gets the green 'top' class, next20 gets grey
  // join("") stitches all lines into one block of HTML
}


// ============================================================
// GROUP 5 — WRITE A SCORE
// called when a game ends
// saves score locally always, sends to JSONBin if online
// queues it for later if offline
// ============================================================

async function submitScore(playerName, playerScore) {
  const newScore = { name: playerName, score: playerScore }
  // package the name and score into one object

  const localScores = getLocalScores()
  localScores.push(newScore)
  saveLocalScores(localScores)
  // always save to device first, no matter what
  // push() adds the new score to the end of the array

  if (navigator.onLine) {
    try {
      const response = await fetch(BIN_URL, { method: "GET", headers: HEADERS })
      const data = await response.json()
      const scores = data.record.scores
      // fetch current online scores

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
      // online but request failed, queue it for later
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
  // removes the 'hidden' class so the popup appears

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
  // fills the popup with styled scores same way as the menu
}

function closeLeaderboard() {
  document.getElementById("lb-modal").classList.add("hidden")
  // adds 'hidden' class back so the popup disappears
}


// ============================================================
// INIT — runs automatically when the page loads
// ============================================================

syncToJSONBin()
// check for unsynced offline scores and upload them

loadLeaderboard()
// load and display scores on the main menu
