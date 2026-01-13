
import Phaser from "phaser";
import Player from "./player/Player";
import InputManager from "./input/InputManager";
import * as net from "../network";
import Projectile from "./projectile/Projectile";
import type { ProjectileConfig } from "./projectile/Projectile";

// Map/tileset asset paths for Map2
const MAP_KEY = "map2";
const MAP_PATH = "assets/maps/Map2.tmj";

const TILESET_WALLS_NAME = "Interior-Hospital Walls";
const TILESET_FLOOR_NAME = "Interior-Hospital Floor";
const TILESET_OBJECTS_NAME = "Interior-Hospital Objects";
const TILESET_ALT_OBJECTS_NAME = "Interior-Hospital-Alt Objects";

const TILESET_WALLS_KEY = "TileA4_PHC_Interior-Hospital.png";
const TILESET_FLOOR_KEY = "TileA5_PHC_Interior-Hospital.png";
const TILESET_OBJECTS_KEY = "TileB_PHC_Interior-Hospital.png";
const TILESET_ALT_OBJECTS_KEY = "TileC_PHC_Interior-Hospital-Alt.png";

const TILESET_WALLS_IMAGE = "assets/tilesets/" + TILESET_WALLS_KEY;
const TILESET_FLOOR_IMAGE = "assets/tilesets/" + TILESET_FLOOR_KEY;
const TILESET_OBJECTS_IMAGE = "assets/tilesets/" + TILESET_OBJECTS_KEY;
const TILESET_ALT_OBJECTS_IMAGE = "assets/tilesets/" + TILESET_ALT_OBJECTS_KEY;

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private wallsLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallsLayer2?: Phaser.Tilemaps.TilemapLayer;
  private objectsLayer?: Phaser.Tilemaps.TilemapLayer;
  private collisionLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  
  private remotePlayers: Map<number, Player> = new Map();
  private localPlayerId: number = Math.floor(Math.random() * 9000) + 1000; // random 1000-9999
  private debugText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private remoteProjectiles: Map<number, Projectile> = new Map();
  private unsubscribeState: (() => void) | null = null;
  private registered: boolean = false;
  private connCheckId: number | null = null;

  constructor() {
    super("game");
  }

  preload() {
    // Load map and tilesets
    this.load.tilemapTiledJSON(MAP_KEY, MAP_PATH);
    this.load.image(TILESET_WALLS_KEY, TILESET_WALLS_IMAGE);
    this.load.image(TILESET_FLOOR_KEY, TILESET_FLOOR_IMAGE);
    this.load.image(TILESET_OBJECTS_KEY, TILESET_OBJECTS_IMAGE);
    this.load.image(TILESET_ALT_OBJECTS_KEY, TILESET_ALT_OBJECTS_IMAGE);
  }

  create() {
    // --- MAP SETUP ---
    const map = this.make.tilemap({ key: MAP_KEY });
    const tilesetWalls = map.addTilesetImage(TILESET_WALLS_NAME, TILESET_WALLS_KEY);
    const tilesetFloor = map.addTilesetImage(TILESET_FLOOR_NAME, TILESET_FLOOR_KEY);
    const tilesetObjects = map.addTilesetImage(TILESET_OBJECTS_NAME, TILESET_OBJECTS_KEY);
    const tilesetAltObjects = map.addTilesetImage(TILESET_ALT_OBJECTS_NAME, TILESET_ALT_OBJECTS_KEY);
    const tilesets = [tilesetWalls, tilesetFloor, tilesetObjects, tilesetAltObjects].filter(Boolean) as Phaser.Tilemaps.Tileset[];
    if (tilesets.length < 2) {
      throw new Error("Tileset(s) not found. Check names in Tiled vs Phaser keys.");
    }

    const groundLayer = map.createLayer("Floors", tilesets, 0, 0);
    this.objectsLayer = map.createLayer("Objects", tilesets, 0, 0) || undefined;
    this.wallsLayer = map.createLayer("Walls", tilesets, 0, 0)!;
    this.wallsLayer2 = map.createLayer("Walls2", tilesets, 0, 0) || undefined;
    this.collisionLayers = [this.wallsLayer, this.wallsLayer2, this.objectsLayer].filter(Boolean) as Phaser.Tilemaps.TilemapLayer[];
    for (const layer of this.collisionLayers) {
      // Use Tiled collision shapes if present; fallback to excluding empty tiles
      if (typeof layer.setCollisionFromCollisionGroup === "function") {
        layer.setCollisionFromCollisionGroup();
      }
      layer.setCollisionByExclusion([-1, 0]);
    }

    // --- PLAYER SETUP ---
    this.player = new Player(this, 400, 300, 0x00ff00);
    // Enable target-chasing so player follows server position updates
    this.player.setManualControl(false);
    // Local player collides with all solid layers (walls + pillars/objects)
    for (const layer of this.collisionLayers) {
      this.physics.add.collider(this.player.sprite, layer);
    }

    // world & camera bounds match the map size
    const mapW = map.widthInPixels;
    const mapH = map.heightInPixels;
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // --- NETWORK SETUP ---
    // Do NOT auto-connect or auto-register here; Lobby controls connection.
    this.inputManager = new InputManager(this, this.localPlayerId, () => this.player.facing || "up");
    this.unsubscribeState = net.onState((state) => this.handleState(state));
    const unsubscribeConn = net.onConnectionChange((connected) => {
      if (!connected) {
        // mark as not registered so we re-register on reconnect
        this.registered = false;
        return;
      }

      // on connect: if not yet registered, register now
      if (!this.registered && net.isConnected()) {
        try {
          net.registerLocal(this.localPlayerId, net.getGameId());
          this.registered = true;
        } catch (e) {
          // ignore
        }
      }
    });

    // attempt initial registration; if not connected yet, poll until connected
    if (net.isConnected()) {
      try { net.registerLocal(this.localPlayerId, net.getGameId()); this.registered = true; } catch (e) { /* ignore */ }
    } else {
      this.connCheckId = window.setInterval(() => {
        try {
            if (!this.registered && net.isConnected()) {
            net.registerLocal(this.localPlayerId, net.getGameId());
            this.registered = true;
            if (this.connCheckId) { clearInterval(this.connCheckId); this.connCheckId = null; }
          }
        } catch (e) { /* ignore */ }
      }, 250);
    }

    this.debugText = this.add.text(8, 8, "", { font: "14px monospace", color: "#ffffff" }).setDepth(1000);
    const cx = this.cameras.main.centerX;
    this.statusText = this.add.text(cx, 20, "Disconnected", { font: "16px monospace", color: "#ff0000" })
      .setOrigin(0.5, 0)
      .setDepth(2000);
    if (this.statusText) this.statusText.setVisible(!net.isConnected());
    this.events.on("shutdown", () => {
      if (this.connCheckId) { clearInterval(this.connCheckId); this.connCheckId = null; }
      try { unsubscribeConn(); } catch (e) { }
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
        // apply authoritative server state for local player
        this.player.setTarget(p.x || 0, p.y || 0);
        this.player.setLives(p.lives !== undefined ? p.lives : 3);
        this.player.setInvulnerable(p.invulnerableTime > 0);
        continue;
      }

      let rp = this.remotePlayers.get(id);
      if (!rp) {
        rp = new Player(this, p.x || 0, p.y || 0, 0x0000ff, 30);
        this.remotePlayers.set(id, rp);
        // Add collision for remote player against all collidable layers
        for (const layer of this.collisionLayers) {
          this.physics.add.collider(rp.sprite, layer);
        }
      }
      rp.setTarget(p.x || 0, p.y || 0);
      rp.setLives(p.lives !== undefined ? p.lives : 3);
      rp.setInvulnerable(p.invulnerableTime > 0);
    }

    // remove remote players not present anymore
    for (const [id, rp] of Array.from(this.remotePlayers.entries())) {
      if (!seen.has(id)) {
        rp.destroy();
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
  }
  
}
