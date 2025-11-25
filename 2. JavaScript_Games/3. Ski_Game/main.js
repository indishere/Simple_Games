// ================================= Ski Game (p5.js) =================================== //

// -------------------------------- START OF VARIABLES ----------------------------------- //

// Global Variables
let dir = 0;
let score = 0;
let defScore = 1;
let highScore = 0;
let jump = 0;
let lives = 5;
let iFrames = 180;
let execute6 = true;
let execute7 = true;
let execute67 = true;

//GameStart & GameOver
let gameOverTimer = 0;
let canContinue = false;
const GAME_STATE_STARTING = 0;
const GAME_STATE_RUNNING = 1;
const GAME_STATE_GAMEOVER = 2;
let gameState = GAME_STATE_STARTING;

// Skier
let skier;
let skierX = 300;
let skierY = 200;
let skierSizeX = 150;
let skierSizeY = 250;
let skiSpeed = 5;

// Coins
let coinX = 175;
let coinY = 175;
let coinSize = 50;
let coinSpeed = 4;
let giveCS = false;

// Rocks
let rockX = 250;
let rockY = 250;
let rockSize = 200;
let rockSpeed = 6;

// Trees
let treeCount = 5;
let treeX = [];
let treeY = [];
let treeSize = [];
let treeSpeed = 6;

// Hitbox and Debug
let hitboxW = 100;
let hitboxH = 175;
let hitboxXShift = -2;
let hitboxYShift = 5;

let debugMode = false;

// --------------------------------- SETUP + PRELOAD ----------------------------------- //

function preload() {
  skier = loadImage("Skier.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  angleMode(DEGREES);
  windowResized();
  initTrees();
}

// ------------------------------------- MAIN DRAW -------------------------------------- //

function draw() {
  background(0);

  if (gameState === GAME_STATE_STARTING) {
    gameStart();
    return;
  }

  if (gameState === GAME_STATE_RUNNING) {
    if (iFrames === 0 || iFrames % 10 > 5) drawSkier();
    if (iFrames > 0) iFrames--;

    moveSkier();
    drawRocks();
    moveRocks();
    drawTrees();
    moveTrees();
    drawCoins();
    moveCoins();
    checkCoins();
    giveCoins();

    if (jump === 0 && iFrames === 0) {
      checkRocks();
      checkTrees();
    }

    if (lives <= 0) {
      gameState = GAME_STATE_GAMEOVER;
      gameOverTimer = frameCount; // mark time of game over
      canContinue = false;
    }
  } 
  else if (gameState === GAME_STATE_GAMEOVER) {
    drawRocks();
    drawCoins();
    drawTrees();
    drawSkier();
    gameOverScreen();
  }
  showScore();
}

// ----------------------------------- GAMESTART LOGIC ---------------------------------- //

function gameStart() {
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(80);
  fill("#FF4500");
  text("Good Luck!", width / 2, height / 2 - 50);

  textSize(20);
  fill("#00FF00");
  text("Press SPACE or CLICK to Start", width / 2, height / 2 + 30);

  textAlign(LEFT, TOP);
}

// ------------------------------------- SKIER CODE ------------------------------------- //

function drawSkier() {
  push();
  translate(skierX, skierY);

  if (jump > 0) {
    jump--;
    rotate(jump * 10);
    let s = (-jump * jump + 36 * jump) * 0.007;
    scale(1 + s);
  }

  if (dir > 0) rotate(-30);
  if (dir < 0) rotate(30);

  imageMode(CENTER);
  image(skier, 0, 0, skierSizeX, skierSizeY);

  if (debugMode) {
    noFill();
    stroke("#FF0000");
    strokeWeight(2);
    rectMode(CENTER);
    rect(hitboxXShift, hitboxYShift, hitboxW, hitboxH);
  }

  pop();
}

function moveSkier() {
  skierX += skiSpeed * dir;
	
  if (skierX < -50) {skierX = windowWidth + 50}
  if (skierX > windowWidth + 50) {skierX = -50}
	
  skierX = constrain(skierX, skierSizeX / 2, width - skierSizeX / 2);
}

// ----------------------------------- TREE SYSTEM ------------------------------------- //

function initTrees() {
  for (let i = 0; i < treeCount; i++) {
    treeX[i] = random(0, width);
    treeY[i] = random(height, height * 2);
    treeSize[i] = random(40, 100);
  }
}

function drawTrees() {
  for (let i = 0; i < treeCount; i++) drawSingleTree(treeX[i], treeY[i], treeSize[i]);
}

function moveTrees() {
  for (let i = 0; i < treeCount; i++) {
    treeY[i] -= treeSpeed;
    if (treeY[i] < -treeSize[i]) {
      treeY[i] = height + treeSize[i];
      treeX[i] = random(0, width);
      treeSize[i] = random(40, 100);
    }
  }
}

function drawSingleTree(x, y, size) {
  fill(112, 70, 60);
  rect(x - 10, y + size - 10, 20, 20);
  fill(48, 81, 45);
  triangle(x - size, y + size - 10, x + size, y + size - 10, x, y - size);
}

function checkTrees() {
  for (let i = 0; i < treeCount; i++) {
    if (
      collideRectCircle(skierX + hitboxXShift, skierY + hitboxYShift, hitboxW, hitboxH,
        treeX[i], treeY[i], treeSize[i])
    ) {
      lives -= 1;
      iFrames = 180;
    }
  }
}

// ----------------------------------- COIN SYSTEM ------------------------------------- //

function drawCoins() {
  fill("#FFE100");
  noStroke();
  let flipFactor = 1;
  if (frameCount % 30 < 5) flipFactor = 1;
  else if (frameCount % 30 < 10) flipFactor = 0.6;
  else if (frameCount % 30 < 15) flipFactor = 0.3;
  else if (frameCount % 30 < 20) flipFactor = 0.6;
  else flipFactor = 1;
  ellipse(coinX, coinY, coinSize * flipFactor, coinSize);
}

function moveCoins() {
  coinY -= coinSpeed;
  if (coinY < -coinSize / 2) {
    coinY = windowHeight + coinSize / 2;
    coinX = random(0, windowWidth);
  }
}

function checkCoins() {
  if (collideCircleCircle(skierX, skierY, hitboxW, coinX, coinY, coinSize)) {
    giveCS = true;
	 increaseSpeed();
    coinY = windowHeight + coinSize / 2;
    coinX = random(0, windowWidth);
  }
}

function giveCoins() {
  if (giveCS === true) {
    score += defScore;
    giveCS = false;
  }
  if (frameCount % 300 === 0) score += defScore;
}

// ----------------------------------- ROCK SYSTEM ------------------------------------- //

function drawRocks() {
  fill("#FF0000");
  noStroke();
  circle(rockX, rockY, rockSize);
}

function moveRocks() {
  rockY -= rockSpeed;
  if (rockY < -rockSize / 2) {
    rockY = windowHeight + rockSize / 2;
    rockX = random(0, windowWidth);
    rockSize = random(50, 200);
  }
}

function checkRocks() {
  if (
    collideRectCircle(skierX + hitboxXShift, skierY + hitboxYShift, hitboxW, hitboxH,
      rockX, rockY, rockSize)
  ) {
    lives -= 1;
    iFrames = 180;
  }
}

// ------------------------------ Keyboard/Mouse Controls ------------------------------- //

function keyPressed() {
  // --- Start Game ---
  if (gameState === GAME_STATE_STARTING && (key === " " || keyCode === 32)) {
    gameState = GAME_STATE_RUNNING;
    return;
  }

  // --- Running Controls ---
  if (gameState === GAME_STATE_RUNNING) {
    if (key === "ArrowRight" || key === "f" || key === "F") dir = 1;
    if (key === "ArrowLeft" || key === "s" || key === "S") dir = -1;
    if (key === " " && jump === 0) jump = 36;

	 //if (key === "b") score = 67
  }

  // --- Debug Mode ---
  if (key === "d" || key === "D") debugMode = !debugMode;

  // --- Game Over Restart (after 3 seconds or auto after 7) ---
  if (gameState === GAME_STATE_GAMEOVER && (key === " " || keyCode === 32)) {
    let elapsed = (frameCount - gameOverTimer) / 60;
    if (elapsed >= 3) resetGame();
  }
}

function keyReleased() {
  if (key === "ArrowRight" || key === "f" || key === "F") dir = 0;
  if (key === "ArrowLeft" || key === "s" || key === "S") dir = 0;
}

function mousePressed() {
  if (gameState === GAME_STATE_STARTING) {
    gameState = GAME_STATE_RUNNING;
  } 
  else if (gameState === GAME_STATE_GAMEOVER) {
    let elapsed = (frameCount - gameOverTimer) / 60;
    if (elapsed >= 3) resetGame();
  }
}

// ----------------------------------- SCORE & SPEED ----------------------------------- //

function increaseSpeed () {
	if (giveCS === true) {
		skiSpeed += 1
		coinSpeed += 0.5
		rockSpeed += 1.5
		treeSpeed += 1.5
		
		console.log("Your Death rate has been successfully increased by 25%")
	}

	if (execute6 === true) {
	  if (score >= 6) {
	   	console.log("Six Seven -- 67 Ultra mode Activated")

	   	skiSpeed += 3
	   	coinSpeed += 3.5
		   rockSpeed += 3
	   	treeSpeed += 3.5
	  }
		execute6 = false
	}

	if (execute7 === true) {
	  if (score >= 7) {
	     console.log("Six Seven -- 67 Ultra Pro mode Activated")

		  skiSpeed += 6
		  coinSpeed += 7
		  rockSpeed += 6
		  treeSpeed += 7
	  }
		execute7 = false
	}

	if (execute67 === true) {
	  if (score >= 67) {
		  console.log("Six Seven -- 67 Ultra Pro Max GOD Mode Activated")

		  skiSpeed = 67
		  coinSpeed = 67
		  rockSpeed = 67
		  treeSpeed = 67

		 console.log("You are gonna die in 1 Second! Good Luck!")
	}
	   execute67 = false
  }
}

// ----------------------------------- DISPLAY SCORE ----------------------------------- //

function showScore() {
  fill("#00FF00");
  stroke("#000000");
  textSize(32);
	
  const scoreText = "Score: " + floor(score);
  text(scoreText, 20, 20);

  const highScoretext = "High Score: " + highScore;
  text(highScoretext, windowWidth - 250, 20);
if (score>highScore) highScore = score
	
  var livesStartX = windowWidth / 2 - textWidth(scoreText) + 35;
  drawLives(livesStartX, 20);
}

// ----------------------------------- Display Lives ----------------------------------- //

function drawLives(labelX, labelY) {
  fill("#00FF00");
  textSize(32);
  text("Lives: ", labelX, labelY);

  const livesStartX = labelX + textWidth("Lives: ") + 25;
  const livesStartY = labelY + 10;

  for (let i = 0; i < lives; i++) {
    push();
    translate(livesStartX + i * 35, livesStartY);
    noStroke();
    fill("#C86496");
    ellipse(-5, 8, 10, 25);
    ellipse(5, 8, 10, 25);
    fill("#64C864");
    ellipse(0, 0, 20, 20);
    fill("#FFFFFF");
    triangle(-7, -3, 7, -3, 0, -15);
    pop();
  }
}

// ----------------------------------- GAME OVER SYSTEM --------------------------------- //

function gameOverScreen() {
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(80);
  fill("#FF4500");
  text("GAME OVER", width / 2, height / 2 - 50);

  textSize(30);
  fill("#FFFFFF");
  text("Final Score: " + floor(score), width / 2, height / 2 + 20);

  // Timer + Instructions
  let elapsed = (frameCount - gameOverTimer) / 60;

  if (elapsed < 3) {
    textSize(20);
    fill("#AAAAAA");
    text("Please wait... " + (3 - floor(elapsed)) + "s", width / 2, height / 2 + 70);
  } else {
    textSize(20);
    fill("#00FF00");
    text("Press SPACE or CLICK to Continue", width / 2, height / 2 + 70);
    canContinue = true;
  }

  // Auto return after 7 seconds
  if (elapsed >= 7) resetGame();

  textAlign(LEFT, TOP);
}

function resetGame() {
  gameState = GAME_STATE_STARTING;
  lives = 3;
  score = 0;
  dir = 0;
  jump = 0;
  skiSpeed = 5
  coinSpeed = 4
  rockSpeed = 6
  treeSpeed = 6
  execute6 = true;
  execute7 = true;
  execute67 = true;
  
  skierX = width / 2;

  rockY = windowHeight + rockSize / 2;
  rockX = random(0, windowWidth);
  rockSize = random(50, 200);

  coinY = windowHeight + coinSize / 2;
  coinX = random(0, windowWidth);

  initTrees();
}

// ----------------------------------- UTILITY --------------------------------------- //

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ----------------------------------- GREETINGS --------------------------------------- //

function greet() {
  console.log("Welcome to The Ski Game!");
  console.log("Better Watch Out For The Rocks and Trees!");
  console.log("Here's a Bunch of Errors and Da Logs:");
}

greet();

// ----------------------------------- THE END OF CODE --------------------------------------------- //
