import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("game");
  }

  create() {
    this.player = this.add.rectangle(400, 300, 30, 30, 0x00ff00);
  }

  update(_time: number, delta: number) {
    this.player.x += 0.05 * delta;
  }
}
