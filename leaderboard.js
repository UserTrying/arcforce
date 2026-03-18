const BIN_ID = "69bad304c3097a1dd53881f6"
// the ID of your specific bin on JSONBin
// like a mailbox number

const API_KEY = "$2a$10$lpphn0eXP16S7HwQtcr14.Qp4EvaQd2M2Y1YezJ8z84iGuq2oK3Qa"
// your restricted key — proves you're allowed in
// like the key to that mailbox

const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`
// the full web address of your bin
// notice it uses BIN_ID inside it — that's why we named it

const HEADERS = {
  "X-Access-Key": API_KEY,
  "Content-Type": "application/json"
}
const LOCAL_KEY = "arcforce"
// a package of info sent with every request
// tells JSONBin who you are and what format you're sending
async function loadLeaderboard() {
  // async means this function will deal with waiting

  const response = await fetch(BIN_URL, {
    method: "GET",
    headers: HEADERS
  })
  // fetch() sends the request to JSONBin
  // await tells code to wait here until it hears back
  // method GET means we're reading, not changing anything
  // headers is our config Group 1 package — proves who we are

  const data = await response.json()
  // response comes back as raw text
  // .json() converts it into a JS object we can actually use
  // await again because that conversion also takes a moment

  const scores = data.record.scores
  // JSONBin wraps everything in "record"
  // .scores drills into our actual scores array inside it

  const box = document.getElementById("leaderboard")
  // grabs the leaderboard div from index.html by its id
  // remember you wrote <div id="leaderboard"> earlier?

  box.innerHTML = scores
    const top5 = scores
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  .slice(0, 5)

const next20 = scores.slice(5, 25)
    .map(s => `<p>${s.name} — ${s.score}</p>`)
    .join("")
  // sort: highest score first
  // const top5 slice(0,5): only top 5 first
  // const next20 slice(5,25) 
  // map: turns each score object into a line of HTML
  // join: stitches all those lines together into one string
}

loadLeaderboard()
// this last line actually CALLS the function when the page loads
// without this line the function exists but never runsasync function submitScore(playerName, playerScore) {
  // takes name and score as inputs when called

  const response = await fetch(BIN_URL, {
    method: "GET",
    headers: HEADERS
  })
  const data = await response.json()
  const scores = data.record.scores
  // read the current scores first so we don't overwrite them

  scores.push({ name: playerName, score: playerScore })
  // push() adds your new score object to the end of the array
  // like adding a new card to a deck

  await fetch(BIN_URL, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({ scores: scores })
  })
  // PUT sends the whole updated array back to JSONBin
  // JSON.stringify converts your JS object back to text for sending
  // opposite of what .json() did when reading

  loadLeaderboard()
  // refresh the display so new score shows up immediately
}
