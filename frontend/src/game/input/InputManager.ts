import Phaser from "phaser";
import * as net from "../../network";

export type Direction = "up" | "down" | "left" | "right" | null;

export default class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerId: number;
  private intervals: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene, playerId = 1) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.playerId = playerId;

    // send network inputs on keydown / keyup; send repeated messages while held
    const keyboard = scene.input.keyboard!;

    const repeatInterval = 50; // ms

    const startRepeating = (action: string) => {
      if (this.intervals.has(action)) return;
      net.sendInput(this.playerId, action);
      const id = window.setInterval(() => net.sendInput(this.playerId, action), repeatInterval);
      this.intervals.set(action, id as unknown as number);
    };

    const stopRepeating = (action: string) => {
      const id = this.intervals.get(action);
      if (id !== undefined) {
        clearInterval(id);
        this.intervals.delete(action);
      }
      net.sendInput(this.playerId, "STOP");
    };

    keyboard.on("keydown-LEFT", () => startRepeating("LEFT"));
    keyboard.on("keydown-RIGHT", () => startRepeating("RIGHT"));
    keyboard.on("keydown-UP", () => startRepeating("UP"));
    keyboard.on("keydown-DOWN", () => startRepeating("DOWN"));

    keyboard.on("keyup-LEFT", () => stopRepeating("LEFT"));
    keyboard.on("keyup-RIGHT", () => stopRepeating("RIGHT"));
    keyboard.on("keyup-UP", () => stopRepeating("UP"));
    keyboard.on("keyup-DOWN", () => stopRepeating("DOWN"));

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
