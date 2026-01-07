import Phaser from "phaser";

export interface ProjectileConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: "up" | "down" | "left" | "right";
}

export default class Projectile {
  public sprite: Phaser.GameObjects.Rectangle;
  public vx: number;
  public vy: number;

  constructor(scene: Phaser.Scene, config: ProjectileConfig) {
    const width = (config.facing === "left" || config.facing === "right") ? 16 : 8;
    const height = (config.facing === "up" || config.facing === "down") ? 16 : 8;
    this.sprite = scene.add.rectangle(config.x, config.y, width, height, 0xffff00);
    this.vx = config.vx;
    this.vy = config.vy;
  }
}
