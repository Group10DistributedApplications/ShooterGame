import Phaser from "phaser";
import Player from "./player/Player";
import InputManager from "./input/InputManager";
import * as net from "../network";
import Projectile from "./projectile/Projectile";
import type { ProjectileConfig } from "./projectile/Projectile";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  
  private remotePlayers: Map<number, Player> = new Map();
  private localPlayerId: number = Math.floor(Math.random() * 9000) + 1000; // random 1000-9999
  private debugText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private remoteProjectiles: Map<number, Projectile> = new Map();
  private registered: boolean = false;
  private connCheckId: number | null = null;

  constructor() {
    super("game");
  }

  create() {
    this.player = new Player(this, 400, 300, 0x00ff00);
    // Do not auto-connect here; wait for the user to connect from the Lobby.
    // Once a connection is established, register this client with the server.
    this.connCheckId = window.setInterval(() => {
      try {
        if (!this.registered && net.isConnected()) {
          net.register(this.localPlayerId, net.getGameId());
          this.registered = true;
          if (this.connCheckId) {
            clearInterval(this.connCheckId);
            this.connCheckId = null;
          }
        }
      } catch (e) {
        // ignore
      }
    }, 250);
    this.inputManager = new InputManager(this, this.localPlayerId, () => this.player.facing || "up");
    net.onState((state) => this.handleState(state));
    this.debugText = this.add.text(8, 8, "", { font: "14px monospace", color: "#ffffff" }).setDepth(1000);
    const cx = this.cameras.main.centerX;
    this.statusText = this.add.text(cx, 20, "Disconnected", { font: "16px monospace", color: "#ff0000" })
      .setOrigin(0.5, 0)
      .setDepth(2000)
      .setScrollFactor(0);
    if (this.statusText) this.statusText.setVisible(!net.isConnected());

    // ensure interval is cleared when the scene shuts down
    this.events.on("shutdown", () => {
      if (this.connCheckId) {
        clearInterval(this.connCheckId);
        this.connCheckId = null;
      }
    });
  }

  private handleState(state: any) {
    const players: any[] = state.players || [];
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

    // handle server-authoritative projectiles
    const projs: any[] = state.projectiles || [];
    const seenProj = new Set<number>();
    for (const pr of projs) {
      const id = pr.id as number;
      seenProj.add(id);
      let rp = this.remoteProjectiles.get(id);
      if (!rp) {
        rp = Projectile.fromServer(this, pr);
        this.remoteProjectiles.set(id, rp);
      } else {
        rp.updateFromServer(pr);
      }
    }

    // remove projectiles not present anymore
    for (const [id, rp] of Array.from(this.remoteProjectiles.entries())) {
      if (!seenProj.has(id)) {
        rp.destroy();
        this.remoteProjectiles.delete(id);
      }
    }

    // update debug HUD
    if (this.debugText) {
      const lines = [] as string[];
      lines.push(`local=${this.localPlayerId} players=${players.length} remotes=${this.remotePlayers.size} projectiles=${this.remoteProjectiles.size}`);
      for (const p of players) {
        lines.push(`${p.id}: x=${Number(p.x).toFixed(1)} y=${Number(p.y).toFixed(1)}`);
      }
      this.debugText.setText(lines);
    }
  }

  update(time: number, delta: number) {
    // update local facing from input so FIRE uses correct heading
    const dir = this.inputManager.getDirection();
    if (dir) this.player.facing = dir;
    // Update remote projectiles (interpolate locally between server updates)
    for (const p of this.remoteProjectiles.values()) {
      p.sprite.x += p.vx * delta / 1000;
      p.sprite.y += p.vy * delta / 1000;
    }

    // Update remote players
    for (const rp of this.remotePlayers.values()) {
      rp.update(delta);
    }
    // Update local player 
    this.player.update(delta);

    // connection status indicator
    if (this.statusText) {
      this.statusText.setVisible(!net.isConnected());
    }

    // Remove remote projectiles that go off screen (optional cleanup — server should remove expired ones)
    for (const [id, p] of Array.from(this.remoteProjectiles.entries())) {
      if (p.sprite.x <= -20 || p.sprite.x >= 820 || p.sprite.y <= -20 || p.sprite.y >= 620) {
        p.sprite.destroy();
        this.remoteProjectiles.delete(id);
      }
    }
  }

  
}
