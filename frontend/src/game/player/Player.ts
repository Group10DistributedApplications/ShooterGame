import Phaser from "phaser";

export default class Player {
  public sprite: Phaser.GameObjects.Rectangle;
  public facing: "up" | "down" | "left" | "right" = "up";
  public speed: number = 200;
  private targetX: number | null = null;
  private targetY: number | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, color = 0x00ff00, size = 30) {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, size, size, color);
    // Enable physics on the sprite
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(500, 500);
    this.targetX = x;
    this.targetY = y;
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
