import Phaser from "phaser";

export type Direction = "up" | "down" | "left" | "right" | null;

export default class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  getDirection(): Direction {
    if (this.cursors.left.isDown) return "left";
    if (this.cursors.right.isDown) return "right";
    if (this.cursors.up.isDown) return "up";
    if (this.cursors.down.isDown) return "down";
    return null;
  }

  isSpacePressed(): boolean {
    return this.cursors.space.isDown;
  }
}
