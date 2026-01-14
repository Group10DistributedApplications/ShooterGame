import Phaser from "phaser";

export interface PowerupConfig {
  x: number;
  y: number;
  type: string;
  active: boolean;
}

export default class Powerup {
  public sprite: Phaser.GameObjects.Container;
  public icon: Phaser.GameObjects.Sprite;
  public type: string;
  public active: boolean;
  private bounceTime: number = 0;

  constructor(scene: Phaser.Scene, config: PowerupConfig) {
    this.type = config.type;
    this.active = config.active;

    // Container for the powerup
    this.sprite = scene.add.container(config.x, config.y);

    // Create the icon sprite based on powerup type
    const iconKey = this.getIconKeyForType(config.type);
    this.icon = scene.add.sprite(0, 0, iconKey);
    this.icon.setScale(0.5); // Adjust scale as needed
    this.sprite.add(this.icon);

    // Set visibility based on active state
    this.sprite.setVisible(config.active);

    // Add the sprite to physics (for collision detection)
    scene.physics.add.existing(this.sprite);
  }

  private getIconKeyForType(type: string): string {
    switch (type) {
      case "speed":
        return "powerup-speed";
      case "noCooldown":
        return "powerup-noCooldown";
      case "spreadShot":
        return "powerup-spreadShot";
      default:
        return "powerup-speed"; // Fallback
    }
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
    this.sprite.setVisible(this.active); // Show/hide based on active state
  }

  update(delta: number) {
    // Bounce the powerup up and down
    this.bounceTime += (delta / 1000) * Math.PI * 2; // Control bounce speed
    const bounceOffset = Math.sin(this.bounceTime) * 5; // 5 pixels up and down
    this.icon.y = bounceOffset;
  }

  destroy() {
    this.sprite.destroy();
  }
}
