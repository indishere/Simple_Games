
// ------------------- BY CHATGPT ------------------- //


/*
  Asteroids: Debt Collector Edition
  Simple, production-ready p5.js single-file implementation.

  Usage:
    1) Include p5.js in your HTML (https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.5.0/p5.min.js)
    2) Drop this file in the same folder and include it after p5.js
    3) Keys: A/D or Left/Right to rotate, W or Up to boost, SPACE to shoot, R to restart

  Notes:
    - Uses simple classes (Ship, Rock, Laser) instead of parallel arrays.
    - Clear config object for tunable values.
    - Prevents accidental restart while holding shoot key.
    - Minimal and readable; easy to extend.
*/

// ------------------------- CONFIG -------------------------
const CFG = {
  canvasPadding: 0,
  fps: 144,

  ship: {
    rotSpeed: 4,       // degrees per frame
    thrust: 0.16,
    drag: 0.015,
    radius: 18
  },

  laser: {
    max: 6,
    speed: 28,
    life: 90,          // frames
    cooldown: 10       // frames
  },

  rocks: {
    moneyCount: 6,
    debtCount: 6,
    sizeMin: 20,
    sizeMax: 80,
    debtSizeMin: 30,
    debtSizeMax: 100,
    speedMax: 5,
    debtSpeedMax: 6,
    chipAmount: 12
  },

  gameplay: {
    startMoney: 2500,
    bankruptThreshold: -2500,
    debtCollisionLoss: 100,
    iFrames: 90,
    startLives: 3
  }
};

// ------------------------- UTIL -------------------------
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ------------------------- CLASSES -------------------------
class Ship {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.dir = -90; // pointing up (-90 degrees with p5 default)
    this.iFrames = 0;
  }

  reset(x, y) {
    this.x = x; this.y = y; this.vx = this.vy = 0; this.dir = -90; this.iFrames = 0;
  }

  update(input) {
    // rotation
    if (input.left) this.dir -= CFG.ship.rotSpeed;
    if (input.right) this.dir += CFG.ship.rotSpeed;

    // caching trig
    const s = sin(this.dir);
    const c = cos(this.dir);

    // thrust
    if (input.boost) {
      this.vx += CFG.ship.thrust * c; // note: p5 uses degrees, and cos/sin consistent here
      this.vy += CFG.ship.thrust * s;
    } else {
      // apply drag
      this.vx -= this.vx * CFG.ship.drag;
      this.vy -= this.vy * CFG.ship.drag;
    }

    // apply position
    this.x += this.vx;
    this.y += this.vy;

    // screen wrap
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    if (this.iFrames > 0) this.iFrames--;
  }

  draw(input) {
    push();
    translate(this.x, this.y);
    rotate(this.dir + 90); // rotate triangle so it points along dir
    noStroke();

    // flicker when invulnerable
    if (this.iFrames === 0 || (this.iFrames % 10 < 5)) {
      fill(100, 150, 200);
      triangle(0, -CFG.ship.radius, -CFG.ship.radius, CFG.ship.radius, CFG.ship.radius, CFG.ship.radius);
      fill(200, 50, 50);
      triangle(0, -CFG.ship.radius/2, -CFG.ship.radius/6, 0, CFG.ship.radius/6, 0);
    }

    // thruster
    if (input.boost) {
      fill(255, 165, 0, 200);
      triangle(-6, CFG.ship.radius, 6, CFG.ship.radius, 0, CFG.ship.radius + random(12, 22));
    }

    pop();
  }

  getRadius() { return CFG.ship.radius; }
}

class Laser {
  constructor(x, y, dir) {
    this.x = x; this.y = y;
    this.dir = dir;
    this.vx = CFG.laser.speed * cos(dir);
    this.vy = CFG.laser.speed * sin(dir);
    this.life = CFG.laser.life;
    this.active = true;
  }

  update() {
    this.x += this.vx; this.y += this.vy;
    this.life--;
    if (this.life <= 0) this.active = false;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw() {
    if (!this.active) return;
    push();
    translate(this.x, this.y);
    rotate(this.dir + 90);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, 4, 14);
    pop();
  }
}

class Rock {
  constructor(x, y, size, vx, vy, isDebt = false) {
    this.x = x; this.y = y;
    this.size = size;
    this.vx = vx; this.vy = vy;
    this.isDebt = isDebt;
  }

  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw() {
    noStroke();
    if (this.isDebt) fill(255, 60, 48);
    else fill(100, 150, 100);
    circle(this.x, this.y, this.size);
  }

  getRadius() { return this.size / 2; }
}

// ------------------------- GAME -------------------------
class Game {
  constructor() {
    this.ship = null;
    this.rocks = [];
    this.lasers = [];

    this.money = CFG.gameplay.startMoney;
    this.lives = CFG.gameplay.startLives;

    this.cooldown = 0;
    this.input = { left: false, right: false, boost: false, shoot: false };

    this.gameOver = false;
    this.bankrupt = false;

    this.shootHeld = false; // prevents automatic continuous registration when releasing death screen
  }

  start() {
    this.ship = new Ship(width/2, height/2);
    this.rocks = [];
    this.lasers = [];
    this.money = CFG.gameplay.startMoney;
    this.lives = CFG.gameplay.startLives;
    this.cooldown = 0;
    this.gameOver = false;
    this.bankrupt = false;

    // populate rocks
    for (let i = 0; i < CFG.rocks.moneyCount; i++) {
      this.rocks.push(this.randomRock(false));
    }
    for (let i = 0; i < CFG.rocks.debtCount; i++) {
      this.rocks.push(this.randomRock(true));
    }
  }

  randomRock(isDebt) {
    const smin = isDebt ? CFG.rocks.debtSizeMin : CFG.rocks.sizeMin;
    const smax = isDebt ? CFG.rocks.debtSizeMax : CFG.rocks.sizeMax;
    const vmax = isDebt ? CFG.rocks.debtSpeedMax : CFG.rocks.speedMax;
    const size = random(smin, smax);
    const vx = random(-vmax, vmax);
    const vy = random(-vmax, vmax);
    return new Rock(random(width), random(height), size, vx, vy, isDebt);
  }

  update() {
    if (this.gameOver || this.bankrupt) return;

    // Ship update
    this.ship.update(this.input);

    // Lasers update (and prune inactive)
    for (let l of this.lasers) l.update();
    this.lasers = this.lasers.filter(l => l.active);

    // Rocks update
    for (let r of this.rocks) r.update();

    // Collisions
    this.handleCollisions();

    // cooldown tick
    if (this.cooldown > 0) this.cooldown--;
  }

  draw() {
    background(10);

    // HUD
    this.drawHUD();

    // draw rocks
    for (let r of this.rocks) r.draw();

    // draw lasers
    for (let l of this.lasers) l.draw();

    // ship draw
    this.ship.draw(this.input);

    // end screen
    if (this.gameOver || this.bankrupt) this.drawEndScreen();
  }

  drawHUD() {
    fill(255);
    textSize(16);
    textAlign(LEFT);
    text(`Money: $${this.money}`, 10, 20);
    text(`Lives: ${this.lives}`, 10, 40);
    text(`Lasers: ${this.lasers.length}/${CFG.laser.max}`, 10, 60);
    text(`CD: ${this.cooldown}`, 10, 80);
    textAlign(RIGHT);
    text(`FPS: ${round(frameRate())}`, width - 10, 20);
  }

  drawEndScreen() {
    push();
    textAlign(CENTER);
    textSize(56);
    fill(240, 50, 50);
    text('GAME OVER', width/2, height/2 - 40);
    textSize(22);
    fill(255);
    if (this.bankrupt) text('You went bankrupt', width/2, height/2 + 10);
    else text(`Out of lives. Money: $${this.money}`, width/2, height/2 + 10);
    textSize(18);
    text('Press R to restart', width/2, height/2 + 50);
    pop();
  }

  handleCollisions() {
    // 1) Laser -> Rock
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const L = this.lasers[i];
      for (let j = this.rocks.length - 1; j >= 0; j--) {
        const R = this.rocks[j];
        const d = dist(L.x, L.y, R.x, R.y);
        if (d < R.getRadius() + 6) {
          // hit
          L.active = false;
          R.size -= CFG.rocks.chipAmount;
          // Add money whether it's debt or money rock (you "collect")
          this.money += floor(random(5, 100));
          if (R.size <= 10) {
            // replace with a fresh rock
            this.rocks[j] = this.randomRock(R.isDebt);
          }
          break; // laser consumed
        }
      }
    }

    // 2) Ship -> Rock
    if (this.ship.iFrames === 0) {
      for (let i = this.rocks.length - 1; i >= 0; i--) {
        const R = this.rocks[i];
        const d = dist(this.ship.x, this.ship.y, R.x, R.y);
        if (d < R.getRadius() + this.ship.getRadius()) {
          if (R.isDebt) {
            this.money -= CFG.gameplay.debtCollisionLoss;
            if (this.money < CFG.gameplay.bankruptThreshold) {
              this.bankrupt = true;
            }
          } else {
            this.lives--;
            if (this.lives <= 0) this.gameOver = true;
          }

          // hit reaction
          this.ship.iFrames = CFG.gameplay.iFrames;
          this.ship.vx *= -0.5; this.ship.vy *= -0.5;
          this.ship.x = width/2; this.ship.y = height/2;

          // if rock was small, respawn
          R.size -= CFG.rocks.chipAmount;
          if (R.size <= 10) this.rocks[i] = this.randomRock(R.isDebt);
        }
      }
    }
  }

  shoot() {
    if (this.cooldown > 0) return;
    if (this.lasers.length >= CFG.laser.max) return;

    this.lasers.push(new Laser(this.ship.x, this.ship.y, this.ship.dir));
    this.cooldown = CFG.laser.cooldown;
  }

  restart() {
    this.start();
  }
}

// ------------------------- GLOBALS -------------------------
let game;
let keys = {};

function setup() {
  createCanvas(windowWidth - CFG.canvasPadding, windowHeight - CFG.canvasPadding);
  angleMode(DEGREES);
  frameRate(CFG.fps);
  rectMode(CENTER);

  game = new Game();
  game.start();
}

function draw() {
  // translate(0.5, 0.5); // avoid subpixel artifacting if needed
  // map input to game
  game.input.left = keys['ArrowLeft'] || keys['a'];
  game.input.right = keys['ArrowRight'] || keys['d'];
  game.input.boost = keys['ArrowUp'] || keys['w'];

  // shoot logic: allow holding, but prevent accidental restart by gating shootHeld
  if ((keys[' '] || keys['Space']) && !game.shootHeld) {
    if (!game.gameOver && !game.bankrupt) game.shoot();
    game.shootHeld = true;
  }
  if (!keys[' '] && !keys['Space']) game.shootHeld = false;

  game.update();
  game.draw();
}

function windowResized() {
  resizeCanvas(windowWidth - CFG.canvasPadding, windowHeight - CFG.canvasPadding);
}

// key handling
function keyPressed() {
  keys[key] = true;

  // Prevent default page scroll for space/arrow keys
  if (key === ' ' || keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    return false;
  }

  // Restart with R
  if ((key === 'r' || key === 'R')) {
    game.restart();
  }
}

function keyReleased() {
  keys[key] = false;
}

// ensure graceful text fallback for older p5
window.addEventListener('keydown', (e) => {
  // map standardized values onto our keys map
  const k = e.key.length === 1 ? e.key : (e.code === 'Space' ? ' ' : e.key);
  keys[k] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  const k = e.key.length === 1 ? e.key : (e.code === 'Space' ? ' ' : e.key);
  keys[k] = false;
});
