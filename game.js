// ============================================================
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
// GROUP 3 — PLAYERS
// each player is an object holding everything about them
// position, size, speed, health, controls, bullets etc
// p1 = player 1, p2 = player 2
// ============================================================

const p1 = {
  x: 100,           // starting position from left
  y: 300,           // starting position from top
  width: 32,        // how wide the player rectangle is
  height: 48,       // how tall the player rectangle is
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

  getInput(p1)
  if (state.mode !== "solo") getInput(p2)
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
