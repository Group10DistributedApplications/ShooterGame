import Phaser from "phaser";
import * as net from "../../network";

export type Direction = "up" | "down" | "left" | "right" | null;

export default class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerId: number;

  constructor(scene: Phaser.Scene, playerId = 1) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.playerId = playerId;

    const keyboard = scene.input.keyboard!;

    const startAction = (action: string) => {
      net.sendInput(this.playerId, action);
    };

    const stopAction = () => {
      net.sendInput(this.playerId, "STOP");
    };

    keyboard.on("keydown-LEFT", () => startAction("LEFT"));
    keyboard.on("keydown-RIGHT", () => startAction("RIGHT"));
    keyboard.on("keydown-UP", () => startAction("UP"));
    keyboard.on("keydown-DOWN", () => startAction("DOWN"));

    keyboard.on("keyup-LEFT", stopAction);
    keyboard.on("keyup-RIGHT", stopAction);
    keyboard.on("keyup-UP", stopAction);
    keyboard.on("keyup-DOWN", stopAction);

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
