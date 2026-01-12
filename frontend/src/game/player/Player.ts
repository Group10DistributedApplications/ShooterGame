import Phaser from "phaser";

export default class Player {
  public sprite: Phaser.GameObjects.Rectangle;
  public facing: "up" | "down" | "left" | "right" = "up";
  public speed: number = 200;
  private targetX: number | null = null;
  private targetY: number | null = null;
  private scene: Phaser.Scene;
  private manualControl: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, color = 0x00ff00, size = 30) {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, size, size, color);
    // Enable physics on the sprite
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // Shrink the body so it does not snag on wall corners
    body.setSize(size * 0.7, size * 0.7);
    body.setOffset((size - size * 0.7) / 2, (size - size * 0.7) / 2);
    body.setMaxVelocity(500, 500);
    this.targetX = x;
    this.targetY = y;
  }

  // Allows caller to bypass target chasing and drive velocity manually.
  setManualControl(enabled: boolean) {
    this.manualControl = enabled;
  }

  setPosition(x: number, y: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setVelocity(0, 0);
    this.targetX = x;
    this.targetY = y;
  }

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  // interpolate toward target each frame using velocity (respects collision)
  update(delta: number) {
    if (this.manualControl) return;
    if (this.targetX === null || this.targetY === null) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Stop if very close to target
    if (distance < 3) {
      body.setVelocity(0, 0);
      return;
    }

    // If we are pushing into a wall, stop and reset the target to avoid damping jitter
    if (body.blocked.none === false || body.wasTouching.none === false) {
      body.setVelocity(0, 0);
      this.targetX = this.sprite.x;
      this.targetY = this.sprite.y;
      return;
    }
    
    // Move using velocity (physics handles collision)
    const speed = Math.min(distance * 8, 400);
    body.setVelocity(
      (dx / distance) * speed,
      (dy / distance) * speed
    );
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
