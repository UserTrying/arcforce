// ============================================================
// GROUP 1 — CANVAS SETUP
// grabs the game screen and makes it fill the whole window
// ============================================================

const canvas = document.getElementById("gameCanvas")
// grabs the <canvas> tag from index.html
// this is the surface everything gets drawn on

const ctx = canvas.getContext("2d")
// getContext("2d") gives you all the drawing tools
// canvas = the paper, ctx = the pen

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  // makes canvas match the full browser window size
}

resizeCanvas()
// run it once immediately on page load

window.addEventListener("resize", resizeCanvas)
// if window gets resized, automatically adjusts canvas


// ============================================================
// GROUP 2 — GAME STATE
// one object tracking everything about the current game
// ============================================================

const state = {
  mode: null,       // which mode: 'solo' 'coop' or 'pvp'
  running: false,   // is the game loop currently going?
  paused: false,    // is the game paused?
  score: 0,         // current score
  wave: 1,          // which enemy wave we're on
  gameOver: false,  // has the game ended?
}


// ============================================================
// GROUP 2.5 — PLATFORMS
// list of platform objects the player stands on
// each one has a position and size
// collision is handled in GROUP 6 — PHYSICS
// ============================================================

const platforms = [
  { x: 0, y: canvas.height - 40, width: 180, height: 40 },
{ x: 400, y: canvas.height - 40, width: 120, height: 40 },
{ x: 900, y: canvas.height - 40, width: 150, height: 40 },
// small ground chunks with large gaps — fall in the gaps and you die
  { x: 200, y: canvas.height - 160, width: 180, height: 16 },
  { x: 500, y: canvas.height - 260, width: 200, height: 16 },
  { x: 820, y: canvas.height - 180, width: 160, height: 16 },
  { x: 1050, y: canvas.height - 300, width: 220, height: 16 },
  { x: 350, y: canvas.height - 380, width: 160, height: 16 },
  // floating platforms at various heights around the map
]


// ============================================================
// DRAW BACKGROUND
// draws the sky, city silhouette, glows, and stars
// called every single frame so it redraws fresh each time
// ============================================================

function drawBackground() {
  ctx.fillStyle = "#060612"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // base sky — fills entire canvas with very dark blue-black

  const glowGreen = ctx.createLinearGradient(0, canvas.height - 200, 0, canvas.height)
  glowGreen.addColorStop(0, "rgba(80, 255, 140, 0)")
  glowGreen.addColorStop(1, "rgba(80, 255, 140, 0.08)")
  ctx.fillStyle = glowGreen
  ctx.fillRect(0, canvas.height - 200, canvas.width, 200)
  // green arcane glow rising from the ground
  // createLinearGradient makes a color that fades top to bottom
  // addColorStop(0) = top of gradient, addColorStop(1) = bottom
  // last number in rgba is opacity — 0 invisible, 1 fully solid

  const glowPurple = ctx.createLinearGradient(0, canvas.height - 300, 0, canvas.height)
  glowPurple.addColorStop(0, "rgba(160, 80, 255, 0)")
  glowPurple.addColorStop(1, "rgba(160, 80, 255, 0.06)")
  ctx.fillStyle = glowPurple
  ctx.fillRect(0, canvas.height - 300, canvas.width / 2, 300)
  // purple glow on left half only for asymmetry

  ctx.fillStyle = "#0d0d1a"
  const buildings = [
    { x: 0, w: 60, h: 120 },
    { x: 55, w: 40, h: 80 },
    { x: 90, w: 80, h: 160 },
    { x: 165, w: 50, h: 100 },
    { x: 210, w: 90, h: 200 },
    { x: 295, w: 40, h: 130 },
    { x: 330, w: 70, h: 90 },
    { x: 395, w: 110, h: 170 },
    { x: 500, w: 50, h: 140 },
    { x: 545, w: 80, h: 110 },
    { x: 620, w: 60, h: 190 },
    { x: 675, w: 90, h: 80 },
    { x: 760, w: 70, h: 150 },
    { x: 825, w: 50, h: 120 },
    { x: 870, w: 100, h: 180 },
    { x: 965, w: 60, h: 100 },
    { x: 1020, w: 80, h: 160 },
    { x: 1095, w: 50, h: 90 },
    { x: 1140, w: 70, h: 130 },
  ]
  buildings.forEach(b => {
    ctx.fillRect(b.x, canvas.height - 40 - b.h, b.w, b.h)
    // draws each building rectangle from the ground up
  })
  // city silhouette — jagged dark buildings in the distance

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
  const stars = [
    [80, 40], [200, 20], [350, 60], [500, 30], [650, 50],
    [780, 15], [900, 45], [1050, 25], [1150, 55], [1250, 35],
    [140, 80], [420, 90], [720, 70], [980, 85], [1180, 75],
  ]
  stars.forEach(([x, y]) => {
    ctx.fillRect(x, y, 2, 2)
    // each star is a tiny 2x2 white square
  })
}


// ============================================================
// DRAW PLATFORMS
// draws each platform as a dark stone rectangle
// with a green arcane glow line across the top
// ============================================================

function drawPlatforms() {
  platforms.forEach(p => {
    ctx.fillStyle = "#2a2a3a"
    ctx.fillRect(p.x, p.y, p.width, p.height)
    // dark grey stone base

    ctx.fillStyle = "rgba(125, 249, 170, 0.6)"
    ctx.fillRect(p.x, p.y, p.width, 3)
    // thin bright green line across the very top
    // gives it the arcane energy feel
  })
}


// ============================================================
// GROUP 3 — PLAYERS
// each player is an object holding everything about them
// position, size, speed, health, controls, bullets etc
// rectangle = hitbox — art gets layered on top later
// ============================================================

const p1 = {
  x: 100,               // starting position from left edge
  y: 300,               // starting position from top edge
  width: 32,            // hitbox width
  height: 36,           // hitbox height
  velX: 0,              // horizontal speed (- = left, + = right)
  velY: 0,              // vertical speed (- = up, + = down)
  speed: 5,             // how fast player moves left/right
  jumpForce: -14,       // negative because up is negative on canvas
  onGround: false,      // is player standing on something?
  health: 100,
  maxHealth: 100,
  alive: true,
  color: "#7df9aa",     // green — player 1's color
  bullets: [],          // list of active bullets this player fired
  shootCooldown: 0,     // frames until player can shoot again
  facing: 1,            // 1 = facing right, -1 = facing left
  controls: {
    left: "a",
    right: "d",
    up: "w",
    shoot: " "          // space bar
  }
}

const p2 = {
  x: canvas.width - 150, // starts near the right side
  y: 300,
  width: 32,
  height: 36,
  velX: 0,
  velY: 0,
  speed: 5,
  jumpForce: -14,
  onGround: false,
  health: 100,
  maxHealth: 100,
  alive: true,
  color: "#f97df9",     // pink/purple — player 2's color
  bullets: [],
  shootCooldown: 0,
  facing: -1,           // starts facing left toward p1
  controls: {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    shoot: "Enter"
  }
}


// ============================================================
// GROUP 4 — INPUT
// listens for keyboard presses
// keys{} is a live snapshot of what's being held right now
// ============================================================

const keys = {}
// empty object filled as keys are pressed
// keys["a"] = true means A is currently held down

window.addEventListener("keydown", e => {
  keys[e.key] = true
  // when a key is pressed, mark it as held
})

window.addEventListener("keyup", e => {
  keys[e.key] = false
  // when a key is released, mark it as not held
})

function getInput(player) {
  // runs every frame for each active player
  // reads keys{} and updates player's velocity

  if (keys[player.controls.left]) player.velX = -player.speed
  else if (keys[player.controls.right]) player.velX = player.speed
  else player.velX = 0
  // move left, right, or stop

  if (keys[player.controls.up] && player.onGround) {
    player.velY = player.jumpForce
    player.onGround = false
    // only jump if standing on something
  }

  if (keys[player.controls.shoot]) {
    shoot(player)
    // shoot() handles cooldown and bullet creation
  }

  if (player.velX > 0) player.facing = 1
  if (player.velX < 0) player.facing = -1
  // track direction for bullet spawn position
}


// ============================================================
// START GAME + SHOOT PLACEHOLDER
// startGame is called by menu buttons in index.html
// shoot is filled in GROUP 8 — BULLETS
// ============================================================

function shoot(player) {
  if (player.shootCooldown > 0) return
  // if timer isn't at 0 yet, can't shoot again

  player.bullets.push({
    x: player.facing === 1 ? player.x + player.width : player.x,
    // bullet starts at front of player based on which way they face
    y: player.y + player.height / 2,
    // vertically centered on player
    velX: player.facing * 12,
    // moves in direction player faces at speed 12
    owner: player
    // tracks who fired it — needed for damage logic later
  })

  player.shootCooldown = 10
  // 10 frames before they can shoot again
  // at 60fps = about 6 shots per second when holding
}

function startGame(mode) {
  state.mode = mode
  state.running = true
  state.gameOver = false
  state.score = 0
  state.wave = 1
  // set everything to fresh start values

  document.getElementById("menu").style.display = "none"
  // hide the menu

  canvas.style.display = "block"
  // show the game canvas

  gameLoop()
  // start the game loop
}


// ============================================================
// GROUP 5 — GAME LOOP
// the heartbeat of the game — runs ~60 times per second
// each run: clear screen → update everything → draw everything
// ============================================================

function gameLoop() {
  if (!state.running) return
  // if game isn't running, stop the loop immediately

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // wipe entire canvas clean each frame
  // without this everything drawn would stack up and blur

  drawBackground()
  drawPlatforms()
  // draw world first so players appear on top

  getInput(p1)
  applyPhysics(p1)
  if (state.mode !== "solo") {
    getInput(p2)
    applyPhysics(p2)
  }
  // read input and apply physics for each active player

  updateBullets(p1)
  drawBullets(p1)
  if (state.mode !== "solo") {
    updateBullets(p2)
    drawBullets(p2)
  }
  // move and draw bullets for each active player

  ctx.fillStyle = p1.color
  ctx.fillRect(p1.x, p1.y, p1.width, p1.height)
  // draw player 1 rectangle (hitbox) in their color

  if (state.mode !== "solo") {
    ctx.fillStyle = p2.color
    ctx.fillRect(p2.x, p2.y, p2.width, p2.height)
    // draw player 2 if not solo mode
  }

  checkGameOver()
  // check if anyone died after everything updates

  requestAnimationFrame(gameLoop)
  // tells browser to run gameLoop again next frame
  // this is what makes it loop ~60 times per second
}


// ============================================================
// GROUP 6 — PHYSICS
// runs every frame for each active player
// gravity pulls down, movement updates position
// collision stops players falling through platforms
// ============================================================

const GRAVITY = 0.4
// added to velY every frame — stacks up fast like real gravity

function applyPhysics(player) {
  player.velY += GRAVITY
  // pull player down a little more each frame

  player.x += player.velX
  player.y += player.velY
  // move player by their current velocity

  player.onGround = false
  // assume not on ground every frame
  // collision check below sets it back to true if needed

  platforms.forEach(p => {
    const inXRange = player.x + player.width > p.x && player.x < p.x + p.width
    // true if player horizontally overlaps the platform

    const prevBottom = player.y + player.height - player.velY
    // where player's feet WERE last frame

    const currBottom = player.y + player.height
    // where player's feet ARE now

    const landingOnTop = prevBottom <= p.y && currBottom >= p.y
    // true if player just crossed through the top surface

    if (inXRange && landingOnTop) {
      player.y = p.y - player.height
      // snap player to sit exactly on top of platform

      player.velY = 0
      // stop falling

      player.onGround = true
      // allow jumping again
    }
  })

  if (player.x < 0) player.x = 0
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width
  // stop player from leaving the left or right edge of screen
}


// ============================================================
// GROUP 8 — BULLETS
// moves bullets every frame, removes them if off screen
// glow effect matches the player's color
// ============================================================

function updateBullets(player) {
  player.shootCooldown = Math.max(0, player.shootCooldown - 1)
  // count cooldown down every frame, never goes below 0

  player.bullets = player.bullets.filter(b => {
    b.x += b.velX
    // move bullet forward

    return b.x > 0 && b.x < canvas.width
    // keep bullet only if still on screen
    // filter removes it automatically when this is false
  })
}

function drawBullets(player) {
  player.bullets.forEach(b => {
    ctx.fillStyle = player.color
    ctx.shadowBlur = 10
    ctx.shadowColor = player.color
    // glow effect matching player color

    ctx.fillRect(b.x, b.y, 10, 4)
    // small rectangle — 10 wide, 4 tall

    ctx.shadowBlur = 0
    // reset glow so it doesn't bleed onto other drawings
  })
}


// ============================================================
// GROUP 9 — GAME OVER
// checks if players fell off screen
// triggers game over screen based on the current mode
// ============================================================

function checkGameOver() {
  if (p1.y > canvas.height) p1.alive = false
  if (p2.y > canvas.height) p2.alive = false
  // if player falls past bottom of screen, mark them dead

  let over = false

  if (state.mode === "solo" && !p1.alive) over = true
  // solo — p1 dies = game over

  if (state.mode === "coop" && !p1.alive && !p2.alive) over = true
  // coop — BOTH must die for game over

  if (state.mode === "pvp" && (!p1.alive || !p2.alive)) over = true
  // pvp — either player dies = game over

  if (over) triggerGameOver()
}

function triggerGameOver() {
  state.running = false
  // stops the game loop

  const screen = document.getElementById("gameover-screen")
  const scoreText = document.getElementById("final-score")

  scoreText.textContent = `SCORE: ${state.score}`
  screen.classList.remove("hidden")
  // show game over screen with final score
}

function handleSubmitScore() {
  const nameInput = document.getElementById("player-name")
  const name = nameInput.value.trim()
  // grab the typed name, remove extra spaces, make it uppercase

  if (!name) {
    nameInput.placeholder = "NAME REQUIRED"
    return
    // if empty, flash the placeholder and stop
  }

  submitScore(name, state.score)
  // calls leaderboard.js with the name and final score

  returnToMenu()
}

function returnToMenu() {
  document.getElementById("gameover-screen").classList.add("hidden")
  document.getElementById("menu").style.display = "flex"
  canvas.style.display = "none"
  // hide game over screen, show menu, hide canvas

  p1.alive = true
  p1.x = 100
  p1.y = 300
  p1.velX = 0
  p1.velY = 0
  p1.health = 100
  p1.bullets = []

  p2.alive = true
  p2.x = canvas.width - 150
  p2.y = 300
  p2.velX = 0
  p2.velY = 0
  p2.health = 100
  p2.bullets = []
  // reset both players fully so next game starts clean
}
