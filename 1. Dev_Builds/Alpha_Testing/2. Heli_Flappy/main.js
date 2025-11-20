// ============================== Flappy Heli Game (p5.js) ================================ //

// -------------------------------- START OF VARIABLES -----------------------------------   //

// Global Variables
let heli;
let gameStart = false;
let gameOver = false;
let gameOverTimer = 180;
let score = 0;
let heliReady = false;

// Clouds and Pipes
let clouds = [];
let pipes = [];

// Physics & Game Constants
const HELI_SPEED_LIFT = -10;
const PIPE_SPEED = 5;
const GRAVITY = 0.5;
const NUM_PIPES = 3;
const PIPE_SPACING = 450; // Distance between pipes
const PIPE_WIDTH = 100;

// Pipe Cap/Flange Constants
const CAP_WIDTH_INCREASE = 15; // Cap will be 15px wider than the pipe (115px total)
const CAP_HEIGHT = 30; // Height of the cap rim
const CAP_X_OFFSET = CAP_WIDTH_INCREASE / 2; // = 7.5. Used to center the wider cap

const MIN_PIPE_GAP = 250; // Minimum vertical gap 
const MAX_PIPE_GAP = 400; // Maximum vertical gap 

// Heli properties
let heliX = 150;
let heliY = 100;
let heliW = 250;
let heliH = 250;
let heliSpeed = 0;

// Helicopter Hitbox Properties
let hitDistX = 170;
let hitDistY = 75;
const HITBOX_X_SHIFT = -15; // Horizontal offset for precise alignment
const HITBOX_Y_SHIFT = 4; // Vertical offset for precise alignment

// Debug overlay
let debugMode = true;

// --------------------------- END OF VARIABLES -------------------------------- //

// -------------------------- START OF FUNCTIONS ------------------------------- //

// --- ASSET LOADING: Helicopter Video Asset --- //
function preload() {
  heli = createVideo("https://files.catbox.moe/ic7rjk.mp4", () => {
    heli.hide(); // Hide the original video element
    heliReady = true;
    heli.loop(); // Start looping the video immediately
    heli.pause(); // But pause it until the game starts
  });
}

// --- INITIAL SETUP: Build the world and the canvas --- //
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(LEFT, TOP);
  textSize(24);
  noSmooth();
  strokeWeight(2);

  // Create clouds
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: random(width),
      y: random(50, height / 2),
      size: random(100, 300),
      speed: random(0.3, 1.2),
    });
  }

  // Initialize pipes array
  for (let i = 0; i < NUM_PIPES; i++) {
    pipes.push({
      x: width + 200 + (i * PIPE_SPACING),
      y: random(200, height - 200),
      gap: random(MIN_PIPE_GAP, MAX_PIPE_GAP),
      scored: false,
    });
  }

  reset();
}

// --- GAME STATE RESET: Wipe the entire game clean --- //
function reset() {
  // Reset game state flags
  gameOver = false;
  gameStart = false;
  gameOverTimer = 180;
  score = 0;

  // Reset helicopter state
  heliY = height / 2;
  heliSpeed = 0;
  if (heliReady) heli.pause();


  // Reset pipes to their starting positions
  pipes.forEach((pipe, i) => {
    pipe.x = width + 200 + (i * PIPE_SPACING);
    pipe.y = random(200, height - 200);
    pipe.gap = random(MIN_PIPE_GAP, MAX_PIPE_GAP);
    pipe.scored = false; // Reset the scored flag
  });
}

// ----------------------------- MAIN GAME LOOP (60 FPS) ----------------------------- //

function draw() {
  background("#000000"); // A black background
	
  // Draw heli if the video is ready
  if (heliReady) {
    if (gameStart && !gameOver) {
      heliSpeed += GRAVITY;
      heliY += heliSpeed;
      checkPoints();
      hitPipes();
    }

    // Keep heli on screen
    heliY = constrain(heliY, -heliH / 4, height - heliH * 0.75);
    image(heli, heliX, heliY, heliW, heliH);
  }
	
	drawClouds();
	drawPipes(); // Drawing pipes must be before movePipes
	movePipes();
  drawHUD();

  if (debugMode) drawDebugOverlay();
}

// ----------------------------- DRAWING FUNCTIONS ----------------------------- //

// --- DRAWING: Scrolling Cloud Background --- //
function drawClouds() {
  fill(255, 255, 255, 150); // Semi-transparent white clouds
  noStroke();
  for (let c of clouds) {
    ellipse(c.x, c.y, c.size, c.size * 0.6);
    ellipse(c.x + c.size * 0.4, c.y + 10, c.size * 0.8, c.size * 0.5);
    ellipse(c.x - c.size * 0.4, c.y + 10, c.size * 0.7, c.size * 0.5);

    // Move cloud
    if (gameStart || gameOver) {
       c.x -= c.speed;
    }

    // Reset cloud when it goes off-screen
    if (c.x < -c.size) {
      c.x = width + c.size;
    }
  }
}

// --- DRAWING: Pipes and Flanges --- //
function drawPipes() {
  fill("#008000"); // Green for pipes
  stroke("#000000");
  const capWidth = PIPE_WIDTH + CAP_WIDTH_INCREASE;

  for (const pipe of pipes) {
    // 1. Top Pipe Body
    rect(pipe.x, 0, PIPE_WIDTH, pipe.y - pipe.gap);
    
    // 2. Top Pipe Cap (The Flange/Rim)
    rect(pipe.x - CAP_X_OFFSET, 
         pipe.y - pipe.gap - CAP_HEIGHT, // Starts above the gap end
         capWidth, 
         CAP_HEIGHT);

    // 3. Bottom Pipe Body
    rect(pipe.x, pipe.y, PIPE_WIDTH, height - pipe.y);
    
    // 4. Bottom Pipe Cap (The Flange/Rim)
    rect(pipe.x - CAP_X_OFFSET, 
         pipe.y, // Starts at the gap start
         capWidth, 
         CAP_HEIGHT);
  }
}

// ----------------------------- MOVEMENT & LOGIC ----------------------------- //

// --- MOVEMENT: Scroll and recycle pipes --- //
function movePipes() {
  if (!gameStart || gameOver) return;

  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED;

    // Recycle pipe: if off-screen, move it to the end of the line
    if (pipe.x < -PIPE_WIDTH) {
      // Find the x-position of the rightmost pipe
      let maxPipeX = 0;
      for (const p of pipes) {
        if (p.x > maxPipeX) {
          maxPipeX = p.x;
        }
      }
      // Position this pipe after the rightmost one
      pipe.x = maxPipeX + PIPE_SPACING;
      pipe.y = random(200, height - 200);
      pipe.gap = random(MIN_PIPE_GAP, MAX_PIPE_GAP);
      pipe.scored = false; // Reset the scored flag
    }
  }
}

// --- SCORING LOGIC: Did the heli pass the pipe? --- //
function checkPoints() {
  for (const pipe of pipes) {
    // Check if heli has passed the pipe and hasn't been scored yet
    if (!pipe.scored && heliX > pipe.x + PIPE_WIDTH) {
      score++;
      pipe.scored = true; // Mark as scored
    }
  }
}

// --- COLLISION CHECK: Check for impact with pipes --- //
function hitPipes() {
  // Calculate the precise hitbox coordinates for the helicopter
  const heliHitbox = {
    // Adjust X-position based on specific hitbox offset
    left: heliX + (heliW - hitDistX) / 2 + HITBOX_X_SHIFT,
    right: heliX + (heliW - hitDistX) / 2 + hitDistX + HITBOX_X_SHIFT,
    // Adjust Y-position based on specific hitbox offset
    top: heliY + (heliH - hitDistY) / 2 + HITBOX_Y_SHIFT,
    bottom: heliY + (heliH - hitDistY) / 2 + hitDistY + HITBOX_Y_SHIFT,
  };
  
  // Define collision zone based on the pipe's wider cap size.
  const pipeCollisionWidth = PIPE_WIDTH + CAP_WIDTH_INCREASE;

  for (const pipe of pipes) {
    const pipeHitbox = {
      // X-axis check uses the wider cap dimensions (pipe.x - CAP_X_OFFSET is the new left edge)
      left: pipe.x - CAP_X_OFFSET,
      right: pipe.x - CAP_X_OFFSET + pipeCollisionWidth,
      topPipeBottom: pipe.y - pipe.gap, // Bottom edge of the top pipe (top of the gap)
      bottomPipeTop: pipe.y // Top edge of the bottom pipe (bottom of the gap)
    };

    // Check for collision along the X axis (if the heli is over the pipe)
    if (heliHitbox.right > pipeHitbox.left && heliHitbox.left < pipeHitbox.right) {
      // Check for collision along the Y axis (if the heli hits the pipe material)
      if (heliHitbox.top < pipeHitbox.topPipeBottom || heliHitbox.bottom > pipeHitbox.bottomPipeTop) {
        endGame();
        return; // Exit after first collision
      }
    }
  }
}

// --- GAME FLOW: End Game Sequence --- //
function endGame() {
  if (gameOver) return; // Prevent multiple calls
  gameOver = true;
  gameStart = false;
  if (heliReady) heli.pause();
}

// --- GAME FLOW: Starting the helicopter --- //
function startGame() {
  if (gameOver) return;
  gameStart = true;
  heliSpeed = HELI_SPEED_LIFT;

  // Play heli video if it was paused
  if (heliReady && heli.elt.paused) {
    heli.loop();
  }
}

// ----------------------------- INPUT & UI HANDLERS ----------------------------- //

// --- INPUT: Keyboard checks for flap and start/restart --- //
function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    if (!gameStart) {
        if (gameOver) {
            // Allow reset only after game over message disappears
            if (gameOverTimer <= 0) reset();
        } else {
            startGame();
        }
    } else {
       heliSpeed = HELI_SPEED_LIFT;
    }
  }
}

// --- INPUT: Mouse clicks for flap and start/restart --- //
function mousePressed() {
    if (!gameStart) {
        if (gameOver) {
            if (gameOverTimer <= 0) reset();
        } else {
            startGame();
        }
    } else {
       heliSpeed = HELI_SPEED_LIFT;
    }
}


// --- INPUT: Toggle Debug Mode ('d') --- //
function keyTyped() {
  if (key === 'd') {
    debugMode = !debugMode;
  }
}

// --- UI/HUD: Score and message overlays --- //
function drawHUD() {
  fill("#00FF00");
  stroke("#000000");
  textSize(32);
  text("Score: " + score, 20, 20);

  if (!gameStart && !gameOver) {
    textSize(50);
    textAlign(CENTER, CENTER);
    fill("#FF0000");
    text("Click to Start", width / 2, height / 2);
    textAlign(LEFT, TOP);
  }

  if (gameOver) {
    textSize(60);
    textAlign(CENTER, CENTER);
    fill("#FF0000");
    text("Game Over!", width / 2, height / 2 - 40);
    textSize(24);
    text("Final Score: " + score, width / 2, height / 2 + 20);

    gameOverTimer--;
    if (gameOverTimer <= 0) {
        text("Press Space or Click to Restart", width/2, height/2 + 70);
    }
    textAlign(LEFT, TOP);
  }
}

// --- UI/HUD: Draw Hitbox for Debugging --- //
function drawDebugOverlay() {
  // Calculate debug box position using current offsets
  const hx = heliX + (heliW - hitDistX) / 2 + HITBOX_X_SHIFT;
  const hy = heliY + (heliH - hitDistY) / 2 + HITBOX_Y_SHIFT;
  noFill();
  stroke("#FF0000");
  rect(hx, hy, hitDistX, hitDistY);
}

// ----------------------------- UTILITY FUNCTIONS ----------------------------- //

// --- UTILITY: Keeping the canvas responsive --- //
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// --- UTILITY: Greet --- //
function greet() {
  console.log("Welcome to Heli Flappy!");
  console.log("Enjoy Playing the Game!");
  console.log("Here's a Bunch of Errors and Da Logs:");
}

// ----------------------------- CALLING FUNCTIONS ----------------------------- //

greet();

// ----------------------------------- THE END OF CODE --------------------------------------------- //
