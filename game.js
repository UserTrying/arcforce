// GROUP 1 — CANVAS SETUP
// grabs the game screen and makes it fill the full window
// ============================================================

const canvas = document.getElementById("gameCanvas")
// grabs the <canvas> element from index.html
// this is the surface everything gets drawn on

const ctx = canvas.getContext("2d")
// getContext("2d") gives you all the drawing tools
// think of canvas as the paper, ctx as the pen

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  // sets canvas to match the full browser window size
  // window.innerWidth/Height are built into every browser
}

resizeCanvas()
// run it once immediately when the page loads

window.addEventListener("resize", resizeCanvas)
// if the window gets resized, automatically adjusts the canvas


// ============================================================
// GROUP 2 — GAME STATE
// one object that tracks everything about the current game
// mode, score, wave, whether it's running or over
// ============================================================

const state = {
  mode: null,       // which mode is active: 'solo' 'coop' or 'pvp'
  running: false,   // is the game loop currently running?
  paused: false,    // is the game paused?
  score: 0,         // current score
  wave: 1,          // which enemy wave we're on
  gameOver: false,  // has the game ended?
}

// ============================================================
// GROUP 2.5 — PLATFORMS
// array of platform objects, each has x, y, width, height
// drawn every frame, collision checked in physics later
// ============================================================

const platforms = [
  { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
  // ground — full width, sits at the very bottom

  { x: 200, y: canvas.height - 160, width: 180, height: 16 },
  { x: 500, y: canvas.height - 260, width: 200, height: 16 },
  { x: 820, y: canvas.height - 180, width: 160, height: 16 },
  { x: 1050, y: canvas.height - 300, width: 220, height: 16 },
  { x: 350, y: canvas.height - 380, width: 160, height: 16 },
  // floating platforms at various heights
]
function drawBackground() {
  // base sky — very dark blue-black
  ctx.fillStyle = "#060612"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // fills entire canvas with the base sky color

  // arcane horizon glow — green
  const glowGreen = ctx.createLinearGradient(0, canvas.height - 200, 0, canvas.height)
  glowGreen.addColorStop(0, "rgba(80, 255, 140, 0)")
  glowGreen.addColorStop(1, "rgba(80, 255, 140, 0.08)")
  ctx.fillStyle = glowGreen
  ctx.fillRect(0, canvas.height - 200, canvas.width, 200)
  // createLinearGradient makes a fade from top to bottom
  // addColorStop(0) is the top, addColorStop(1) is the bottom
  // rgba last value is opacity — 0 is invisible, 1 is solid

  // arcane horizon glow — purple on the other side
  const glowPurple = ctx.createLinearGradient(0, canvas.height - 300, 0, canvas.height)
  glowPurple.addColorStop(0, "rgba(160, 80, 255, 0)")
  glowPurple.addColorStop(1, "rgba(160, 80, 255, 0.06)")
  ctx.fillStyle = glowPurple
  ctx.fillRect(0, canvas.height - 300, canvas.width / 2, 300)
  // only covers left half for asymmetry

  // city silhouette — jagged dark buildings in the distance
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
    // draws each building from the ground up
    // canvas.height - 40 is just above the ground platform
  })

  // stars — small white dots scattered in the sky
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
  const stars = [
    [80, 40], [200, 20], [350, 60], [500, 30], [650, 50],
    [780, 15], [900, 45], [1050, 25], [1150, 55], [1250, 35],
    [140, 80], [420, 90], [720, 70], [980, 85], [1180, 75],
  ]
  stars.forEach(([x, y]) => {
    ctx.fillRect(x, y, 2, 2)
  })
}

function drawPlatforms() {
  platforms.forEach(p => {
    // stone base — dark grey
    ctx.fillStyle = "#2a2a3a"
    ctx.fillRect(p.x, p.y, p.width, p.height)
    // draws the main platform rectangle

    // arcane glow line on top edge
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
// p1 = player 1, p2 = player 2
// ============================================================

const p1 = {
  x: 100,           // starting position from left
  y: 300,           // starting position from top
  width: 32,        // how wide the player rectangle is
  height: 36,       // how tall the player rectangle is
  velX: 0,          // horizontal speed (negative = left, positive = right)
  velY: 0,          // vertical speed (negative = up, positive = down)
  speed: 5,         // how fast player moves left/right
  jumpForce: -14,   // negative because up is negative on canvas
  onGround: false,  // is the player standing on something?
  health: 100,
  maxHealth: 100,
  alive: true,
  color: "#7df9aa", // green — player 1's color
  bullets: [],      // list of active bullets this player fired
  shootCooldown: 0,
  facing: 1,        // 1 = facing right, -1 = facing left
  controls: {
    left: "a",
    right: "d",
    up: "w",
    shoot: " "       // space bar
  }
}

const p2 = {
  x: canvas.width - 150, // starts near the right side
  y: 300,
  width: 32,
  height: 48,
  velX: 0,
  velY: 0,
  speed: 5,
  jumpForce: -14,
  onGround: false,
  health: 100,
  maxHealth: 100,
  alive: true,
  color: "#f97df9",  // pink/purple — player 2's color
  bullets: [],
  facing: -1,        // starts facing left toward p1
  controls: {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    shoot: "Enter"
  }
}


// ============================================================
// GROUP 4 — INPUT
// listens for keyboard presses and moves players accordingly
// keys{} acts as a live snapshot of what's being held down
// ============================================================

const keys = {}
// empty object that gets filled as keys are pressed
// keys["a"] = true means A is currently being held

window.addEventListener("keydown", e => {
  keys[e.key] = true
  // when a key is pressed, mark it as true
})

window.addEventListener("keyup", e => {
  keys[e.key] = false
  // when a key is released, mark it as false
})

function getInput(player) {
  // runs every frame for each active player
  // checks keys{} and updates the player's velocity

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
    // shoot() will be built in the bullets group
  }

  if (player.velX > 0) player.facing = 1
  if (player.velX < 0) player.facing = -1
  // track which way player is facing for bullet direction
}


// ============================================================
// START GAME
// called by the menu buttons in index.html
// hides the menu, shows the canvas, kicks off the game loop
// ============================================================
function shoot(player) {
  if (player.shootCooldown > 0) return
  // if timer isn't at 0 yet, can't shoot again

  player.bullets.push({
    x: player.facing === 1 ? player.x + player.width : player.x,
    // bullet starts at front of player based on direction they face
    y: player.y + player.height / 2,
    // vertically centered on player
    velX: player.facing * 12,
    // moves in the direction player is facing, speed 12
    owner: player
    // tracks who fired it, needed for pvp damage later
  })

  player.shootCooldown = 8
  // 8 frames before they can shoot again
}
  // placeholder — bullets group will fill this in later
function startGame(mode) {
  state.mode = mode
  // save which mode was picked

  state.running = true
  state.gameOver = false
  state.score = 0
  state.wave = 1
  // reset everything to fresh start

  document.getElementById("menu").style.display = "none"
  // hide the menu

  canvas.style.display = "block"
  // show the game canvas

  gameLoop()
  // start the game
}


// ============================================================
// GROUP 5 — GAME LOOP (skeleton for now)
// the heartbeat of the game, runs ~60 times per second
// each run: clear screen, update everything, draw everything
// ============================================================

function gameLoop() {
  if (!state.running) return
  // if game isn't running, stop the loop

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // wipe the entire canvas clean each frame
  // without this, everything drawn would stack up

  drawBackground()
  drawPlatforms()

  getInput(p1)
  applyPhysics(p1)
  updateBullets(p1)
  drawBullets(p1)
if (state.mode !== "solo") {
  updateBullets(p2)
  drawBullets(p2)
}
  if (state.mode !== "solo") {
      getInput(p2)
      applyPhysics(p2)
  }
  // process keyboard input for active players

  ctx.fillStyle = p1.color
  ctx.fillRect(p1.x, p1.y, p1.width, p1.height)
  // draw player 1 as a colored rectangle for now

  if (state.mode !== "solo") {
    ctx.fillStyle = p2.color
    ctx.fillRect(p2.x, p2.y, p2.width, p2.height)
    // draw player 2 if not in solo mode
  }

  requestAnimationFrame(gameLoop)
  // tells the browser to run gameLoop again next frame
  // this is what makes it loop ~60 times per second
}

// ============================================================
// GROUP 6 — PHYSICS
// runs every frame for each active player
// applies gravity, moves the player, checks platform collision
// ============================================================

const GRAVITY = 0.4
// added to velY every frame — small but stacks up fast

function applyPhysics(player) {
  player.velY += GRAVITY
  // pull player down every frame
  // velY grows each frame until something stops it

  player.x += player.velX
  player.y += player.velY
  // actually move the player by their current velocity

  player.onGround = false
  // assume not on ground every frame
  // collision below will set it back to true if needed

  platforms.forEach(p => {
    const inXRange = player.x + player.width > p.x && player.x < p.x + p.width
    // checks if player horizontally overlaps the platform

    const prevBottom = player.y + player.height - player.velY
    // where player's feet WERE last frame before moving

    const currBottom = player.y + player.height
    // where player's feet ARE now

    const landingOnTop = prevBottom <= p.y && currBottom >= p.y
    // true if player just crossed through the top edge

    if (inXRange && landingOnTop) {
      player.y = p.y - player.height
      // snap player to sit exactly on top of platform

      player.velY = 0
      // stop downward movement

      player.onGround = true
      // allow jumping again
    }
  })

  // screen boundaries — stop player leaving the sides
  if (player.x < 0) player.x = 0
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width
}

// ============================================================
// GROUP 8 — BULLETS
// moves bullets every frame, removes them if off screen
// ============================================================

function updateBullets(player) {
  player.shootCooldown = Math.max(0, player.shootCooldown - 1)
  // count cooldown down every frame, stop at 0

  player.bullets = player.bullets.filter(b => {
    b.x += b.velX
    // move bullet forward

    return b.x > 0 && b.x < canvas.width
    // keep bullet only if still on screen
    // filter removes it automatically when this returns false
  })
}

function drawBullets(player) {
  player.bullets.forEach(b => {
    ctx.fillStyle = player.color
    // bullet matches player color
    ctx.shadowBlur = 10
    ctx.shadowColor = player.color
    // glow effect matching player color
    ctx.fillRect(b.x, b.y, 10, 4)
    // small rectangle — 10 wide, 4 tall
    ctx.shadowBlur = 0
    // reset glow so it doesn't affect other drawings
  })
}


