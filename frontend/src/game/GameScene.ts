
import Phaser from "phaser";
import Player from "./player/Player";
import InputManager from "./input/InputManager";
import * as net from "../network";
import Projectile from "./projectile/Projectile";
import type { ProjectileConfig } from "./projectile/Projectile";

// Map/tileset asset paths
const MAP_KEY = "map1";
const MAP_PATH = "assets/maps/Map1.tmj";
const TILESET1_KEY = "TileA5_PHC_Interior-Hospital.png";
const TILESET1_IMAGE = "assets/tilesets/TileA5_PHC_Interior-Hospital.png";
const TILESET2_KEY = "TileA4_PHC_Interior-Hospital.png";
const TILESET2_IMAGE = "assets/tilesets/TileA4_PHC_Interior-Hospital.png";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private wallsLayer!: Phaser.Tilemaps.TilemapLayer;
  
  private remotePlayers: Map<number, Player> = new Map();
  private localPlayerId: number = Math.floor(Math.random() * 9000) + 1000; // random 1000-9999
  private debugText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private remoteProjectiles: Map<number, Projectile> = new Map();

  private unsubscribeState: (() => void) | null = null;

  constructor() {
    super("game");
  }

  preload() {
    // Load map and tilesets
    this.load.tilemapTiledJSON(MAP_KEY, MAP_PATH);
    this.load.image(TILESET1_KEY, "assets/tilesets/" + TILESET1_KEY);
    this.load.image(TILESET2_KEY, "assets/tilesets/" + TILESET2_KEY);
  }

  create() {
    // --- MAP SETUP ---
    const map = this.make.tilemap({ key: MAP_KEY });
    const tileset1 = map.addTilesetImage("Interior-Hospital floor", TILESET1_KEY);
    const tileset2 = map.addTilesetImage("Interior-Hospital Walls", TILESET2_KEY);
    if (!tileset1 || !tileset2) {
      throw new Error("Tileset(s) not found. Check names in Tiled vs Phaser keys.");
    }
    const groundLayer = map.createLayer("Ground", [tileset1, tileset2], 0, 0);
    this.wallsLayer = map.createLayer("Walls", [tileset1, tileset2], 0, 0)!;
    this.wallsLayer.setCollisionByExclusion([-1, 0]);

    // --- PLAYER SETUP ---
    this.player = new Player(this, 400, 300, 0x00ff00);
    this.player.setManualControl(true);
    this.physics.add.collider(this.player.sprite, this.wallsLayer);

    // world & camera bounds match the map size
    const mapW = map.widthInPixels;
    const mapH = map.heightInPixels;
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // --- NETWORK SETUP ---
    net.connect();
    net.register(this.localPlayerId);
    this.inputManager = new InputManager(this, this.localPlayerId, () => this.player.facing || "up");
    this.unsubscribeState = net.onState((state) => this.handleState(state));

    this.debugText = this.add.text(8, 8, "", { font: "14px monospace", color: "#ffffff" }).setDepth(1000);
    const cx = this.cameras.main.centerX;
    this.statusText = this.add.text(cx, 20, "Disconnected", { font: "16px monospace", color: "#ff0000" })
      .setOrigin(0.5, 0)
      .setDepth(2000);
    if (this.statusText) this.statusText.setVisible(!net.isConnected());
    this.events.on("shutdown", () => {
      if (this.unsubscribeState) {
        try { this.unsubscribeState(); } catch (_) { /* ignore */ }
        this.unsubscribeState = null;
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
        // Reconcile only if far off and target tile is not collidable
        const clampedX = Phaser.Math.Clamp(p.x || 0, 30, 610);
        const clampedY = Phaser.Math.Clamp(p.y || 0, 30, 450);
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, clampedX, clampedY);
        const targetTile = this.wallsLayer.getTileAtWorldXY(clampedX, clampedY, true);
        const targetBlocked = !!(targetTile && targetTile.collides);
        if (!targetBlocked && dist > 48) {
          const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
          body.reset(clampedX, clampedY);
        }
        continue;
      }

      let rp = this.remotePlayers.get(id);
      if (!rp) {
        rp = new Player(this, p.x || 0, p.y || 0, 0x0000ff, 30);
        this.remotePlayers.set(id, rp);
        // Add collision for remote player
        this.physics.add.collider(rp.sprite, this.wallsLayer);
      }
      // Clamp remote player coordinates too
      const clampedX = Phaser.Math.Clamp(p.x || 0, 30, 610);
      const clampedY = Phaser.Math.Clamp(p.y || 0, 30, 450);
      rp.setTarget(clampedX, clampedY);
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
    // Manual local movement: set velocity directly, let physics handle collision
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const speed = 200;
    let vx = 0;
    let vy = 0;
    if (dir === "left") vx = -speed;
    if (dir === "right") vx = speed;
    if (dir === "up") vy = -speed;
    if (dir === "down") vy = speed;
    body.setVelocity(vx, vy);
    // Prevent sliding when no input
    if (!dir) body.setVelocity(0, 0);
    // Update remote projectiles (interpolate locally between server updates)
    for (const p of this.remoteProjectiles.values()) {
      p.sprite.x += p.vx * delta / 1000;
      p.sprite.y += p.vy * delta / 1000;
    }

    // Update remote players
    for (const rp of this.remotePlayers.values()) {
      rp.update(delta);
    }
    // Local player is manual; remote players still interpolate

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
