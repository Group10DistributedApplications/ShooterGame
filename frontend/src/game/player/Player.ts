import Phaser from "phaser";

export default class Player {
  public sprite: Phaser.GameObjects.Rectangle;
  public color: number = 0xffffff;
  public facing: "up" | "down" | "left" | "right" = "up";
  public speed: number = 200;
  private targetX: number | null = null;
  private targetY: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number = 0xffffff, size = 30) {
    this.color = color;
    this.sprite = scene.add.rectangle(x, y, size, size, color);
    this.targetX = x;
    this.targetY = y;
  }

  setColor(color: number) {
    this.color = color;
    if (!this.sprite) return;
    if ((this.sprite as any).setFillStyle) {
      (this.sprite as any).setFillStyle(color);
      return;
    }
    try {
      (this.sprite as any).tint = color;
    } catch (e) {
      // ignore
    }
  }


  setPosition(x: number, y: number) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  // interpolate toward target each frame; delta in ms
  update(delta: number) {
    if (this.targetX === null || this.targetY === null) return;
    const t = Math.min(1, 10 * (delta / 1000));
    this.sprite.x = this.sprite.x + (this.targetX - this.sprite.x) * t;
    this.sprite.y = this.sprite.y + (this.targetY - this.sprite.y) * t;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
