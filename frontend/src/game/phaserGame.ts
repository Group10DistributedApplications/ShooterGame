import Phaser from "phaser";
import GameScene from "./GameScene";

let game: Phaser.Game | null = null;

export function startGame(parent: HTMLElement) {
  if (game) return;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent,
    backgroundColor: "#1e1e1e",

    // disable physics for now
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },

    scene: [GameScene],
  });
}

export function stopGame() {
  game?.destroy(true);
  game = null;
}
