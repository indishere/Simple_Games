// ================================== Asteroids Game ====================================== //

// -------------------------------- START OF VARIABLES ----------------------------------- //

// Global
let FPS;
let gameOver = false;
let bankrupt = false;

// Ship / Gameplay
let shipX, shipY;
let dir = 0;
let xSpeed = 0;
let ySpeed = 0;
let speed = 0.15;
let drag = 0.015;

let right = false;
let left = false;
let boost = false;

let money = 0;
let lives = 3;
let iFrames = 100;

// Config
let rockCount = 5;
let debtRockCount = 5;
let laserNum = 5;

let cooldown = 0;
let cooldownTimer = 10;

let debug = false;

// Money rocks
let rockX = [];
let rockY = [];
let rockSize = [];
let rockXSpeed = [];
let rockYSpeed = [];

// Debt rocks
let debtRockX = [];
let debtRockY = [];
let debtRockSize = [];
let debtRockXSpeed = [];
let debtRockYSpeed = [];

// Lasers
let laserX = [];
let laserY = [];
let laserDir = [];
let laserSpeed = [];
let laserXSpeed = [];
let laserYSpeed = [];
let laserWidth = [];
let laserHeight = [];
let laserVis = [];
let laserTime = [];

// -------------------------------- START OF FUNCTIONS ----------------------------------- //

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  frameRate(60);

  shipX = windowWidth / 2;
  shipY = windowHeight / 2;

  // Initialize money rocks
  for (let i = 0; i < rockCount; i++) {
    rockX.push(random(windowWidth));
    rockY.push(random(windowHeight));
    rockSize.push(random(20, 80));
    rockXSpeed.push(random(-5, 5));
    rockYSpeed.push(random(-5, 5));
  }

  // Initialize debt rocks
  for (let i = 0; i < debtRockCount; i++) {
    debtRockX.push(random(windowWidth));
    debtRockY.push(random(windowHeight));
    debtRockSize.push(random(30, 100));
    debtRockXSpeed.push(random(-7, 7));
    debtRockYSpeed.push(random(-7, 7));
  }

  // Initialize lasers
  for (let i = 0; i < laserNum; i++) {
    laserX.push(-100);
    laserY.push(-100);
    laserDir.push(0);
    laserSpeed.push(30);
    laserXSpeed.push(0);
    laserYSpeed.push(0);
    laserWidth.push(5);
    laserHeight.push(20);
    laserVis.push(false);
    laserTime.push(0);
  }
}

function draw() {
  background(0);
  keyStuff();
  utility();

  drawLaser();
  moveLaser();
  shootLaser();

  if (iFrames === 0 || iFrames % 10 < 5) drawShip();

  if (!gameOver) {
    moveShip();
    drawRock();
    moveRock();

    drawDebtRock();
    moveDebtRock();
    hitRock();
    hitDebtRock();

    laserHit();
    laserHitDebt();
    drawHUD();
  }

  if (cooldown > 0) cooldown--;

  if (gameOver) {
    fill(200, 50, 50);
    textAlign(CENTER);
    textSize(75);
    text("Game Over!", windowWidth / 2, windowHeight / 2);
    reset();
    gameOver = false;
 }

  if (bankrupt) {
    fill(240, 50, 50);
    textAlign(CENTER);
    textSize(75);
    text("Game Over!", windowWidth / 2, windowHeight / 2);
    text("You got Bankrupt!", windowWidth / 2, windowHeight / 2 + 120);
    reset();
    bankrupt = false;
 }
}

function keyStuff() {

  // Personal Special Controls
  right = KeyisDown("f");
  left = KeyisDown("s");
  boost = KeyisDown("e");

  if (keyIsDown(SHIFT)) {
    right = false; left = false; dir = 0;
  }

  // Global Controls
  if (keyIsDown(RIGHT_ARROW)) right = true;
  if (keyIsDown(LEFT_ARROW)) left = true;
  if (keyIsDown(UP_ARROW)) boost = true;

  if (keyIsDown(DOWN_ARROW)) {
    right = false; left = false; dir = 0;
  }
}

function drawLaser() {
  for (let i = 0; i < laserNum; i++) {
    if (laserVis[i]) {
      push();
      translate(laserX[i], laserY[i]);
      rotate(laserDir[i]);
      noStroke();
      fill("#FF0000");
      rect(-laserWidth[i]/2, -laserHeight[i]/2, laserWidth[i], laserHeight[i]);
      pop();
    }
  }
}

function findLaser() {
  for (let i = 0; i < laserNum; i++) if (!laserVis[i]) return i;
  return -1;
}

function moveLaser() {
  for (let i = 0; i < laserNum; i++) {
    laserX[i] += laserXSpeed[i];
    laserY[i] += laserYSpeed[i];

    if (laserTime[i] > 0) {
      laserTime[i]--;
      if (laserTime[i] === 0) laserVis[i] = false;
    }

    if (laserX[i] < 0) laserX[i] = windowWidth;
    if (laserX[i] > windowWidth) laserX[i] = 0;
    if (laserY[i] < 0) laserY[i] = windowHeight;
    if (laserY[i] > windowHeight) laserY[i] = 0;
  }
}

function shootLaser() {
  if (keyIsDown(32) && cooldown === 0) {
    let las = findLaser();
    if (las !== -1) {
      laserVis[las] = true;
      laserTime[las] = 100;
      cooldown = cooldownTimer;
      laserX[las] = shipX;
      laserY[las] = shipY;
      laserDir[las] = dir;
      laserXSpeed[las] = laserSpeed[las] * sin(dir);
      laserYSpeed[las] = -laserSpeed[las] * cos(dir);
    }
  }
}

function drawShip() {
  push();
  translate(shipX, shipY);
  rotate(dir);
  noStroke();
  fill("#6496C8");
  triangle(20, 20, -20, 20, 0, -20);
  fill(200, 50, 50);
  triangle(5, -10, -5, -10, 0, -20);

  if (boost) {
    let wiggle = frameCount % 10 > 5 ? 5 : 0;
    fill(200,50,50); triangle(13,20,-13,20,0,50+wiggle);
    fill(150,150,50); triangle(8,20,-8,20,0,35+wiggle);
    fill(50,50,150); triangle(3,20,-3,20,0,25+wiggle);
  }

  pop();
}

function moveShip() {
  if (right) dir += 5;
  if (left) dir -= 5;
  if (boost) {
    xSpeed += speed * sin(dir);
    ySpeed += -speed * cos(dir);
  } else {
    xSpeed -= xSpeed * drag;
    ySpeed -= ySpeed * drag;
  }

  shipX += xSpeed;
  shipY += ySpeed;

  if (shipX < 0) shipX = windowWidth;
  if (shipX > windowWidth) shipX = 0;
  if (shipY < 0) shipY = windowHeight;
  if (shipY > windowHeight) shipY = 0;

  right = left = false;
}

// ------------------------------ ROCKS ------------------------------ //

function drawRock() {
  for (let i = 0; i < rockCount; i++) {
    fill(100,120,88);
    circle(rockX[i], rockY[i], rockSize[i]);
  }
}

function rockRegen(i) {
  if (rockSize[i] < 10) {
    rockSize[i] = round(random(3,10)*10);
    rockX[i] = random(windowWidth);
    rockY[i] = random(windowHeight);
    rockXSpeed[i] = round(random(-5,5));
    rockYSpeed[i] = round(random(-5,5));
  }
}

function moveRock() {
  for (let i = 0; i < rockCount; i++) {
    rockX[i] += rockXSpeed[i];
    rockY[i] += rockYSpeed[i];
    if (rockX[i] < 0){ rockX[i]=windowWidth; rockRegen(i); }
    if (rockX[i] > windowWidth){ rockX[i]=0; rockRegen(i); }
    if (rockY[i] < 0){ rockY[i]=windowHeight; rockRegen(i); }
    if (rockY[i] > windowHeight){ rockY[i]=0; rockRegen(i); }
  }
}

function hitRock() {
  if (iFrames === 0) {
    for (let i = 0; i < rockCount; i++) {
      if (rockSize[i] > 10) {
        let dx = shipX - rockX[i];
        let dy = shipY - rockY[i];
        if (sqrt(dx*dx + dy*dy) < (30+rockSize[i])/2) {
          lives--;
          if (lives < 1 && !gameOver) gameOver = 100;
          iFrames = 100;
          xSpeed = -xSpeed; ySpeed = -ySpeed;
          shipX = windowWidth/2; shipY = windowHeight/2;
        }
      }
    }
  }
  if (iFrames > 0) iFrames--;
}

function laserHit() {
  for (let i = 0; i < laserNum; i++) {
    if (laserVis[i]) {
      for (let j = 0; j < rockCount; j++) {
        if (rockSize[j] > 0) {
          let dx = laserX[i]-rockX[j];
          let dy = laserY[i]-rockY[j];
          if (sqrt(dx*dx+dy*dy)<(10+rockSize[j])/2) {
            laserVis[i]=false;
            rockSize[j]-=10;
            money+=floor(random(5,100));
            rockRegen(j);
          }
        }
      }
    }
  }
}

// ------------------------------ DEBT ROCKS ------------------------------ //

function drawDebtRock() {
  for (let i = 0; i < debtRockCount; i++) {
    fill(255,60,48);
    circle(debtRockX[i], debtRockY[i], debtRockSize[i]);
  }
}

function debtRockRegen(i) {
  if (debtRockSize[i]<10) {
    debtRockSize[i]=round(random(3,10)*10);
    debtRockX[i]=random(windowWidth);
    debtRockY[i]=random(windowHeight);
  }
}

function moveDebtRock() {
  for (let i = 0; i < debtRockCount; i++) {
    debtRockX[i]+=debtRockXSpeed[i];
    debtRockY[i]+=debtRockYSpeed[i];
    if (debtRockX[i]<0){debtRockX[i]=windowWidth; debtRockRegen(i);}
    if (debtRockX[i]>windowWidth){debtRockX[i]=0; debtRockRegen(i);}
    if (debtRockY[i]<0){debtRockY[i]=windowHeight; debtRockRegen(i);}
    if (debtRockY[i]>windowHeight){debtRockY[i]=0; debtRockRegen(i);}
  }
}

function laserHitDebt() {
  for (let i = 0; i < laserNum; i++) {
    if (laserVis[i]) {
      for (let j = 0; j < debtRockCount; j++) {
        if (debtRockSize[j]>0){
          let dx = laserX[i]-debtRockX[j];
          let dy = laserY[i]-debtRockY[j];
          if (sqrt(dx*dx+dy*dy)<(10+debtRockSize[j])/2){
            laserVis[i]=false;
            debtRockSize[j]-=10;
            money+=floor(random(5,100));
            debtRockRegen(j);
          }
        }
      }
    }
  }
}

function hitDebtRock() {
  for (let i = 0; i < debtRockCount; i++) {
    if (debtRockSize[i] > 10){
      let dx = shipX-debtRockX[i];
      let dy = shipY-debtRockY[i];
      if (sqrt(dx*dx+dy*dy)<(30+debtRockSize[i])/2){
        money -= 100;
        if(money<-2000 && bankrupt===0) bankrupt=100;
        iFrames=100;
        xSpeed=-xSpeed; ySpeed=-ySpeed;
        shipX=windowWidth/2; shipY=windowHeight/2;
      }
    }
  }
}

function reset() {
  lives = 3; iFrames=0; xSpeed=ySpeed=0; shipX=windowWidth/2; shipY=windowHeight/2; money=0;
  for(let i=0;i<laserNum;i++){laserVis[i]=false; laserX[i]=-100; laserY[i]=-100; laserTime[i]=0;}
  for(let i=0;i<rockCount;i++){rockSize[i]=round(random(3,10)*10); rockX[i]=random(windowWidth); rockY[i]=random(windowHeight);}
  for(let i=0;i<debtRockCount;i++){debtRockSize[i]=round(random(3,10)*10); debtRockX[i]=random(windowWidth); debtRockY[i]=random(windowHeight);}
}

function drawHUD() {
  for (let i=0;i<lives;i++){
    push(); translate(30+(i*40),30); scale(0.6);
    fill(100,150,200); triangle(20,20,-20,20,0,-20);
    fill(255,0,0); triangle(5,-10,-5,-10,0,-20);
    pop();
  }
  fill(255); textSize(20); textAlign(CENTER); text("money: "+money,windowWidth/2,40);
  textAlign(LEFT); text("CD: "+cooldown,10,50);
}

function utility(){
  FPS=round(frameRate());
  fill(255); textSize(16); text("FPS: "+FPS,10,20);
}

// ================================== END of Asteroids Game ====================================== //
