import Phaser from "phaser";

export default class Player {
  public sprite: Phaser.GameObjects.Rectangle;
  public facing: "up" | "down" | "left" | "right" = "up";
  public speed: number = 200;

  constructor(scene: Phaser.Scene, x: number, y: number, color = 0x00ff00, size = 30) {
    this.sprite = scene.add.rectangle(x, y, size, size, color);
  }

  setPosition(x: number, y: number) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
