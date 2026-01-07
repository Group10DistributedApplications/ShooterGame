import Phaser from "phaser";
import Player from "./player/Player";
import InputManager from "./input/InputManager";
import Projectile from "./projectile/Projectile";
import type { ProjectileConfig } from "./projectile/Projectile";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private projectiles!: Projectile[];
  private shootCooldown = 200; // ms between shots
  private lastShotTime = 0;

  constructor() {
    super("game");
  }

  create() {
    this.player = new Player(this, 400, 300);
    this.inputManager = new InputManager(this);
    this.projectiles = [];
  }

  update(time: number, delta: number) {
    const move = (this.player.speed * delta) / 1000;

    // Player movement and facing
    const direction = this.inputManager.getDirection();
    if (direction) {
      switch (direction) {
        case "left":
          this.player.sprite.x -= move;
          break;
        case "right":
          this.player.sprite.x += move;
          break;
        case "up":
          this.player.sprite.y -= move;
          break;
        case "down":
          this.player.sprite.y += move;
          break;
      }
      this.player.facing = direction;
    }

    if (this.inputManager.isSpacePressed() && time - this.lastShotTime > this.shootCooldown) {
      this.shootProjectile();
      this.lastShotTime = time;
    }

    // Update projectiles
    for (const p of this.projectiles) {
      p.sprite.x += p.vx * delta / 1000;
      p.sprite.y += p.vy * delta / 1000;
    }

    // Remove projectiles that go off screen
    this.projectiles = this.projectiles.filter(p =>
      p.sprite.x > -20 && p.sprite.x < 820 && p.sprite.y > -20 && p.sprite.y < 620
    );
  }

  private shootProjectile() {
    // Set projectile velocity based on facing
    let vx = 0, vy = 0;
    const speed = 400;
    switch (this.player.facing) {
      case "up": vy = -speed; break;
      case "down": vy = speed; break;
      case "left": vx = -speed; break;
      case "right": vx = speed; break;
    }
    const config: ProjectileConfig = {
      x: this.player.x,
      y: this.player.y,
      vx,
      vy,
      facing: this.player.facing
    };
    const projectile = new Projectile(this, config);
    this.projectiles.push(projectile);
  }
}
