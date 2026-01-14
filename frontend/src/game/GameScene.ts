
import Phaser from "phaser";
import Player from "./player/Player";
import InputManager from "./input/InputManager";
import * as net from "../network";
import Projectile from "./projectile/Projectile";
import Powerup from "./PowerUp/Powerup";
import { getSelectedMapConfig, setSelectedMapId, type MapConfig } from "./mapConfigs";

// Teleport/tween thresholds (pixels)
const TELEPORT_THRESHOLD = 8;
const SMOOTH_THRESHOLD = 200;

export default class GameScene extends Phaser.Scene {
  private mapConfig: MapConfig = getSelectedMapConfig();
  private player!: Player;
  private inputManager!: InputManager;
  private wallsLayer?: Phaser.Tilemaps.TilemapLayer;
  private wallsLayer2?: Phaser.Tilemaps.TilemapLayer;
  private objectsLayer?: Phaser.Tilemaps.TilemapLayer;
  private collisionLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  
  private remotePlayers: Map<number, Player> = new Map();
  private localPlayerId: number = Math.floor(Math.random() * 9000) + 1000; // random 1000-9999
  private debugText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private remoteProjectiles: Map<number, Projectile> = new Map();
  private powerups: Map<number, Powerup> = new Map();
  private unsubscribeState: (() => void) | null = null;
  private unsubscribeGameStart: (() => void) | null = null;
  private registered: boolean = false;
  private connCheckId: number | null = null;
  private smoothTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super("game");
  }

  preload() {
    this.mapConfig = getSelectedMapConfig();
    // Load map and tilesets
    this.load.tilemapTiledJSON(this.mapConfig.mapKey, this.mapConfig.mapPath);
    for (const ts of this.mapConfig.tilesets) {
      this.load.image(ts.key, ts.imagePath);
    }
    
    // Load player sprites
    this.load.image("player-green", "src/assets/sprites/Sprite_Green.png");
    this.load.image("player-green-topdown", "src/assets/sprites/Sprite-Green-TopDown.png");
    this.load.image("player-blue", "src/assets/sprites/Sprite-Blue.png");
    this.load.image("player-blue-topdown", "src/assets/sprites/Sprite-Blue-TopDown.png");
    this.load.image("projectile", "src/assets/sprites/Sprite-Projectile.png");
  }

  create() {
    // --- MAP SETUP ---
    const map = this.make.tilemap({ key: this.mapConfig.mapKey });
    const tilesets = this.mapConfig.tilesets
      .map((ts) => map.addTilesetImage(ts.name, ts.key))
      .filter(Boolean) as Phaser.Tilemaps.Tileset[];
    if (tilesets.length === 0) {
      throw new Error("No tilesets found for selected map. Check names/keys in mapConfigs.ts");
    }

    const tryLayer = (name: string): Phaser.Tilemaps.TilemapLayer | undefined => {
      try { return map.createLayer(name, tilesets, 0, 0) || undefined; } catch (_) { return undefined; }
    };

    map.createLayer("Floors", tilesets, 0, 0);
    this.objectsLayer = tryLayer("Objects") || undefined;
    this.wallsLayer = tryLayer("Walls") || tryLayer("Collisions") || tryLayer("Collision") || undefined;
    this.wallsLayer2 = tryLayer("Walls2") || undefined;
    const collisionLayerNames = this.mapConfig.collisionLayerNames || ["Walls", "Walls2", "Objects"];
    this.collisionLayers = collisionLayerNames
      .map((name) => tryLayer(name))
      .filter(Boolean) as Phaser.Tilemaps.TilemapLayer[];
    if (!this.wallsLayer && this.collisionLayers.length > 0) {
      this.wallsLayer = this.collisionLayers[0];
    }
    for (const layer of this.collisionLayers) {
      // Use Tiled collision shapes if present; fallback to excluding empty tiles
      if (typeof layer.setCollisionFromCollisionGroup === "function") {
        layer.setCollisionFromCollisionGroup();
      }
      layer.setCollisionByExclusion([-1, 0]);
    }

    // --- PLAYER SETUP ---
    this.player = new Player(this, 400, 300, "green");
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
    // Apply zoom to make the map and sprites appear larger; tweak MAP_ZOOM as needed
    if (this.mapConfig.zoom && this.mapConfig.zoom !== 1) {
      this.cameras.main.setZoom(this.mapConfig.zoom);
    }

    // --- NETWORK SETUP ---
    // Do NOT auto-connect or auto-register here; Lobby controls connection.
    this.inputManager = new InputManager(this, this.localPlayerId, () => this.player.facing || "up");
    this.unsubscribeState = net.onState((state) => this.handleState(state));
    this.unsubscribeGameStart = net.onGameStart((msg) => {
      const next = msg && typeof msg.map === "string" && msg.map.trim() ? msg.map.trim() : this.mapConfig.id;
      setSelectedMapId(next);
      // Always restart on game_start so we reload assets and reset state
      this.scene.restart();
    });
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
      if (this.unsubscribeGameStart) {
        try { this.unsubscribeGameStart(); } catch (_) {}
        this.unsubscribeGameStart = null;
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
        const serverX = p.x || 0;
        const serverY = p.y || 0;
        const res = this.player.reconcileServerPosition(serverX, serverY, TELEPORT_THRESHOLD, SMOOTH_THRESHOLD);
        if (res.action === "smooth") {
          this.smoothMoveLocalTo(serverX, serverY, res.dist);
        }
        this.player.hasSpeedBoost = p.hasSpeedBoost ?? false;
        this.player.speedBoostTimer = p.speedBoostTimer ?? 0;
        this.player.setLives(p.lives !== undefined ? p.lives : 3);
        this.player.setInvulnerable(p.invulnerableTime > 0);
        continue;
      }

      let rp = this.remotePlayers.get(id);
      if (!rp) {
        rp = new Player(this, p.x || 0, p.y || 0, "blue");
        this.remotePlayers.set(id, rp);
        // Add collision for remote player against all collidable layers
        for (const layer of this.collisionLayers) {
          this.physics.add.collider(rp.sprite, layer);
        }
      }
      rp.setTarget(p.x || 0, p.y || 0);
      rp.hasSpeedBoost = p.hasSpeedBoost ?? false;
      rp.speedBoostTimer = p.speedBoostTimer ?? 0;
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

    // handle server-authoritative powerups
    const pwups: any[] = state.powerups || [];
    const seenPowerups = new Set<number>();
    for (const pu of pwups) {
      const id = pu.id as number;
      seenPowerups.add(id);
      let powerup = this.powerups.get(id);
      if (!powerup) {
        powerup = Powerup.fromServer(this, pu);
        this.powerups.set(id, powerup);
      } else {
        powerup.updateFromServer(pu);
      }
    }

    // remove powerups not present anymore
    for (const [id, powerup] of Array.from(this.powerups.entries())) {
      if (!seenPowerups.has(id)) {
        powerup.destroy();
        this.powerups.delete(id);
      }
    }

    // update debug HUD
    if (this.debugText) {
      const lines = [] as string[];
      lines.push(`local=${this.localPlayerId} players=${players.length} remotes=${this.remotePlayers.size} projectiles=${this.remoteProjectiles.size} powerups=${this.powerups.size}`);
      for (const p of players) {
        lines.push(`${p.id}: x=${Number(p.x).toFixed(1)} y=${Number(p.y).toFixed(1)}`);
      }
      this.debugText.setText(lines);
    }
  }

  // Smoothly move the local player to (x,y) by tweening the sprite while
  // temporarily disabling the physics body. Restores physics and target after.
  private smoothMoveLocalTo(x: number, y: number, dist: number) {
    if (this.smoothTween) {
      this.smoothTween.stop();
      this.smoothTween = null;
    }
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }
    this.player.setManualControl(true);

    const duration = Math.min(300, Math.max(80, Math.floor(dist * 2)));
    const tmp = { x: this.player.x, y: this.player.y };
    this.smoothTween = this.tweens.add({
      targets: tmp,
      x: { value: x, ease: "Cubic.easeOut" },
      y: { value: y, ease: "Cubic.easeOut" },
      duration,
      onUpdate: () => { this.player.moveSpriteTo(tmp.x, tmp.y); },
      onComplete: () => {
        this.player.moveSpriteTo(x, y);
        if (body) {
          body.reset(x, y);
          body.enable = true;
          body.setVelocity(0, 0);
        }
        this.player.setManualControl(false);
        this.player.setTarget(x, y);
        this.smoothTween = null;
      }
    });
  }

  update(_time: number, delta: number) {
    // update local facing from input so FIRE uses correct heading
    const dir = this.inputManager.getDirection();
    if (dir) this.player.updateFacing(dir);
    // Update remote projectiles (interpolate locally between server updates)
    for (const p of this.remoteProjectiles.values()) {
      p.sprite.x += p.vx * delta / 1000;
      p.sprite.y += p.vy * delta / 1000;
    }

    // Update powerups (animation)
    for (const powerup of this.powerups.values()) {
      powerup.update(delta);
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
