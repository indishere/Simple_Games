// ================================== ASTEROIDS: DEBT COLLECTOR EDITION ====================================== //
// This p5.js game is a asteroid shooter with a twist: managing your cash flow.
// Green rocks = cash, Red rocks = debt. Don't go bankrupt, man.

// ------------------------------------ CORE GAME STATE & VARIABLES ------------------------------------ //

// -- Global Status --
let FPS;
let gameOver = false;    // True if lives run out
let bankrupt = false;    // True if money drops below the catastrophic limit (-$2000)

// -- Ship & Movement --
let shipX, shipY;        // Current position
let dir = 0;             // Ship's rotation direction (degrees)
let xSpeed = 0;          // Current X velocity
let ySpeed = 0;          // Current Y velocity
let speed = 0.15;        // Thrust/acceleration power
let drag = 0.015;        // How quickly the ship slows down (space friction)

// -- Input Flags --
let right = false;       // Right rotation active
let left = false;        // Left rotation active
let boost = false;       // Thruster/boost active

// -- Player Stats --
let money = 0;           // Cash money earned (or lost)
let lives = 3;           // Hits remaining
let iFrames = 100;       // Invulnerability frames after taking damage

// -- Configuration --
let rockCount = 5;       // Number of money-earning rocks
let debtRockCount = 5;   // Number of debt rocks
let laserNum = 5;        // Maximum number of lasers allowed on screen

let cooldown = 0;        // Current laser cooldown timer (frames)
let cooldownTimer = 10;  // Frames required between shots

let debug = false;       // Debug mode flag (currently unused, but ready)

// ------------------------------------ DATA ARRAYS: GAME OBJECTS ------------------------------------ //
// Note: Arrays use parallel indexing (e.g., rockX[0] corresponds to rockY[0])

// -- Money Rocks (The green ones) --
let rockX = [];
let rockY = [];
let rockSize = [];
let rockXSpeed = [];
let rockYSpeed = [];

// -- Debt Rocks (The red ones) --
let debtRockX = [];
let debtRockY = [];
let debtRockSize = [];
let debtRockXSpeed = [];
let debtRockYSpeed = [];

// -- Lasers (Pew Pew) --
let laserX = [];
let laserY = [];
let laserDir = [];
let laserSpeed = [];
let laserXSpeed = [];
let laserYSpeed = [];
let laserWidth = [];
let laserHeight = [];
let laserVis = [];     // Visibility/active state
let laserTime = [];    // Remaining life (frames)

// ------------------------------------ SETUP & MAIN LOOP (p5.js) ------------------------------------ //

function setup() {
    // Initializes the canvas, sets angle mode to degrees, and seeds the game objects.
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    frameRate(60);

    shipX = windowWidth / 2;
    shipY = windowHeight / 2;

    // Initialize money rocks (random positions/speeds)
    for (let i = 0; i < rockCount; i++) {
        rockX.push(random(windowWidth));
        rockY.push(random(windowHeight));
        rockSize.push(random(20, 80));
        rockXSpeed.push(random(-5, 5));
        rockYSpeed.push(random(-5, 5));
    }

    // Initialize debt rocks (random positions/speeds)
    for (let i = 0; i < debtRockCount; i++) {
        debtRockX.push(random(windowWidth));
        debtRockY.push(random(windowHeight));
        debtRockSize.push(random(30, 100));
        debtRockXSpeed.push(random(-7, 7));
        debtRockYSpeed.push(random(-7, 7));
    }

    // Initialize laser slots (set them off-screen/inactive)
    for (let i = 0; i < laserNum; i++) {
        laserX.push(-100);
        laserY.push(-100);
        laserDir.push(0);
        laserSpeed.push(30); // Constant speed for each laser slot
        laserXSpeed.push(0);
        laserYSpeed.push(0);
        laserWidth.push(5);
        laserHeight.push(20);
        laserVis.push(false);
        laserTime.push(0);
    }
}

function draw() {
    background(0); // Space is black
    keyStuff();    // Handle user inputs for movement/shooting
    utility();     // Display FPS

    // Check game state before running the main loop
    if (!gameOver && !bankrupt) {
        // -- Game Logic Run Cycle --
        // Lasers: Draw, Move, Shoot Check
        drawLaser();
        moveLaser();
        shootLaser();

        // Ship: Draw (with iFrame flicker) and Move
        // Only draw the ship if iFrames are 0 OR if the flicker condition is met (iFrames % 10 < 5)
        if (iFrames === 0 || iFrames % 10 < 5) drawShip();
        moveShip();

        // Rocks: Draw, Move, Collision Check
        drawRock();
        moveRock();
        drawDebtRock();
        moveDebtRock();

        // Collisions: Ship vs Rock/DebtRock, Laser vs Rock/DebtRock
        hitRock();
        hitDebtRock();
        laserHit();
        laserHitDebt();

        // HUD & Timers
        drawHUD();
        if (cooldown > 0) cooldown--; // Decrement laser cooldown
        if (iFrames > 0) iFrames--;   // Decrement invulnerability frames

    } else {
        // -- Game Over/Bankrupt Screen --
        fill(240, 50, 50);
        textAlign(CENTER);
        textSize(75);
        text("GAME OVER!", windowWidth / 2, windowHeight / 2);

        if (bankrupt) {
            textSize(50);
            text("You got Bankrupt!", windowWidth / 2, windowHeight / 2 + 80);
            textSize(30);
            fill(255);
            text("Press SPACE to restart", windowWidth / 2, windowHeight / 2 + 150);
        } else if (gameOver) {
            textSize(50);
            text("Score: $" + money, windowWidth / 2, windowHeight / 2 + 80);
            textSize(30);
            fill(255);
            text("Press SPACE to restart", windowWidth / 2, windowHeight / 2 + 150);
        }
    }
}

// ------------------------------------ INPUT HANDLER ------------------------------------ //

function keyStuff() {
    // This handles continuous input using p5.js keyIsDown()

    // Key Codes: 70=F (Right), 83=S (Left), 69=E (Boost)
    if (keyIsDown(70)) right = true;
    if (keyIsDown(83)) left = true;
    if (keyIsDown(69)) boost = true;

    // Shift key/Down Arrow acts as a brake/reset
    if (keyIsDown(SHIFT)) {
        right = false; left = false; dir = 0;
    }

    // Standard Arrow Keys (Optional controls)
    if (keyIsDown(RIGHT_ARROW)) right = true;
    if (keyIsDown(LEFT_ARROW)) left = true;
    if (keyIsDown(UP_ARROW)) boost = true;
    if (keyIsDown(DOWN_ARROW)) {
        right = false; left = false; dir = 0;
    }

    // Restart game with SPACEBAR (32) if the game is over
    if ((gameOver || bankrupt) && keyIsDown(32)) {
        reset();
        gameOver = false;
        bankrupt = false;
    }
}

// ------------------------------------ SHIP LOGIC ------------------------------------ //

function drawShip() {
    // Draws the ship centered on its position and rotated by 'dir'
    push();
    translate(shipX, shipY);
    rotate(dir);
    noStroke();

    // Ship Body (Blue)
    fill("#6496C8");
    triangle(20, 20, -20, 20, 0, -20);
    // Ship Nose (Red accent)
    fill(200, 50, 50);
    triangle(5, -10, -5, -10, 0, -20);

    // Thruster visual when boosting
    if (boost) {
        let wiggle = frameCount % 10 > 5 ? 5 : 0;
        fill(200, 50, 50); triangle(13, 20, -13, 20, 0, 50 + wiggle);
        fill(150, 150, 50); triangle(8, 20, -8, 20, 0, 35 + wiggle);
        fill(50, 50, 150); triangle(3, 20, -3, 20, 0, 25 + wiggle);
    }

    pop();
}

function moveShip() {
    // Handles rotation based on input flags
    if (right) dir += 5;
    if (left) dir -= 5;

    // Handles acceleration (thrust) or deceleration (drag)
    if (boost) {
        // Accelerate in the direction 'dir' is pointing
        xSpeed += speed * sin(dir);
        ySpeed += -speed * cos(dir); // Negative because Y is inverted in p5.js (0 at top)
    } else {
        // Apply drag/friction
        xSpeed -= xSpeed * drag;
        ySpeed -= ySpeed * drag;
    }

    // Apply velocity to position
    shipX += xSpeed;
    shipY += ySpeed;

    // Screen wrap: Toroidal space
    if (shipX < 0) shipX = windowWidth;
    if (shipX > windowWidth) shipX = 0;
    if (shipY < 0) shipY = windowHeight;
    if (shipY > windowHeight) shipY = 0;
}

// ------------------------------------ LASER LOGIC ------------------------------------ //

function drawLaser() {
    // Draws all active lasers
    for (let i = 0; i < laserNum; i++) {
        if (laserVis[i]) {
            push();
            translate(laserX[i], laserY[i]);
            rotate(laserDir[i]);
            noStroke();
            fill("#FF0000"); // Red laser
            rect(-laserWidth[i] / 2, -laserHeight[i] / 2, laserWidth[i], laserHeight[i]);
            pop();
        }
    }
}

function findLaser() {
    // Finds the index of the first available (inactive) laser slot
    for (let i = 0; i < laserNum; i++) if (!laserVis[i]) return i;
    return -1; // No slot found
}

function moveLaser() {
    // Updates position and checks lifetime for all lasers
    for (let i = 0; i < laserNum; i++) {
        laserX[i] += laserXSpeed[i];
        laserY[i] += laserYSpeed[i];

        // Decrement lifetime and deactivate if time runs out
        if (laserTime[i] > 0) {
            laserTime[i]--;
            if (laserTime[i] === 0) laserVis[i] = false;
        }

        // Screen wrap for lasers
        if (laserX[i] < 0) laserX[i] = windowWidth;
        if (laserX[i] > windowWidth) laserX[i] = 0;
        if (laserY[i] < 0) laserY[i] = windowHeight;
        if (laserY[i] > windowHeight) laserY[i] = 0;
    }
}

function shootLaser() {
    // Fire laser if SPACEBAR (32) is pressed and cooldown is 0
    if (keyIsDown(32) && cooldown === 0) {
        let las = findLaser();
        if (las !== -1) {
            laserVis[las] = true;
            laserTime[las] = 100;      // Set laser lifespan
            cooldown = cooldownTimer;  // Reset cooldown timer

            // Set initial position, direction, and speed from the ship's state
            laserX[las] = shipX;
            laserY[las] = shipY;
            laserDir[las] = dir;
            laserXSpeed[las] = laserSpeed[las] * sin(dir);
            laserYSpeed[las] = -laserSpeed[las] * cos(dir);
        }
    }
}

// ------------------------------------ MONEY ROCK LOGIC ------------------------------------ //

function drawRock() {
    // Draws the money-earning rocks (green)
    for (let i = 0; i < rockCount; i++) {
        fill(100, 120, 88); // Greenish/Earth tone
        circle(rockX[i], rockY[i], rockSize[i]);
    }
}

function rockRegen(i) {
    // Respawns a rock if its size drops below the minimum threshold (10)
    if (rockSize[i] < 10) {
        rockSize[i] = round(random(3, 10) * 10);
        rockX[i] = random(windowWidth);
        rockY[i] = random(windowHeight);
        rockXSpeed[i] = round(random(-5, 5));
        rockYSpeed[i] = round(random(-5, 5));
    }
}

function moveRock() {
    // Updates rock positions and handles screen wrap/regeneration
    for (let i = 0; i < rockCount; i++) {
        rockX[i] += rockXSpeed[i];
        rockY[i] += rockYSpeed[i];
        // Screen wrap with regeneration check
        if (rockX[i] < 0) { rockX[i] = windowWidth; rockRegen(i); }
        if (rockX[i] > windowWidth) { rockX[i] = 0; rockRegen(i); }
        if (rockY[i] < 0) { rockY[i] = windowHeight; rockRegen(i); }
        if (rockY[i] > windowHeight) { rockY[i] = 0; rockRegen(i); }
    }
}

function hitRock() {
    // Checks for collision between ship and money rock (damages ship)
    if (iFrames === 0) { // Only check if ship is not invincible
        for (let i = 0; i < rockCount; i++) {
            if (rockSize[i] > 10) {
                // Check distance using p5.js dist()
                let distance = dist(shipX, shipY, rockX[i], rockY[i]);
                let collisionRadius = (30 + rockSize[i]) / 2;

                if (distance < collisionRadius) {
                    // Collision: Lose a life, trigger iFrames, reset position
                    lives--;
                    if (lives < 1 && !gameOver) gameOver = true;
                    iFrames = 100;
                    xSpeed = -xSpeed; ySpeed = -ySpeed; // Bounce effect
                    shipX = windowWidth / 2; shipY = windowHeight / 2;
                }
            }
        }
    }
}

function laserHit() {
    // Checks for collision between laser and money rock (earns money, damages rock)
    for (let i = 0; i < laserNum; i++) {
        if (laserVis[i]) {
            for (let j = 0; j < rockCount; j++) {
                if (rockSize[j] > 0) {
                    let distance = dist(laserX[i], laserY[i], rockX[j], rockY[j]);
                    let hitRadius = (10 + rockSize[j]) / 2;

                    if (distance < hitRadius) {
                        laserVis[i] = false;  // Destroy laser
                        rockSize[j] -= 10;    // Chip the rock
                        money += floor(random(5, 100)); // Get cash
                        rockRegen(j);         // Check if rock needs to respawn
                    }
                }
            }
        }
    }
}

// ------------------------------------ DEBT ROCK LOGIC ------------------------------------ //

function drawDebtRock() {
    // Draws the debt rocks (red, alarm color)
    for (let i = 0; i < debtRockCount; i++) {
        fill(255, 60, 48);
        circle(debtRockX[i], debtRockY[i], debtRockSize[i]);
    }
}

function debtRockRegen(i) {
    // Respawns a debt rock if its size drops below the minimum threshold (10)
    if (debtRockSize[i] < 10) {
        debtRockSize[i] = round(random(3, 10) * 10);
        debtRockX[i] = random(windowWidth);
        debtRockY[i] = random(windowHeight);
        debtRockXSpeed[i] = random(-7, 7);
        debtRockYSpeed[i] = random(-7, 7);
    }
}

function moveDebtRock() {
    // Updates debt rock positions and handles screen wrap/regeneration
    for (let i = 0; i < debtRockCount; i++) {
        debtRockX[i] += debtRockXSpeed[i];
        debtRockY[i] += debtRockYSpeed[i];
        // Screen wrap with regeneration check
        if (debtRockX[i] < 0) { debtRockX[i] = windowWidth; debtRockRegen(i); }
        if (debtRockX[i] > windowWidth) { debtRockX[i] = 0; debtRockRegen(i); }
        if (debtRockY[i] < 0) { debtRockY[i] = windowHeight; debtRockRegen(i); }
        if (debtRockY[i] > windowHeight) { debtRockY[i] = 0; debtRockRegen(i); }
    }
}

function laserHitDebt() {
    // Checks for collision between laser and debt rock (still earns money, damages rock)
    for (let i = 0; i < laserNum; i++) {
        if (laserVis[i]) {
            for (let j = 0; j < debtRockCount; j++) {
                if (debtRockSize[j] > 0) {
                    let distance = dist(laserX[i], laserY[i], debtRockX[j], debtRockY[j]);
                    let hitRadius = (10 + debtRockSize[j]) / 2;

                    if (distance < hitRadius) {
                        laserVis[i] = false;
                        debtRockSize[j] -= 10;
                        money += floor(random(5, 100)); // Get cash money for cleaning up debt too
                        debtRockRegen(j);
                    }
                }
            }
        }
    }
}

function hitDebtRock() {
    // Checks for collision between ship and debt rock (loses money, no life lost)
    for (let i = 0; i < debtRockCount; i++) {
        if (debtRockSize[i] > 10) {
            let distance = dist(shipX, shipY, debtRockX[i], debtRockY[i]);
            let collisionRadius = (30 + debtRockSize[i]) / 2;

            if (distance < collisionRadius) {
                // Collision: Lose $100 immediately
                money -= 100;
                // Check for bankruptcy (Debt limit is -$2000)
                if (money < -2500 && !bankrupt) bankrupt = true;

                iFrames = 100; // Still get a momentary shield
                xSpeed = -xSpeed; ySpeed = -ySpeed;
                shipX = windowWidth / 2; shipY = windowHeight / 2;
            }
        }
    }
}

// ------------------------------------ GAME UTILITY ------------------------------------ //

function reset() {
    // Resets the entire game state for a new run
    lives = 3;
    iFrames = 0;
    xSpeed = ySpeed = 0;
    shipX = windowWidth / 2;
    shipY = windowHeight / 2;
    money = 0;

    // Reset all lasers
    for (let i = 0; i < laserNum; i++) {
        laserVis[i] = false;
        laserX[i] = -100;
        laserY[i] = -100;
        laserTime[i] = 0;
    }

    // Reset money rocks
    for (let i = 0; i < rockCount; i++) {
        rockSize[i] = round(random(3, 10) * 10);
        rockX[i] = random(windowWidth);
        rockY[i] = random(windowHeight);
        rockXSpeed[i] = random(-5, 5);
        rockYSpeed[i] = random(-5, 5);
    }

    // Reset debt rocks
    for (let i = 0; i < debtRockCount; i++) {
        debtRockSize[i] = round(random(3, 10) * 10);
        debtRockX[i] = random(windowWidth);
        debtRockY[i] = random(windowHeight);
        debtRockXSpeed[i] = random(-7, 7);
        debtRockYSpeed[i] = random(-7, 7);
    }
}

function drawHUD() {
    // Draws the lives count (mini ships)
    for (let i = 0; i < lives; i++) {
        push();
        translate(30 + (i * 40), 30);
        scale(0.6);
        fill(100, 150, 200);
        triangle(20, 20, -20, 20, 0, -20);
        fill(255, 0, 0);
        triangle(5, -10, -5, -10, 0, -20);
        pop();
    }
    // Displays the current money in the center
    fill(255);
    textSize(20);
    textAlign(CENTER);
    text("money: " + money, windowWidth / 2, 40);
    // Displays the laser cooldown
    textAlign(LEFT);
    text("CD: " + cooldown, 10, 50);
}

function utility() {
    // Shows the current Frames Per Second (FPS)
    FPS = round(frameRate());
    fill(255);
    textSize(16);
    text("FPS: " + FPS, 10, 20);
}

// ================================== END of Asteroids Game Logic ====================================== //
