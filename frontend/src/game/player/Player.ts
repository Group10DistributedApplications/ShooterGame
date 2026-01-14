import Phaser from "phaser";

export default class Player {
  public sprite: Phaser.GameObjects.Sprite;
  public facing: "up" | "down" | "left" | "right" = "up";
  public speed: number = 200;
  public hasSpeedBoost: boolean = false;
  public speedBoostTimer: number = 0;
  private baseMaxVelocity: number = 400;
  public lives: number = 3;
  public invulnerable: boolean = false;
  private targetX: number | null = null;
  private targetY: number | null = null;
  private livesText: Phaser.GameObjects.Text;
  private manualControl: boolean = false;
  private spriteHorizontal: string;
  private spriteVertical: string;

  constructor(scene: Phaser.Scene, x: number, y: number, spriteKey = "green", size = 32) {
    this.scene = scene;
    this.spriteHorizontal = `player-${spriteKey}`;
    this.spriteVertical = `player-${spriteKey}-topdown`;
    
    // Create sprite (start with horizontal)
    this.sprite = scene.add.sprite(x, y, this.spriteHorizontal);
    this.sprite.setDisplaySize(size, size);
    
    // Enable physics on the sprite
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // Shrink the body so it does not snag on wall corners
    body.setSize(size * 0.7, size * 0.7);
    body.setOffset((size - size * 0.7) / 2, (size - size * 0.7) / 2);
    body.setMaxVelocity(this.baseMaxVelocity, this.baseMaxVelocity);
    this.targetX = x;
    this.targetY = y;
    
    // Create lives text above the player
    this.livesText = scene.add.text(x, y - 25, `♥${this.lives}`, {
      font: "14px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  // Allows caller to bypass target chasing and drive velocity manually.
  setManualControl(enabled: boolean) {
    this.manualControl = enabled;
  }

  setPosition(x: number, y: number) {
    this.sprite.x = x;
    this.sprite.y = y;
    this.livesText.setPosition(x, y - 25);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.reset(x, y);
      body.setVelocity(0, 0);
    }
    // Update internal target so movement logic doesn't immediately override teleport
    this.targetX = x;
    this.targetY = y;
  }

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  reconcileServerPosition(serverX: number, serverY: number, teleportThreshold: number, smoothThreshold: number) {
    const dx = serverX - this.x;
    const dy = serverY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= teleportThreshold) {
      this.setTarget(serverX, serverY);
      return { action: "target" as const, dist };
    }
    if (dist <= smoothThreshold) {
      return { action: "smooth" as const, dist };
    }
    // large mismatch: immediate teleport
    this.setPosition(serverX, serverY);
    return { action: "teleport" as const, dist };
  }

  setLives(lives: number) {
    this.lives = lives;
    this.livesText.setText(`♥${lives}`);
    // Change color based on lives
    if (lives <= 1) {
      this.livesText.setColor("#ff0000");
    } else if (lives === 2) {
      this.livesText.setColor("#ffaa00");
    } else {
      this.livesText.setColor("#ffffff");
    }
  }

  setInvulnerable(invuln: boolean) {
    this.invulnerable = invuln;
    // Flash effect when invulnerable
    if (invuln) {
      this.sprite.setAlpha(0.5);
    } else {
      this.sprite.setAlpha(1.0);
    }
  }

  updateFacing(newFacing: "up" | "down" | "left" | "right") {
    if (this.facing === newFacing) return;
    this.facing = newFacing;
    
    // Switch between horizontal and vertical sprites
    if (newFacing === "left" || newFacing === "right") {
      this.sprite.setTexture(this.spriteHorizontal);
      this.sprite.setFlipY(false);
      this.sprite.setFlipX(newFacing === "left"); // FlipX = horizontal flip
    } else {
      this.sprite.setTexture(this.spriteVertical);
      this.sprite.setFlipX(false);
      this.sprite.setFlipY(newFacing === "down"); // FlipY = vertical flip
    }
  }

 

  // interpolate toward target each frame using velocity (respects collision)
  update(_delta: number) {
    if (this.manualControl) return;
    if (this.targetX === null || this.targetY === null) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update facing based on movement direction (even for small movements)
    if (distance > 1) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.updateFacing(dx > 0 ? "right" : "left");
      } else {
        this.updateFacing(dy > 0 ? "down" : "up");
      }
    }
    
    // Stop if very close to target
    if (distance < 3) {
      body.setVelocity(0, 0);
      return;
    }
    
    // Move using velocity (physics handles collision)
    // Apply speed boost multiplier if active
    const maxSpeed = this.hasSpeedBoost ? 400 * 1.5 : 400;
    const speed = Math.min(distance * 8, maxSpeed);
    body.setVelocity(
      (dx / distance) * speed,
      (dy / distance) * speed
    );
    
    // Update max velocity for physics engine
    const maxVel = this.hasSpeedBoost ? this.baseMaxVelocity * 1.5 : this.baseMaxVelocity;
    body.setMaxVelocity(maxVel, maxVel);
    
    this.livesText.setPosition(this.sprite.x, this.sprite.y - 25);
    
    // Flashing effect when invulnerable
    if (this.invulnerable) {
      const flash = Math.sin(Date.now() / 100) > 0;
      this.sprite.setAlpha(flash ? 0.3 : 0.7);
    }
  }

  destroy() {
    this.sprite.destroy();
    this.livesText.destroy();
  }

  // Move sprite and HUD without touching physics body (used during tweens)
  moveSpriteTo(x: number, y: number) {
    this.sprite.x = x;
    this.sprite.y = y;
    this.livesText.setPosition(x, y - 25);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
