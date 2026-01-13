import Phaser from "phaser";

export interface PowerupConfig {
  x: number;
  y: number;
  type: string;
  active: boolean;
}

export default class Powerup {
  public sprite: Phaser.GameObjects.Container;
  public icon: Phaser.GameObjects.Rectangle;
  public circle: Phaser.GameObjects.Graphics;
  public type: string;
  public active: boolean;
  private rotationAngle: number = 0;

  constructor(scene: Phaser.Scene, config: PowerupConfig) {
    this.type = config.type;
    this.active = config.active;

    // Container for the powerup
    this.sprite = scene.add.container(config.x, config.y);

    // Create the spinning circle background
    this.circle = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawCircle();
    this.sprite.add(this.circle);

    // Create the icon rectangle based on powerup type
    const color = this.getColorForType(config.type);
    const size = 16;
    this.icon = scene.add.rectangle(0, 0, size, size, color);
    this.sprite.add(this.icon);

    // Add the sprite to physics (for collision detection)
    scene.physics.add.existing(this.sprite);
  }

  private getColorForType(type: string): number {
    switch (type) {
      case "speed":
        return 0xff6600; // Orange
      case "noCooldown":
        return 0x00ff00; // Green
      case "spreadShot":
        return 0xff00ff; // Purple/Magenta
      default:
        return 0xffffff; // White
    }
  }

  private drawCircle() {
    const color = this.getColorForType(this.type);
    const alpha = this.active ? 0.8 : 0.3;
    this.circle.clear();
    this.circle.fillStyle(color, alpha);
    this.circle.beginPath();
    this.circle.arc(0, 0, 20, 0, Math.PI * 2);
    this.circle.closePath();
    this.circle.fillPath();
  }

  static fromServer(scene: Phaser.Scene, data: any): Powerup {
    const cfg: PowerupConfig = {
      x: data.x || 0,
      y: data.y || 0,
      type: data.type || "speed",
      active: data.active ?? true,
    };
    return new Powerup(scene, cfg);
  }

  updateFromServer(data: any) {
    this.sprite.x = data.x || 0;
    this.sprite.y = data.y || 0;
    this.active = data.active ?? true;
    this.drawCircle(); // Redraw circle with updated active state
  }

  update(delta: number) {
    // Rotate the powerup slowly for visual effect
    this.rotationAngle += (delta / 1000) * Math.PI; // Full rotation per second
    this.icon.rotation = this.rotationAngle;
  }

  destroy() {
    this.sprite.destroy();
  }
}
