// -------------------------- START OF VARIABLES ------------------------------- //

// Game Logic (Main)
var lives = 3;
var invis = 120;
var hitShip = false;
var hitCoin = false;
var hitRock = false;
var rockHP = 255;
var Gameover = 0;

// Lasers Config
var laserX = -1;
var laserY = -1;
var laserRed = 0;
var laserTime = 0;

// Main UFO (us)
var shipX = 100;
var shipY = 100;
var speed = 5;
var Shspeed_boost = 5;

// Asteroids/Rocks
var rockX = 200;
var rockY = 200;
var rSpeedX = 3;
var rSpeedY = 3;
var Rospeed_boost = 5;

// Game Stuff
var coins = 0;
var coinX = 0;
var coinY = 0;

// --------------------------- END OF VARIABLES ------------------------------ //

// -------------------------- Start of Functions ----------------------------- //

function setup() {
  // Create the canvas
  createCanvas(windowWidth, windowHeight);

  // Set background to black
  background(0);
  coinX = random(0, windowWidth);
  coinY = random(0, windowHeight);
}

function draw() {
  background(0);

  noCursor();
	
	// ----------------------------- GAME OVER SCREEN ----------------------------- //
	
  if (Gameover == 1) {
    textSize(70);
    fill(255, 0, 0);
    text("GAME OVER!", width / 2 - 200, height / 2);
    textSize(40);
    fill(255);
    text("Press R to Restart", width / 2 - 170, height / 2 + 70);
    return; // stops rest of the game loop
	}

  // ----------------------------- Moving everything Here ----------------------------- //
	
	// ---------- For My Settings ONLY ------------ //
	
  if (keyIsDown("f")) {
    shipX = shipX + speed
  }
  else if (keyIsDown("s")) {
    shipX = shipX - speed
  }
  else if (keyIsDown("e")) {
    shipY = shipY - speed
  }
  else if (keyIsDown("d")) {
    shipY = shipY + speed
  }
	
  // ---------- For Global Settings ------------ //
	
	if (keyIsDown(LEFT_ARROW)) {
  shipX -= speed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
  shipX += speed;
  }
  if (keyIsDown(UP_ARROW)) {
  shipY -= speed;
  }
  if (keyIsDown(DOWN_ARROW)) {
  shipY += speed;
  }
	
  // ----------- For The Rock(s) ------------ //
  rockX = rockX + rSpeedX;
  rockY += rSpeedY;

  // ---------------------------------- Walls Here ---------------------------------- //

  // For Ship aka UFO
  if (shipX < 0) {
    shipX = 0;
  }
  if (shipY < 0) {
    shipY = 0;
  }
  if (shipX > windowWidth) {
    shipX = windowWidth;
  }
  if (shipY > windowHeight) {
    shipY = windowHeight;
  }

  // For Rock
  if (rockY < 0 || rockY > windowHeight) {
    rSpeedY *= -1;
  }
  if (rockX < 0 || rockX > windowWidth) {
    rSpeedX *= -1;
  }

  // ----------------------------- Drawing everything Here ----------------------------- //

  // The Drawing of UFO
  if (invis % 20 < 10) {
    fill("#FF0000BA");
    circle(shipX, shipY, 75);

    fill("#00FF00AF");
    circle(shipX + 35, shipY + 15, 20);

    fill("#00FF00AF");
    circle(shipX + 35, shipY - 15, 20);
  }

  // Draw Da Rock
  fill(50, rockHP, 255);
  circle(rockX, rockY, 100);

  // Draw Coins
  fill("#FFFF00");
  circle(coinX, coinY, 50);

  // ----------------------------- Collision management Here ----------------------------- //

  // For Ship and Rock
  hitShip = collideCircleCircle(shipX, shipY, 75, rockX, rockY, 100);
  hitCoin = collideCircleCircle(shipX, shipY, 75, coinX, coinY, 50);
  hitRock = collideLineCircle  (shipX, shipY, laserX, laserY, rockX, rockY, 100)
	
  if (hitCoin == true) {
    coinX = random(0, windowWidth);
    coinY = random(0, windowHeight);
    console.log("You got Food! Ayyyy");
    console.log("Growing ur size now...");
    coins += 1;
  }
	if (hitRock == true) {
		rockHP -= 1
		if (rockHP < 1) {
			print("You Win!")
		}
		print("Hit!!!!!!")
	}

  if (hitShip == true && invis == 0) {
    console.log("Yo! Collision Detected!");
    console.log("Mission Abort!");
    console.log("Respawning Player...");
    console.log("Player Respawned!");
		
	// NOTE: DO NOT Insert anything here. Explicitly for func hitShip.
  // ----------------------------- Respawn logic Here ----------------------------- //
    lives -= 1;
    invis = 120;
    shipX = 100;
    shipY = 100;
  }
	
	// ----------------------------- Laser logic Here ----------------------------- //
	
	if (mouseIsPressed && laserTime == 0 && coins > 0) {
		laserX = mouseX
		laserY = mouseY
		laserTime = 25
		coins -= 1
	}
	
	if (laserTime > 0) {
		laserTime -= 1
		stroke("#FF0000")
		strokeWeight(10)
		line(shipX,shipY,mouseX,mouseY)
	}

  // ----------------------------- GAME OVER Trigger ----------------------------- //
  if (lives <= 0) {
    Gameover = 1;
  }

  // ----------------------------- Lives management here ----------------------------- //
  if (invis > 0) {
    invis -= 1;
  }

  fill("#00FF00");
  textSize(50);
	strokeWeight(0)
  text("Lives: " + lives, 50, 50);
  text(", Coins: " + coins, 225, 50);

  // ------------------------ Draw Custom Game Cursor Here ------------------------ //

  // glow ring
  noFill();
  stroke(0, 255, 0, 150);
  strokeWeight(3);
  circle(mouseX, mouseY, 30);

  // crosshair lines
  stroke(255, 0, 0);
  strokeWeight(1.5);
  line(mouseX - 10, mouseY, mouseX + 10, mouseY);
  line(mouseX, mouseY - 10, mouseX, mouseY + 10);
}

// -------------------------- END of Draw Function ------------------------- //

// ------------------------ Start of Greet Function ------------------------ //

function greet() {
  console.log("Welcome to UFO Game!");
  console.log("Better watch out for the rock");
  console.log("Here's a Bunch of Errors and Logs:");
}

// ----------------------------- Restart Logic ----------------------------- //
function keyPressed() {
  if (Gameover == 1 && key == "r") {
    lives = 3;
    coins = 0;
    shipX = 100;
    shipY = 100;
    Gameover = 0;
    console.log("Game Restarted!");
  }
}

// ----------------------------- Calling Functions Here ----------------------------- //

greet();

// ----------------------------------- THE END OF CODE --------------------------------------------- //
