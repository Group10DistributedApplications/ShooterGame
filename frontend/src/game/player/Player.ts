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
    body.setBounce(0, 0); // No bounce
    body.setDrag(0, 0); // No drag
    body.setMaxVelocity(400, 400); // Limit max velocity
    this.targetX = x;
    this.targetY = y;
  }

  setPosition(x: number, y: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
  }

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  // interpolate toward target each frame; delta in ms
  update(delta: number) {
    if (this.targetX === null || this.targetY === null) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Calculate distance to target
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If very close to target, stop moving
    if (distance < 2) {
      body.setVelocity(0, 0);
      return;
    }
    
    // Move toward target with velocity (physics will handle collision)
    const speed = 300;
    body.setVelocity(
      (dx / distance) * speed,
      (dy / distance) * speed
    );
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
