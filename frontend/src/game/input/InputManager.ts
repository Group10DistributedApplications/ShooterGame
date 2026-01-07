import Phaser from "phaser";
import * as net from "../../network";

export type Direction = "up" | "down" | "left" | "right" | null;

export default class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerId: number;

  constructor(scene: Phaser.Scene, playerId = 1) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.playerId = playerId;

    // send network inputs on keydown / keyup to avoid per-frame spam
    const keyboard = scene.input.keyboard!;

    keyboard.on("keydown-LEFT", () => net.sendInput(this.playerId, "LEFT"));
    keyboard.on("keydown-RIGHT", () => net.sendInput(this.playerId, "RIGHT"));
    keyboard.on("keyup-LEFT", () => net.sendInput(this.playerId, "STOP"));
    keyboard.on("keyup-RIGHT", () => net.sendInput(this.playerId, "STOP"));
    keyboard.on("keydown-SPACE", () => net.sendInput(this.playerId, "FIRE"));
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
