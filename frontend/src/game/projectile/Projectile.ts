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

  static fromServer(scene: Phaser.Scene, data: any): Projectile {
    const facing = Math.abs(data.vx) > Math.abs(data.vy) ? (data.vx < 0 ? "left" : "right") : (data.vy < 0 ? "up" : "down");
    const cfg: ProjectileConfig = { x: data.x || 0, y: data.y || 0, vx: data.vx || 0, vy: data.vy || 0, facing };
    return new Projectile(scene, cfg);
  }

  updateFromServer(data: any) {
    this.vx = data.vx || 0;
    this.vy = data.vy || 0;
    this.sprite.x = data.x || 0;
    this.sprite.y = data.y || 0;
  }

  destroy() {
    this.sprite.destroy();
  }
}
