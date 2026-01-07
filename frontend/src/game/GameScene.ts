import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed = 200; // pixels per second

  constructor() {
    super("game");
  }

  create() {
    this.player = this.add.rectangle(400, 300, 30, 30, 0x00ff00);

    // Create arrow key input
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  update(_time: number, delta: number) {
    const move = (this.speed * delta) / 1000;

    if (this.cursors.left.isDown) {
      this.player.x -= move;
    }
    if (this.cursors.right.isDown) {
      this.player.x += move;
    }
    if (this.cursors.up.isDown) {
      this.player.y -= move;
    }
    if (this.cursors.down.isDown) {
      this.player.y += move;
    }
  }
}
