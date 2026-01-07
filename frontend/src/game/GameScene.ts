import Phaser from "phaser";
import Player from "./player/Player";
import InputManager from "./input/InputManager";
import * as net from "../network";
import Projectile from "./projectile/Projectile";
import type { ProjectileConfig } from "./projectile/Projectile";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private projectiles!: Projectile[];
  private shootCooldown = 200; // ms between shots
  private lastShotTime = 0;
  private remotePlayers: Map<number, Player> = new Map();
  private localPlayerId: number = Math.floor(Math.random() * 9000) + 1000; // random 1000-9999
  private debugText?: Phaser.GameObjects.Text;

  constructor() {
    super("game");
  }

  create() {
    this.player = new Player(this, 400, 300, 0x00ff00);
    net.connect();
    // register with a locally-generated unique id to avoid collisions
    net.register(this.localPlayerId);
    this.inputManager = new InputManager(this, this.localPlayerId);
    net.onState((players) => this.handleState(players));
    this.debugText = this.add.text(8, 8, "", { font: "14px monospace", color: "#ffffff" }).setDepth(1000);
    this.projectiles = [];
  }

  private handleState(players: any[]) {
    const seen = new Set<number>();
    for (const p of players) {
      const id = p.id as number;
      seen.add(id);
      if (id === this.localPlayerId) {
        // apply authoritative server state for local player
        this.player.setTarget(p.x || 0, p.y || 0);
        continue;
      }

      let rp = this.remotePlayers.get(id);
      if (!rp) {
        rp = new Player(this, p.x || 0, p.y || 0, 0x0000ff, 30);
        this.remotePlayers.set(id, rp);
      }
      rp.setTarget(p.x || 0, p.y || 0);
    }

    // remove remote players not present anymore
    for (const [id, rp] of Array.from(this.remotePlayers.entries())) {
      if (!seen.has(id)) {
        rp.sprite.destroy();
        this.remotePlayers.delete(id);
      }
    }

    // update debug HUD
    if (this.debugText) {
      const lines = [] as string[];
      lines.push(`local=${this.localPlayerId} players=${players.length} remotes=${this.remotePlayers.size}`);
      for (const p of players) {
        lines.push(`${p.id}: x=${Number(p.x).toFixed(1)} y=${Number(p.y).toFixed(1)}`);
      }
      this.debugText.setText(lines);
    }
  }

  update(time: number, delta: number) {

    if (this.inputManager.isSpacePressed() && time - this.lastShotTime > this.shootCooldown) {
      this.shootProjectile();
      this.lastShotTime = time;
    }

    // Update projectiles
    for (const p of this.projectiles) {
      p.sprite.x += p.vx * delta / 1000;
      p.sprite.y += p.vy * delta / 1000;
    }

    // Update remote players
    for (const rp of this.remotePlayers.values()) {
      rp.update(delta);
    }
    // Update local player 
    this.player.update(delta);

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
