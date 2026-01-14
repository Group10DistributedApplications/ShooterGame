import Phaser from "phaser";
import GameScene from "./GameScene";

let game: Phaser.Game | null = null;

export function startGame(parent: HTMLElement) {
  if (game) return;

  const w = parent.clientWidth || window.innerWidth;
  const h = parent.clientHeight || window.innerHeight;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: w,
    height: h,
    parent,
    backgroundColor: "#1e1e1e",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: "arcade",
      arcade: { 
        debug: false,
        gravity: { x: 0, y: 0 }
      }
    },

    scene: [GameScene],
  });

  // Keep the game resized to the parent using ResizeObserver when available.
  try {
    const ro = new ResizeObserver(() => {
      if (!game) return;
      const pw = parent.clientWidth || window.innerWidth;
      const ph = parent.clientHeight || window.innerHeight;
      game.scale.resize(pw, ph);
    });
    ro.observe(parent);
  } catch (_) {
    // Fallback to window resize
    window.addEventListener("resize", () => {
      if (!game) return;
      const pw = parent.clientWidth || window.innerWidth;
      const ph = parent.clientHeight || window.innerHeight;
      game.scale.resize(pw, ph);
    });
  }
}

export function stopGame() {
  game?.destroy(true);
  game = null;
}
