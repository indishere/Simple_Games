// ================================== Asteroids Game (derived + extended) ====================================== //

// -------------------------------- START OF VARIABLES ----------------------------------- //

// Global Variables
let FPS

let shipX = 200
let shipY = 200

// Rocks
let rockX = [100, 200, 400, 800, 600]
let rockY = [400, 800, 200, 600, 100]
let rockSize = [50, 30, 80, 70, 20]
let rockXSpeed = [3, -1, 5, -4, 2]
let rockYSpeed = [4, 2, -3, 5, 3]
let rockCount = rockX.length

// Lasers 
let laserNum = 5
let laserX = [-100, -200, -300, -400, -500]
let laserY = [-100, -200, -300, -400, -500]
let laserDir = [0, 0, 0, 0, 0]
let laserSpeed = [15, 15, 15, 15, 15]
let laserXSpeed = [0, 0, 0, 0, 0]
let laserYSpeed = [0, 0, 0, 0, 0]
let laserWidth = [10, 10, 10, 10, 10]
let laserHeight = [30, 30, 30, 30, 30]
let laserVis = [false, false, false, false, false]
let laserTime = [0, 0, 0, 0, 0]

// Directional
let right = false
let left = false
let dir = 0

// Speed Logic
let xSpeed = 0
let ySpeed = 0
let speed = 0.1
let drag = 0.01

let boost = false
let boostSpeed = 5
let debug = false

// Gameplay
let score = 0
let lives = 3
let iFrames = 0
let gameOver = 0

// cooldown
let cooldownTimer = 15
let cooldown = 0

// -------------------------------- START OF FUNCTIONS ----------------------------------- //

function setup() {
  createCanvas(windowWidth, windowHeight)
  background(0)
  angleMode(DEGREES)
  frameRate(60)
}

function draw() {
  background(0)
  keyStuff()
  utility()

  // Order preserved: lasers then ship then rocks, collisions
  drawLaser()
  moveLaser()

  shootLaser()

  if (iFrames == 0 || iFrames % 10 < 5) {
    drawShip()
  }

  if (gameOver == 0) {
    moveShip()
    drawRock()
    moveRock()
    hitRock()
    laserHit()
    drawHUD()
  }

  // cooldown tick
  if (cooldown > 0) cooldown--

  // game over display & reset
  if (gameOver > 0) {
    fill(200, 50, 50)
    textAlign(CENTER)
    textSize(75)
    text("Game Over!", windowWidth / 2, windowHeight / 2)
    gameOver--
    if (gameOver == 0) {
      reset()
    }
  }
}

function keyStuff() {
  // ------------ Special Personal Controls (fixed to keyCodes) ------------
  // 'f' = 70, 's' = 83, 'e' = 69, space = 32, SHIFT = 16
  right = keyIsDown(70) || keyIsDown(RIGHT_ARROW)
  left = keyIsDown(83) || keyIsDown(LEFT_ARROW)
  boost = keyIsDown(69) || keyIsDown(UP_ARROW)
  // Space: use keyIsDown(32)
  // shootDaLaser is handled in shootLaser() using keyIsDown(32)
  if (keyIsDown(16)) { // SHIFT
    right = false
    left = false
    dir = 0
  }
  if (keyIsDown(DOWN_ARROW)) {
    right = false
    left = false
    dir = 0
  }

  // debug key press printing (optional)
  // if (debug && keyIsPressed) print(keyCode)
}

function drawLaser() {
  // --------- DRAW LASERS ---------- //
  for (let i = 0; i < laserNum; i++) {
    if (laserVis[i]) {
      push()
      translate(laserX[i], laserY[i])
      rotate(laserDir[i])
      noStroke()
      fill(255, 0, 0)
      rect(-laserWidth[i] / 2, -laserHeight[i] / 2, laserWidth[i], laserHeight[i])
      pop()
    }
  }
}

function findLaser() {
  // --------- FIND A FREE LASER SLOT ---------- //
  for (let i = 0; i < laserNum; i++) {
    if (laserVis[i] == false) {
      return i
    }
  }
  return -1
}

function moveLaser() {
  // --------- MOVE LASERS ---------- //
  for (let i = 0; i < laserNum; i++) {
    laserX[i] += laserXSpeed[i]
    laserY[i] += laserYSpeed[i]

    if (laserTime[i] > 0) {
      laserTime[i] -= 1
      if (laserTime[i] == 0) {
        laserVis[i] = false
      }
    }

    // wrap lasers around screen edges (keeps behavior consistent)
    if (laserX[i] < 0) laserX[i] = windowWidth
    if (laserX[i] > windowWidth) laserX[i] = 0
    if (laserY[i] < 0) laserY[i] = windowHeight
    if (laserY[i] > windowHeight) laserY[i] = 0
  }
}

function shootLaser() {
  // --------- SHOOT LASER ON SPACE ---------- //
  if (keyIsDown(32) && cooldown == 0) {
    let las = findLaser()
    if (las != -1) {
      laserVis[las] = true
      laserTime[las] = 100
      cooldown = cooldownTimer
      laserX[las] = shipX
      laserY[las] = shipY
      laserDir[las] = dir

      laserXSpeed[las] = laserSpeed[las] * sin(laserDir[las])
      laserYSpeed[las] = -laserSpeed[las] * cos(laserDir[las])
    }
  }
}

function drawShip() {
  push()
  translate(shipX, shipY)
  rotate(dir)
  noStroke()
  fill("#6496C8")
  triangle(20, 20, -20, 20, 0, -20)
  fill(200, 50, 50)
  triangle(5, -10, -5, -10, 0, -20)
  if (boost) {
    let wiggle = 0
    if (frameCount % 10 > 5) wiggle += 5
    fill(200, 50, 50)
    triangle(13, 20, -13, 20, 0, 50 + wiggle)
    fill(150, 150, 50)
    triangle(8, 20, -8, 20, 0, 35 + wiggle)
    fill(50, 50, 150)
    triangle(3, 20, -3, 20, 0, 25 + wiggle)
  }
  pop()
}

function moveShip() {
  if (right) dir += 5
  if (left) dir -= 5
  if (boost) {
    xSpeed += speed * sin(dir)
    ySpeed += -speed * cos(dir)
  } else {
    xSpeed -= xSpeed * drag
    ySpeed -= ySpeed * drag
  }
  shipX += xSpeed
  shipY += ySpeed
  if (shipX < 0) shipX = windowWidth
  if (shipX > windowWidth) shipX = 0
  if (shipY < 0) shipY = windowHeight
  if (shipY > windowHeight) shipY = 0

  // reset flags so they only respond when pressed again
  right = false
  left = false
}

function drawRock() {
  // draw each rock
  for (let i = 0; i < rockCount; i++) {
    fill(100, 120, 88)
    circle(rockX[i], rockY[i], rockSize[i])
  }
}

function rockRegen(num) {
  if (rockSize[num] < 10) {
    rockSize[num] = round(random(3, 10) * 10)
    // give it a random position and velocity so it doesn't spawn exactly same place
    rockX[num] = random(windowWidth)
    rockY[num] = random(windowHeight)
    rockXSpeed[num] = round(random(-5, 5))
    rockYSpeed[num] = round(random(-5, 5))
  }
}

function moveRock() {
  for (let i = 0; i < rockCount; i++) {
    rockX[i] += rockXSpeed[i]
    rockY[i] += rockYSpeed[i]
    if (rockX[i] < 0) {
      rockX[i] = windowWidth
      rockRegen(i)
    }
    if (rockX[i] > windowWidth) {
      rockX[i] = 0
      rockRegen(i)
    }
    if (rockY[i] < 0) {
      rockY[i] = windowHeight
      rockRegen(i)
    }
    if (rockY[i] > windowHeight) {
      rockY[i] = 0
      rockRegen(i)
    }
  }
}

function hitRock() {
  // ship collision with rocks (uses iFrames to avoid instant repeat hits)
  if (iFrames > 0) return
  for (let i = 0; i < rockCount; i++) {
    if (rockSize[i] > 10) {
      if (typeof collideCircleCircle === "function") {
        if (collideCircleCircle(shipX, shipY, 30, rockX[i], rockY[i], rockSize[i])) {
          // hit
          lives--
          if (lives < 1 && gameOver == 0) {
            gameOver = 100
          }
          iFrames = 100
          // push ship away a little
          xSpeed = -xSpeed
          ySpeed = -ySpeed
          // optionally reposition
          shipX = windowWidth / 2
          shipY = windowHeight / 2
        }
      } else {
        // fallback circle-collision if collide library missing
        let dx = shipX - rockX[i]
        let dy = shipY - rockY[i]
        let dist = sqrt(dx * dx + dy * dy)
        if (dist < (30 + rockSize[i]) / 2) {
          lives--
          if (lives < 1 && gameOver == 0) {
            gameOver = 100
          }
          iFrames = 100
          xSpeed = -xSpeed
          ySpeed = -ySpeed
          shipX = windowWidth / 2
          shipY = windowHeight / 2
        }
      }
    }
  }
  if (iFrames > 0) iFrames--
}

function laserHit() {
  // check each visible laser against each rock
  for (let i = 0; i < laserNum; i++) {
    if (laserVis[i]) {
      for (let j = 0; j < rockCount; j++) {
        if (rockSize[j] > 0) {
          if (typeof collideCircleCircle === "function") {
            if (collideCircleCircle(laserX[i], laserY[i], 10, rockX[j], rockY[j], rockSize[j])) {
              laserVis[i] = false
              rockSize[j] -= 10
              score += floor(random(5, 100))
              rockRegen(j)
            }
          } else {
            // fallback simple distance check
            let dx = laserX[i] - rockX[j]
            let dy = laserY[i] - rockY[j]
            let dist = sqrt(dx * dx + dy * dy)
            if (dist < (10 + rockSize[j]) / 2) {
              laserVis[i] = false
              rockSize[j] -= 10
              score += floor(random(5, 100))
              rockRegen(j)
            }
          }
        }
      }
    }
  }
}

function reset() {
  lives = 3
  iFrames = 0
  for (let i = 0; i < laserNum; i++) {
    laserVis[i] = false
    laserX[i] = -100
    laserY[i] = -100
    laserTime[i] = 0
  }
  xSpeed = 0
  ySpeed = 0
  shipX = windowWidth / 2
  shipY = windowHeight / 2
  score = 0
  // reset rock sizes and positions
  for (let i = 0; i < rockCount; i++) {
    rockSize[i] = round(random(3, 10) * 10)
    rockX[i] = random(windowWidth)
    rockY[i] = random(windowHeight)
  }
}

function drawHUD() {
  // lives icons
  for (let i = 0; i < lives; i++) {
    push()
    translate(30 + (i * 40), 30)
    scale(0.6)
    fill(100, 150, 200)
    triangle(20, 20, -20, 20, 0, -20)
    fill(255, 0, 0)
    triangle(5, -10, -5, -10, 0, -20)
    pop()
  }

  // score
  fill(255)
  textSize(20)
  textAlign(CENTER)
  text("Score: " + score, windowWidth / 2, 40)

  // cooldown indicator
  textAlign(LEFT)
  text("CD: " + cooldown, 10, 50)
}

// utility showing FPS
function utility() {
  FPS = round(frameRate())
  fill(255)
  textSize(16)
  text("FPS: " + FPS, 10, 20)
}
