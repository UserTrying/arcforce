// ============================================================
// GROUP 1 — CANVAS SETUP
// grabs the game screen from index.html and sizes it
// everything gets drawn here — players, platforms, bullets, enemies
// ============================================================

const canvas = document.getElementById("gameCanvas")
// grabs the <canvas id="gameCanvas"> tag from index.html
// this is your game screen — blank until you draw on it

const ctx = canvas.getContext("2d")
// getContext("2d") unlocks the drawing tools for that canvas
// ctx is short for context — you'll use this to draw everything
// think of canvas as the paper, ctx as the pen

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  // sets canvas to fill the full browser window
  // window.innerWidth/Height are built-in browser values
}

resizeCanvas()
// runs once immediately so canvas is sized on load

window.addEventListener("resize", resizeCanvas)
// if window size changes, automatically resize canvas to match


// ============================================================
// GROUP 2 — GAME STATE
// single source of truth for everything happening in the game
// all other groups read from and write to this object
// reset this one object to restart the entire game
// ============================================================

const state = {
  mode: null,
  // "solo", "coop", or "pvp" — set when player clicks a mode button
  // null means no game running yet

  running: false,
  // is the game loop currently active
  // flips to true when a game starts, false on game over

  paused: false,
  // lets us freeze the game without ending it

  score: 0,
  // solo and coop shared score

  wave: 1,
  // current enemy wave number — increases as enemies are cleared

  gameOver: false,
  // triggers the end screen and score submission
}


// ============================================================
// GROUP 3 — PLAYERS
// each player is an object holding all their properties
// p1 and p2 are the same shape — different positions and controls
// ============================================================

const p1 = {
  x: 100,
  y: 300,
  // starting position on canvas
  // x = horizontal, y = vertical
  // y increases downward — 0 is the top of the screen

  width: 32,
  height: 48,
  // size of the player rectangle in pixels

  velX: 0,
  velY: 0,
  // current velocity — how fast and which direction they're moving
  // velY gets pulled down by gravity every frame

  speed: 5,
  // pixels moved per frame when walking

  jumpForce: -14,
  // negative because jumping goes UP — y increases downward
  // higher number = higher jump

  onGround: false,
  // are they standing on a platform right now
  // only allowed to jump when this is true

  health: 100,
  maxHealth: 100,
  // current and maximum health

  alive: true,
  // flips to false when health hits 0

  color: "#7df9aa",
  // player 1 is green — matches the game theme

  bullets: [],
  // array of active bullets this player has fired
  // each bullet is its own object — covered in Group 8

  facing: 1,
  // 1 = facing right, -1 = facing left
  // used to determine which direction bullets travel

  controls: {
    left: "a",
    right: "d",
    up: "w",
    shoot: " "
    // spacebar to shoot
  }
}

const p2 = {
  x: canvas.width - 150,
  y: 300,
  // starts on the opposite side of the screen from p1

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

  color: "#f97df9",
  // player 2 is purple to distinguish from p1

  bullets: [],

  facing: -1,
  // starts facing left toward p1

  controls: {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    shoot: "Enter"
  }
}


// ============================================================
// GROUP 4 — INPUT
// tracks which keys are currently held down
// keys object maps key name to true (held) or false (not held)
// game loop reads this every frame to move players
// ============================================================

const keys = {}
// empty object — fills itself as keys are pressed
// looks like { "a": true, "d": true } while those keys are held

window.addEventListener("keydown", e => {
  keys[e.key] = true
  // when a key is pressed, set it to true
  // e.key is the built-in name of the key that was pressed
})

window.addEventListener("keyup", e => {
  keys[e.key] = false
  // when a key is released, set it back to false
})

function getInput(player) {
  if (keys[player.controls.left]) player.velX = -player.speed
  // left key held — move left (negative x direction)

  else if (keys[player.controls.right]) player.velX = player.speed
  // right key held — move right (positive x direction)

  else player.velX = 0
  // no horizontal key — stop horizontal movement

  if (keys[player.controls.up] && player.onGround) {
    player.velY = player.jumpForce
    player.onGround = false
    // jump only allowed when standing on ground
    // sets vertical velocity to jumpForce (negative = upward)
  }

  if (keys[player.controls.shoot]) {
    shoot(player)
    // shoot function lives in Group 8
    // passing the whole player object so it knows who's shooting
  }

  if (player.velX > 0) player.facing = 1
  if (player.velX < 0) player.facing = -1
  // update facing direction based on movement
  // bullets use this to know which way to travel
}


// ============================================================
// START GAME
// called by the menu buttons in index.html
// hides the menu, shows the canvas, sets the mode, starts the loop
// ============================================================

function startGame(mode) {
  state.mode = mode
  // store which mode was picked — solo, coop, or pvp

  state.running = true
  state.gameOver = false
  state.score = 0
  state.wave = 1
  // reset everything fresh

  document.getElementById("menu").style.display = "none"
  // hide the menu

  canvas.style.display = "block"
  // show the game canvas

  gameLoop()
  // start the loop
}


// ============================================================
// GROUP 5 — GAME LOOP (skeleton)
// runs 60 times per second via requestAnimationFrame
// clears the screen, draws players, repeats forever
// we'll fill this out fully as we build each system
// ============================================================

function gameLoop() {
  if (!state.running) return
  // if game stopped, kill the loop

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // wipe the canvas clean every frame
  // without this every frame draws on top of the last one

  getInput(p1)
  // read p1 controls every frame

  if (state.mode !== "solo") getInput(p2)
  // only read p2 input in coop or pvp

  ctx.fillStyle = p1.color
  ctx.fillRect(p1.x, p1.y, p1.width, p1.height)
  // draw p1 as a colored rectangle for now
  // proper sprites come later

  if (state.mode !== "solo") {
    ctx.fillStyle = p2.color
    ctx.fillRect(p2.x, p2.y, p2.width, p2.height)
    // only draw p2 in coop or pvp
  }

  requestAnimationFrame(gameLoop)
  // tells browser to call gameLoop again next frame
  // this is what makes it loop — it keeps calling itself
  // syncs to 60fps automatically
}
