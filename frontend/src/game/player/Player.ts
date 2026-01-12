import Phaser from "phaser";

export default class Player {
  public sprite: Phaser.GameObjects.Rectangle;
  public facing: "up" | "down" | "left" | "right" = "up";
  public speed: number = 200;
  public lives: number = 3;
  public invulnerable: boolean = false;
  private targetX: number | null = null;
  private targetY: number | null = null;
  private livesText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, color = 0x00ff00, size = 30) {
    this.scene = scene;
    this.sprite = scene.add.rectangle(x, y, size, size, color);
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

  setPosition(x: number, y: number) {
    this.sprite.x = x;
    this.sprite.y = y;
    this.livesText.setPosition(x, y - 25);
  }

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
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

  // interpolate toward target each frame; delta in ms
  update(delta: number) {
    if (this.targetX === null || this.targetY === null) return;
    const t = Math.min(1, 10 * (delta / 1000));
    this.sprite.x = this.sprite.x + (this.targetX - this.sprite.x) * t;
    this.sprite.y = this.sprite.y + (this.targetY - this.sprite.y) * t;
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

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
