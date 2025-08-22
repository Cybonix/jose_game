// Parachute Game - Web Version
// Complete implementation using Phaser 3

// Game configuration and constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GROUND_Y = GAME_HEIGHT - 20;

// Colors (Phaser format) - Enhanced palette
const COLORS = {
  SKY_BLUE: 0x87ceeb,
  SKY_GRADIENT_TOP: 0x4a90e2,
  SKY_GRADIENT_BOTTOM: 0x87ceeb,
  WHITE: 0xffffff,
  BLUE: 0x2196f3,
  PLAYER_BLUE: 0x1976d2,
  RED: 0xff4444,
  PARACHUTE_RED: 0xe53935,
  GREEN: 0x4caf50,
  OBSTACLE_GREEN: 0x2e7d32,
  BLACK: 0x000000,
  YELLOW: 0xffc107,
  WARNING_YELLOW: 0xff9800,
  BROWN: 0x8b4513,
  GROUND_BROWN: 0x5d4e37,
  SAFE_ZONE: 0x00e676,
  CLOUD_WHITE: 0xf5f5f5,
  PLANE_SILVER: 0xe0e0e0
};

// Game state
let gameState = {
  score: 0,
  gameOver: false,
  jumping: false,
  windDirection: 0,
  windTimer: 0,
  highScores: [],
  player: null,
  plane: null,
  obstacles: [],
  clouds: [],
  landingZones: [],
  cursors: null,
  spaceKey: null,
  rKey: null
};

// Sound management
class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this.audioContext = null;
    this.enabled = true;
    
    // Initialize Web Audio API for sound generation
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }
  
  // Generate a simple tone
  generateTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  // Play different sound effects
  playJump() {
    this.generateTone(440, 0.3, 'square');
  }
  
  playParachute() {
    this.generateTone(880, 0.5, 'sawtooth');
  }
  
  playCrash() {
    this.generateTone(220, 0.8, 'square');
  }
  
  playLanding() {
    this.generateTone(660, 0.4, 'sine');
  }
  
  playWind() {
    this.generateTone(110, 0.6, 'triangle');
  }
}

// Player class
class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.width = 40;
    this.height = 60;
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 1;
    this.gravity = 0.2;
    this.maxSpeed = 7;
    this.parachuteDeployed = false;
    this.parachuteWidth = 80;
    this.parachuteHeight = 40;
    this.alive = true;
    this.landed = false;
    this.wind = 0;
    this.parachuteDeployHeight = 0;
    
    // Create graphics objects
    this.graphics = scene.add.graphics();
    this.parachuteGraphics = scene.add.graphics();
  }
  
  deployParachute() {
    if (!this.parachuteDeployed) {
      this.parachuteDeployed = true;
      this.parachuteDeployHeight = this.y;
      this.gravity = 0.05;
      this.maxSpeed = 2;
      
      // Play parachute sound
      this.scene.soundManager.playParachute();
    }
  }
  
  update(cursors) {
    // Handle input
    if (cursors.left.isDown) {
      this.velocityX = Math.max(-3, this.velocityX - 0.2);
    } else if (cursors.right.isDown) {
      this.velocityX = Math.min(3, this.velocityX + 0.2);
    } else {
      // Gradually slow down
      if (this.velocityX > 0) {
        this.velocityX = Math.max(0, this.velocityX - 0.1);
      } else if (this.velocityX < 0) {
        this.velocityX = Math.min(0, this.velocityX + 0.1);
      }
    }
    
    // Apply wind effect when parachute is deployed
    if (this.parachuteDeployed) {
      this.velocityX += this.wind * 0.1;
    }
    
    // Update position
    this.x += this.velocityX;
    
    // Keep player within screen bounds
    if (this.x < 0) {
      this.x = 0;
      this.velocityX = 0;
    } else if (this.x > GAME_WIDTH - this.width) {
      this.x = GAME_WIDTH - this.width;
      this.velocityX = 0;
    }
    
    // Apply gravity
    if (!this.landed) {
      this.velocityY = Math.min(this.maxSpeed, this.velocityY + this.gravity);
      this.y += this.velocityY;
    }
  }
  
  checkCollision(obstacles) {
    const playerBounds = {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
    
    // Check obstacle collision
    for (let obstacle of obstacles) {
      const obstacleBounds = {
        left: obstacle.x,
        right: obstacle.x + obstacle.width,
        top: obstacle.y,
        bottom: obstacle.y + obstacle.height
      };
      
      if (playerBounds.right > obstacleBounds.left &&
          playerBounds.left < obstacleBounds.right &&
          playerBounds.bottom > obstacleBounds.top &&
          playerBounds.top < obstacleBounds.bottom) {
        
        this.scene.soundManager.playCrash();
        this.scene.screenShake(10, 300);  // Screen shake on crash
        this.scene.flashScreen(0xff0000, 150);  // Red flash
        this.alive = false;
        return true;
      }
    }
    
    // Check ground collision
    if (this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.landed = true;
      
      if (this.velocityY > 3) {
        // Too fast landing - crash
        this.scene.soundManager.playCrash();
        this.scene.screenShake(8, 250);
        this.scene.flashScreen(0xff0000, 120);
        this.alive = false;
      } else {
        // Safe landing
        this.scene.soundManager.playLanding();
        this.scene.screenShake(3, 100);  // Gentle shake for landing
        this.scene.flashScreen(0x00ff00, 80);  // Green flash for success
      }
      
      return this.landed;
    }
    
    return false;
  }
  
  draw() {
    // Clear previous graphics
    this.graphics.clear();
    this.parachuteGraphics.clear();
    
    if (this.parachuteDeployed) {
      // Draw parachute with enhanced graphics
      const parachuteX = this.x - (this.parachuteWidth - this.width) / 2;
      const parachuteY = this.y - this.parachuteHeight;
      
      // Parachute shadow
      this.parachuteGraphics.fillStyle(0x000000, 0.2);
      this.parachuteGraphics.fillEllipse(
        parachuteX + this.parachuteWidth / 2 + 2,
        parachuteY + this.parachuteHeight / 2 + 2,
        this.parachuteWidth,
        this.parachuteHeight
      );
      
      // Main parachute dome
      this.parachuteGraphics.fillStyle(COLORS.PARACHUTE_RED);
      this.parachuteGraphics.fillEllipse(
        parachuteX + this.parachuteWidth / 2,
        parachuteY + this.parachuteHeight / 2,
        this.parachuteWidth,
        this.parachuteHeight
      );
      
      // Parachute panels with gradient effect
      const panelWidth = this.parachuteWidth / 6;
      for (let i = 0; i < 6; i++) {
        const panelX = parachuteX + i * panelWidth;
        this.parachuteGraphics.lineStyle(2, COLORS.WHITE, 0.8);
        this.parachuteGraphics.lineBetween(
          panelX + panelWidth / 2,
          parachuteY + 5,
          panelX + panelWidth / 2,
          parachuteY + this.parachuteHeight - 5
        );
      }
      
      // Enhanced parachute strings with physics
      this.parachuteGraphics.lineStyle(3, COLORS.BLACK, 0.9);
      // Main strings
      this.parachuteGraphics.lineBetween(
        this.x + 8, this.y + 5,
        parachuteX + 15, parachuteY + this.parachuteHeight - 8
      );
      this.parachuteGraphics.lineBetween(
        this.x + this.width - 8, this.y + 5,
        parachuteX + this.parachuteWidth - 15, parachuteY + this.parachuteHeight - 8
      );
      
      // Additional support strings
      this.parachuteGraphics.lineStyle(2, COLORS.BLACK, 0.7);
      this.parachuteGraphics.lineBetween(
        this.x + 15, this.y + 8,
        parachuteX + this.parachuteWidth / 3, parachuteY + this.parachuteHeight - 5
      );
      this.parachuteGraphics.lineBetween(
        this.x + this.width - 15, this.y + 8,
        parachuteX + (2 * this.parachuteWidth) / 3, parachuteY + this.parachuteHeight - 5
      );
    }
    
    // Player shadow
    this.graphics.fillStyle(0x000000, 0.3);
    this.graphics.fillRoundedRect(this.x + 2, this.y + 2, this.width, this.height, 5);
    
    // Draw enhanced player
    if (this.alive) {
      // Player jumpsuit with gradient effect
      this.graphics.fillStyle(COLORS.PLAYER_BLUE);
    } else {
      // Crashed player
      this.graphics.fillStyle(COLORS.RED);
    }
    
    this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 5);
    
    // Add jumpsuit details
    if (this.alive) {
      this.graphics.lineStyle(2, COLORS.WHITE, 0.8);
      // Zipper line
      this.graphics.lineBetween(
        this.x + this.width / 2,
        this.y + 10,
        this.x + this.width / 2,
        this.y + this.height - 10
      );
    }
    
    // Enhanced helmet with visor
    this.graphics.fillStyle(COLORS.WHITE);
    this.graphics.fillEllipse(this.x + this.width / 2, this.y + 8, this.width - 8, 18);
    
    // Helmet visor
    this.graphics.fillStyle(0x333333, 0.7);
    this.graphics.fillEllipse(this.x + this.width / 2, this.y + 8, this.width - 12, 14);
    
    // Draw enhanced face
    if (this.alive) {
      // Eyes with better detail
      this.graphics.fillStyle(COLORS.BLACK);
      this.graphics.fillCircle(this.x + 13, this.y + 12, 2);
      this.graphics.fillCircle(this.x + 27, this.y + 12, 2);
      
      // Eye highlights
      this.graphics.fillStyle(COLORS.WHITE);
      this.graphics.fillCircle(this.x + 14, this.y + 11, 1);
      this.graphics.fillCircle(this.x + 28, this.y + 11, 1);
      
      // Happy mouth
      this.graphics.lineStyle(2, COLORS.BLACK);
      this.graphics.strokeCircle(this.x + 20, this.y + 16, 8, 0, Math.PI);
      
    } else {
      // X eyes for crashed state
      this.graphics.lineStyle(3, COLORS.BLACK);
      // Left eye X
      this.graphics.lineBetween(this.x + 11, this.y + 10, this.x + 15, this.y + 14);
      this.graphics.lineBetween(this.x + 15, this.y + 10, this.x + 11, this.y + 14);
      // Right eye X
      this.graphics.lineBetween(this.x + 25, this.y + 10, this.x + 29, this.y + 14);
      this.graphics.lineBetween(this.x + 29, this.y + 10, this.x + 25, this.y + 14);
      
      // Sad mouth
      this.graphics.strokeCircle(this.x + 20, this.y + 20, 6, Math.PI, 2 * Math.PI);
    }
    
    // Enhanced limbs with better positioning
    this.graphics.lineStyle(4, this.alive ? COLORS.PLAYER_BLUE : COLORS.RED);
    
    if (this.parachuteDeployed) {
      // Arms up holding parachute strings
      this.graphics.lineBetween(this.x + 8, this.y + 25, this.x - 2, this.y + 5);
      this.graphics.lineBetween(this.x + this.width - 8, this.y + 25, this.x + this.width + 2, this.y + 5);
    } else {
      // Skydiving position with spread arms
      this.graphics.lineBetween(this.x + 8, this.y + 25, this.x - 8, this.y + 20);
      this.graphics.lineBetween(this.x + this.width - 8, this.y + 25, this.x + this.width + 8, this.y + 20);
    }
    
    // Legs with boots
    this.graphics.lineBetween(this.x + 15, this.y + this.height, this.x + 12, this.y + this.height + 12);
    this.graphics.lineBetween(this.x + 25, this.y + this.height, this.x + 28, this.y + this.height + 12);
    
    // Boots
    this.graphics.fillStyle(COLORS.BLACK);
    this.graphics.fillCircle(this.x + 12, this.y + this.height + 12, 4);
    this.graphics.fillCircle(this.x + 28, this.y + this.height + 12, 4);
  }
  
  destroy() {
    this.graphics.destroy();
    this.parachuteGraphics.destroy();
  }
}

// Plane class
class Plane {
  constructor(scene) {
    this.scene = scene;
    this.width = 100;
    this.height = 30;
    this.x = -this.width;
    this.y = 30;
    this.speed = 3;
    this.active = true;
    this.graphics = scene.add.graphics();
  }
  
  update() {
    if (this.active) {
      this.x += this.speed;
      
      if (this.x > GAME_WIDTH) {
        this.x = -this.width;
        this.active = false;
      }
    }
  }
  
  draw() {
    this.graphics.clear();
    
    if (this.active) {
      // Plane shadow
      this.graphics.fillStyle(0x000000, 0.2);
      this.graphics.fillRoundedRect(this.x + 2, this.y + 2, this.width, this.height, 8);
      
      // Main plane body with metallic look
      this.graphics.fillStyle(COLORS.PLANE_SILVER);
      this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 8);
      
      // Plane body highlight
      this.graphics.fillStyle(COLORS.WHITE, 0.6);
      this.graphics.fillRoundedRect(this.x + 5, this.y + 2, this.width - 10, 8, 4);
      
      // Enhanced wings with depth
      this.graphics.fillStyle(COLORS.PLANE_SILVER);
      this.graphics.fillTriangle(
        this.x + 25, this.y,
        this.x + 50, this.y - 18,
        this.x + 75, this.y + 5
      );
      
      // Wing highlight
      this.graphics.fillStyle(COLORS.WHITE, 0.4);
      this.graphics.fillTriangle(
        this.x + 30, this.y,
        this.x + 45, this.y - 12,
        this.x + 60, this.y + 2
      );
      
      // Enhanced tail
      this.graphics.fillStyle(COLORS.PLANE_SILVER);
      this.graphics.fillTriangle(
        this.x + this.width - 25, this.y,
        this.x + this.width - 12, this.y - 18,
        this.x + this.width - 5, this.y + 5
      );
      
      // Cockpit windows with reflection
      this.graphics.fillStyle(0x4a90e2);
      for (let i = 0; i < 4; i++) {
        this.graphics.fillEllipse(this.x + 25 + i * 15, this.y + this.height / 2, 8, 12);
        // Window reflection
        this.graphics.fillStyle(COLORS.WHITE, 0.3);
        this.graphics.fillEllipse(this.x + 25 + i * 15 - 2, this.y + this.height / 2 - 3, 4, 6);
        this.graphics.fillStyle(0x4a90e2);
      }
      
      // Propeller (animated blur effect)
      this.graphics.fillStyle(0x666666, 0.5);
      this.graphics.fillEllipse(this.x + 8, this.y + this.height / 2, 12, 6);
      
      // Engine details
      this.graphics.fillStyle(0x333333);
      this.graphics.fillCircle(this.x + 8, this.y + this.height / 2, 4);
    }
  }
  
  destroy() {
    this.graphics.destroy();
  }
}

// Obstacle class
class Obstacle {
  constructor(scene, x, width, height) {
    this.scene = scene;
    this.x = x;
    this.width = width;
    this.height = height;
    this.y = GROUND_Y - height;
    this.graphics = scene.add.graphics();
  }
  
  draw() {
    this.graphics.clear();
    
    // Obstacle shadow
    this.graphics.fillStyle(0x000000, 0.3);
    this.graphics.fillRoundedRect(this.x + 2, this.y + 2, this.width, this.height, 8);
    
    // Main obstacle with gradient effect
    this.graphics.fillStyle(COLORS.OBSTACLE_GREEN);
    this.graphics.fillRoundedRect(this.x, this.y, this.width, this.height, 8);
    
    // Obstacle highlight
    this.graphics.fillStyle(COLORS.GREEN, 0.6);
    this.graphics.fillRoundedRect(this.x + 3, this.y + 3, this.width - 6, 12, 4);
    
    // Enhanced warning markers with better visibility
    const markerHeight = 15;
    for (let i = 0; i < this.width; i += 20) {
      if (Math.floor(i / 20) % 2 === 0) {
        // Warning stripes
        this.graphics.fillStyle(COLORS.WARNING_YELLOW);
        this.graphics.fillRoundedRect(this.x + i, this.y, Math.min(20, this.width - i), markerHeight, 2);
        
        // Black diagonal stripes for hazard effect
        this.graphics.lineStyle(2, COLORS.BLACK, 0.8);
        for (let j = 0; j < 20; j += 6) {
          this.graphics.lineBetween(
            this.x + i + j, this.y,
            this.x + i + j + 4, this.y + markerHeight
          );
        }
      }
    }
    
    // Danger symbol on larger obstacles
    if (this.width > 50) {
      this.graphics.fillStyle(COLORS.RED);
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      
      // Exclamation mark
      this.graphics.fillRoundedRect(centerX - 2, centerY - 15, 4, 20, 2);
      this.graphics.fillCircle(centerX, centerY + 10, 3);
    }
  }
  
  destroy() {
    this.graphics.destroy();
  }
}

// Cloud class
class Cloud {
  constructor(scene) {
    this.scene = scene;
    this.width = Phaser.Math.Between(50, 150);
    this.height = Phaser.Math.Between(30, 60);
    this.x = Phaser.Math.Between(0, GAME_WIDTH);
    this.y = Phaser.Math.Between(50, 200);
    this.speed = Phaser.Math.FloatBetween(0.2, 1.0);
    this.graphics = scene.add.graphics();
  }
  
  update() {
    this.x += this.speed;
    if (this.x > GAME_WIDTH) {
      this.x = -this.width;
      this.y = Phaser.Math.Between(50, 200);
    }
  }
  
  draw() {
    this.graphics.clear();
    
    // Cloud shadow
    this.graphics.fillStyle(0x000000, 0.1);
    this.graphics.fillEllipse(this.x + this.width / 2 + 3, this.y + this.height / 2 + 3, this.width, this.height);
    
    // Main cloud body with subtle gradient
    this.graphics.fillStyle(COLORS.CLOUD_WHITE);
    this.graphics.fillEllipse(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
    
    // Cloud highlights for 3D effect
    this.graphics.fillStyle(COLORS.WHITE, 0.8);
    this.graphics.fillEllipse(
      this.x + this.width * 0.3,
      this.y + this.height * 0.3,
      this.width * 0.7,
      this.height * 0.7
    );
    
    // Additional cloud puffs with varying opacity
    this.graphics.fillStyle(COLORS.CLOUD_WHITE, 0.9);
    this.graphics.fillEllipse(
      this.x + this.width * 0.7,
      this.y + this.height * 0.2,
      this.width * 0.6,
      this.height * 0.6
    );
    
    this.graphics.fillStyle(COLORS.CLOUD_WHITE, 0.8);
    this.graphics.fillEllipse(
      this.x + this.width * 0.1,
      this.y + this.height * 0.6,
      this.width * 0.5,
      this.height * 0.5
    );
    
    // Cloud edge highlights
    this.graphics.fillStyle(COLORS.WHITE, 0.4);
    this.graphics.fillEllipse(
      this.x + this.width * 0.2,
      this.y + this.height * 0.1,
      this.width * 0.3,
      this.height * 0.3
    );
  }
  
  destroy() {
    this.graphics.destroy();
  }
}

// Utility functions
function createObstacles(scene) {
  const obstacles = [];
  const numObstacles = Phaser.Math.Between(5, 8);
  const positions = [];
  
  // Generate random positions
  for (let i = 0; i < numObstacles; i++) {
    positions.push(Phaser.Math.Between(100, GAME_WIDTH - 100));
  }
  positions.sort((a, b) => a - b);
  
  // Create obstacles
  for (let pos of positions) {
    const width = Phaser.Math.Between(30, 80);
    const height = Phaser.Math.Between(40, 100);
    obstacles.push(new Obstacle(scene, pos, width, height));
  }
  
  return obstacles;
}

function createLandingZones(scene, obstacles) {
  const landingZones = [];
  
  // Sort obstacles by x position
  const sortedObstacles = obstacles.slice().sort((a, b) => a.x - b.x);
  
  // Add landing zone before first obstacle
  if (sortedObstacles.length > 0 && sortedObstacles[0].x > 100) {
    const width = Math.min(100, sortedObstacles[0].x - 50);
    landingZones.push({
      x: sortedObstacles[0].x - width - 10,
      y: GROUND_Y - 10,
      width: width,
      height: 10
    });
  }
  
  // Add landing zones between obstacles
  for (let i = 0; i < sortedObstacles.length - 1; i++) {
    const gap = sortedObstacles[i + 1].x - (sortedObstacles[i].x + sortedObstacles[i].width);
    if (gap > 80) {
      const zoneWidth = Math.min(gap - 20, 100);
      const zoneX = sortedObstacles[i].x + sortedObstacles[i].width + (gap - zoneWidth) / 2;
      landingZones.push({
        x: zoneX,
        y: GROUND_Y - 10,
        width: zoneWidth,
        height: 10
      });
    }
  }
  
  // Add landing zone after last obstacle
  if (sortedObstacles.length > 0) {
    const lastObstacle = sortedObstacles[sortedObstacles.length - 1];
    if (lastObstacle.x + lastObstacle.width < GAME_WIDTH - 100) {
      const width = Math.min(100, GAME_WIDTH - (lastObstacle.x + lastObstacle.width) - 50);
      landingZones.push({
        x: lastObstacle.x + lastObstacle.width + 10,
        y: GROUND_Y - 10,
        width: width,
        height: 10
      });
    }
  }
  
  return landingZones;
}

function updateWind() {
  gameState.windTimer--;
  if (gameState.windTimer <= 0) {
    gameState.windTimer = Phaser.Math.Between(180, 360); // 3-6 seconds at 60 FPS
    gameState.windDirection = Phaser.Math.FloatBetween(-1, 1);
    if (gameState.player) {
      gameState.player.wind = gameState.windDirection;
    }
  }
}

function calculateScore() {
  if (!gameState.player.alive) return 0;
  
  // Base score from landing position
  let landingScore = 1000;
  for (let obstacle of gameState.obstacles) {
    landingScore -= Math.abs(gameState.player.x - (obstacle.x + obstacle.width / 2)) / gameState.obstacles.length;
  }
  
  // Bonus for landing in safe zone
  const playerCenterX = gameState.player.x + gameState.player.width / 2;
  for (let zone of gameState.landingZones) {
    if (playerCenterX >= zone.x && playerCenterX <= zone.x + zone.width) {
      landingScore += 500;
      break;
    }
  }
  
  // Speed bonus for deploying parachute later
  const timeBonus = Math.max(0, 200 - gameState.player.parachuteDeployHeight);
  
  return Math.max(0, Math.floor(landingScore + timeBonus));
}

function loadHighScores() {
  try {
    const scores = localStorage.getItem('parachute_high_scores');
    return scores ? JSON.parse(scores) : [];
  } catch (e) {
    console.warn('Could not load high scores:', e);
    return [];
  }
}

function saveHighScores(scores) {
  try {
    localStorage.setItem('parachute_high_scores', JSON.stringify(scores));
  } catch (e) {
    console.warn('Could not save high scores:', e);
  }
}

function updateHighScores(newScore) {
  if (gameState.player.alive) {
    gameState.highScores.push(newScore);
    gameState.highScores.sort((a, b) => b - a);
    gameState.highScores = gameState.highScores.slice(0, 10);
    saveHighScores(gameState.highScores);
  }
}

function resetGame(scene) {
  // Clean up existing objects
  if (gameState.player) gameState.player.destroy();
  if (gameState.plane) gameState.plane.destroy();
  
  gameState.obstacles.forEach(obstacle => obstacle.destroy());
  gameState.clouds.forEach(cloud => cloud.destroy());
  
  // Reset game state
  gameState.score = 0;
  gameState.gameOver = false;
  gameState.jumping = false;
  gameState.windDirection = 0;
  gameState.windTimer = 0;
  
  // Create new game objects
  gameState.player = new Player(scene, GAME_WIDTH / 2, 50);
  gameState.plane = new Plane(scene);
  gameState.obstacles = createObstacles(scene);
  gameState.landingZones = createLandingZones(scene, gameState.obstacles);
  
  // Create clouds
  gameState.clouds = [];
  for (let i = 0; i < 5; i++) {
    gameState.clouds.push(new Cloud(scene));
  }
}

// Phaser scene functions
function preload() {
  // No assets to preload - we're using generated graphics
}

function create() {
  // Initialize sound manager
  this.soundManager = new SoundManager(this);
  
  // Set up input
  gameState.cursors = this.input.keyboard.createCursorKeys();
  gameState.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  gameState.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  
  // Load high scores
  gameState.highScores = loadHighScores();
  
  // Initialize game
  resetGame(this);
  
  // UI Text objects with enhanced styling and proper positioning
  this.windText = this.add.text(20, 20, '', { 
    font: '18px Orbitron', 
    fill: '#ffffff',
    stroke: '#000000',
    strokeThickness: 1
  });
  
  this.scoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, '', { 
    font: 'bold 28px Orbitron', 
    fill: '#ffffff',
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(0.5);
  
  this.gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '', { 
    font: 'bold 42px Orbitron', 
    fill: '#ffffff',
    stroke: '#000000',
    strokeThickness: 2,
    align: 'center'
  }).setOrigin(0.5);
  
  this.highScoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, '', { 
    font: '18px Orbitron', 
    fill: '#87ceeb',
    stroke: '#000000',
    strokeThickness: 1,
    align: 'center',
    lineSpacing: 6
  }).setOrigin(0.5);
  
  this.restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', { 
    font: 'bold 20px Orbitron', 
    fill: '#ffff00',
    stroke: '#000000',
    strokeThickness: 2,
    align: 'center'
  }).setOrigin(0.5);
  
  // Camera effects
  this.cameras.main.setRoundPixels(true);
  
  // Screen shake function
  this.screenShake = (intensity = 5, duration = 200) => {
    this.cameras.main.shake(duration, intensity);
  };
  
  // Flash effect function
  this.flashScreen = (color = 0xffffff, duration = 100) => {
    this.cameras.main.flash(duration, color >> 16, (color >> 8) & 0xff, color & 0xff);
  };
}

function update() {
  // Update wind
  updateWind();
  
  // Update plane
  gameState.plane.update();
  
  // Update clouds
  gameState.clouds.forEach(cloud => cloud.update());
  
  // Check if player should jump from plane
  if (!gameState.jumping && gameState.plane.x + gameState.plane.width / 2 > GAME_WIDTH / 3) {
    gameState.jumping = true;
    gameState.player.x = gameState.plane.x + gameState.plane.width / 2;
    gameState.player.y = gameState.plane.y + gameState.plane.height;
    
    // Play jump sound
    this.soundManager.playJump();
  }
  
  // Update player if jumping and game not over
  if (gameState.jumping && !gameState.gameOver && gameState.player.alive) {
    // Handle parachute deployment
    if (Phaser.Input.Keyboard.JustDown(gameState.spaceKey) && !gameState.player.parachuteDeployed) {
      gameState.player.deployParachute();
    }
    
    // Update player
    gameState.player.update(gameState.cursors);
    
    // Check collisions
    if (gameState.player.checkCollision(gameState.obstacles)) {
      gameState.gameOver = true;
      
      if (gameState.player.landed && gameState.player.alive) {
        gameState.score = calculateScore();
        updateHighScores(gameState.score);
      }
    }
  }
  
  // Handle restart
  if (gameState.gameOver && Phaser.Input.Keyboard.JustDown(gameState.rKey)) {
    resetGame(this);
  }
  
  // Draw everything
  drawGame(this);
  
  // Update UI
  updateUI(this);
}

function drawGame(scene) {
  // Enhanced background with gradient sky
  scene.cameras.main.setBackgroundColor(COLORS.SKY_GRADIENT_TOP);
  
  // Draw atmospheric layers for depth
  if (!scene.backgroundGraphics) {
    scene.backgroundGraphics = scene.add.graphics();
  }
  scene.backgroundGraphics.clear();
  
  // Sky gradient layers
  const gradientSteps = 10;
  for (let i = 0; i < gradientSteps; i++) {
    const alpha = 0.1 - (i * 0.01);
    const y = (GAME_HEIGHT / gradientSteps) * i;
    const height = GAME_HEIGHT / gradientSteps;
    
    scene.backgroundGraphics.fillStyle(COLORS.SKY_GRADIENT_BOTTOM, alpha);
    scene.backgroundGraphics.fillRect(0, y, GAME_WIDTH, height);
  }
  
  // Draw clouds first (background layer)
  gameState.clouds.forEach(cloud => cloud.draw());
  
  // Draw plane
  gameState.plane.draw();
  
  // Enhanced ground with texture
  if (!scene.groundGraphics) {
    scene.groundGraphics = scene.add.graphics();
  }
  scene.groundGraphics.clear();
  
  // Ground shadow/depth
  scene.groundGraphics.fillStyle(0x000000, 0.3);
  scene.groundGraphics.fillRect(0, GROUND_Y + 2, GAME_WIDTH, 22);
  
  // Main ground
  scene.groundGraphics.fillStyle(COLORS.GROUND_BROWN);
  scene.groundGraphics.fillRect(0, GROUND_Y, GAME_WIDTH, 20);
  
  // Ground texture lines
  scene.groundGraphics.lineStyle(1, 0x3e2723, 0.5);
  for (let i = 0; i < GAME_WIDTH; i += 30) {
    scene.groundGraphics.lineBetween(i, GROUND_Y + 2, i + 15, GROUND_Y + 18);
  }
  
  // Enhanced landing zones with better visibility
  if (!scene.landingZoneGraphics) {
    scene.landingZoneGraphics = scene.add.graphics();
  }
  scene.landingZoneGraphics.clear();
  
  gameState.landingZones.forEach((zone, index) => {
    // Pulsing safe zone effect
    const pulseAlpha = 0.4 + 0.2 * Math.sin(Date.now() * 0.005 + index);
    
    // Zone background with pulse
    scene.landingZoneGraphics.fillStyle(COLORS.SAFE_ZONE, pulseAlpha);
    scene.landingZoneGraphics.fillRect(zone.x, zone.y, zone.width, zone.height);
    
    // Zone border with glow effect
    scene.landingZoneGraphics.lineStyle(4, COLORS.SAFE_ZONE, 0.8);
    scene.landingZoneGraphics.strokeRect(zone.x - 2, zone.y - 2, zone.width + 4, zone.height + 4);
    
    // Enhanced ground marking
    scene.landingZoneGraphics.lineStyle(5, COLORS.WHITE, 0.9);
    scene.landingZoneGraphics.lineBetween(zone.x, GROUND_Y, zone.x + zone.width, GROUND_Y);
    
    // Safety indicators (chevrons)
    const chevronCount = Math.floor(zone.width / 20);
    scene.landingZoneGraphics.lineStyle(2, COLORS.WHITE, 0.7);
    for (let i = 0; i < chevronCount; i++) {
      const chevronX = zone.x + 10 + (i * 20);
      scene.landingZoneGraphics.lineBetween(chevronX - 5, GROUND_Y - 8, chevronX, GROUND_Y - 3);
      scene.landingZoneGraphics.lineBetween(chevronX, GROUND_Y - 3, chevronX + 5, GROUND_Y - 8);
    }
    
    // "SAFE" text with better styling
    if (!scene.safeTexts) scene.safeTexts = [];
    if (!scene.safeTexts[index]) {
      scene.safeTexts[index] = scene.add.text(0, 0, 'SAFE', {
        font: 'bold 14px Orbitron',
        fill: '#ffffff',
        stroke: '#00e676',
        strokeThickness: 2
      }).setOrigin(0.5);
    }
    
    scene.safeTexts[index].setPosition(zone.x + zone.width / 2, GROUND_Y - 20);
    scene.safeTexts[index].setAlpha(0.8 + 0.2 * Math.sin(Date.now() * 0.008 + index));
  });
  
  // Draw obstacles (foreground)
  gameState.obstacles.forEach(obstacle => obstacle.draw());
  
  // Draw player if jumping
  if (gameState.jumping) {
    gameState.player.draw();
    
    // Add wind effect particles when parachute is deployed
    if (gameState.player.parachuteDeployed && Math.abs(gameState.windDirection) > 0.1) {
      if (!scene.windParticles) {
        scene.windParticles = scene.add.graphics();
      }
      scene.windParticles.clear();
      
      // Wind lines
      scene.windParticles.lineStyle(1, COLORS.WHITE, 0.3);
      const windStrength = Math.abs(gameState.windDirection) * 5;
      const windDir = gameState.windDirection > 0 ? 1 : -1;
      
      for (let i = 0; i < windStrength; i++) {
        const startX = Math.random() * GAME_WIDTH;
        const startY = Math.random() * (GAME_HEIGHT * 0.7);
        const length = 20 + Math.random() * 30;
        
        scene.windParticles.lineBetween(
          startX, startY,
          startX + (windDir * length), startY + 10
        );
      }
    }
  }
}

function updateUI(scene) {
  // Update external HTML elements
  const windDisplay = document.getElementById('wind-display');
  const altitudeDisplay = document.getElementById('altitude-display');
  const statusDisplay = document.getElementById('status-display');
  
  // Wind indicator
  if (windDisplay) {
    if (gameState.windDirection < -0.1) {
      windDisplay.textContent = '← ' + Math.floor(Math.abs(gameState.windDirection) * 5);
    } else if (gameState.windDirection > 0.1) {
      windDisplay.textContent = '→ ' + Math.floor(Math.abs(gameState.windDirection) * 5);
    } else {
      windDisplay.textContent = 'Calm';
    }
  }
  
  // Altitude
  if (altitudeDisplay && gameState.jumping && !gameState.gameOver) {
    altitudeDisplay.textContent = Math.max(0, Math.floor((GROUND_Y - gameState.player.y) / 10)) + 'm';
  } else if (altitudeDisplay) {
    altitudeDisplay.textContent = '---';
  }
  
  // Status
  if (statusDisplay) {
    if (gameState.gameOver) {
      statusDisplay.textContent = gameState.player.alive ? 'Landed!' : 'Crashed';
    } else if (gameState.jumping) {
      statusDisplay.textContent = gameState.player.parachuteDeployed ? 'Parachute' : 'Falling';
    } else {
      statusDisplay.textContent = 'Ready';
    }
  }
  
  // Clear previous in-game UI
  scene.windText.setText('');
  scene.scoreText.setText('');
  
  // Game over screen with improved layout and proper spacing
  if (gameState.gameOver) {
    // Main game over message - positioned higher
    if (gameState.player.alive) {
      scene.gameOverText.setText('MISSION SUCCESS!');
      scene.gameOverText.setStyle({
        font: 'bold 42px Orbitron',
        fill: '#00ff00',
        stroke: '#004400',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          stroke: true,
          fill: true
        }
      });
    } else {
      scene.gameOverText.setText('MISSION FAILED');
      scene.gameOverText.setStyle({
        font: 'bold 42px Orbitron',
        fill: '#ff0000',
        stroke: '#440000',
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          stroke: true,
          fill: true
        }
      });
    }
    // Position the main message higher up
    scene.gameOverText.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120);
    
    // Score display with proper spacing - positioned below main message
    if (gameState.player.alive && gameState.score > 0) {
      scene.scoreText.setText(`Final Score: ${gameState.score.toLocaleString()}`);
      scene.scoreText.setStyle({
        font: 'bold 28px Orbitron',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          stroke: true,
          fill: true
        }
      });
      scene.scoreText.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70);
      scene.scoreText.setOrigin(0.5);
    }
    
    // High scores with improved formatting and proper positioning
    if (gameState.highScores.length > 0) {
      let highScoreText = 'HIGH SCORES\n\n';
      gameState.highScores.slice(0, 5).forEach((score, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        highScoreText += `${medal} ${score.toLocaleString()}\n`;
      });
      
      scene.highScoreText.setText(highScoreText);
      scene.highScoreText.setStyle({
        font: '18px Orbitron',
        fill: '#87ceeb',
        stroke: '#000000',
        strokeThickness: 1,
        align: 'center',
        lineSpacing: 6,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          stroke: true,
          fill: true
        }
      });
      // Position high scores below the score, with proper spacing
      scene.highScoreText.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
    }
    
    // Restart instruction with better positioning - moved up from bottom
    scene.restartText.setText('Press [R] to Play Again');
    scene.restartText.setStyle({
      font: 'bold 20px Orbitron',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 2,
        stroke: true,
        fill: true
      }
    });
    // Position restart text well above the bottom to avoid cutoff
    scene.restartText.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    
  } else {
    // Clear game over UI
    scene.gameOverText.setText('');
    scene.scoreText.setText('');
    scene.highScoreText.setText('');
    scene.restartText.setText('');
  }
}

// Initialize the game
window.onload = function() {
  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.SKY_BLUE,
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    }
  };
  
  const game = new Phaser.Game(config);
};