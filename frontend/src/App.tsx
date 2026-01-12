import { useEffect, useRef, useState } from "react";
import "./App.css";
import { startGame } from "./game/phaserGame";
import { disconnect } from "./network";
import Hud from "./ui/Hud";
import Lobby from "./ui/Lobby";

function App() {
  const gameRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (gameRef.current) {
      startGame(gameRef.current);
    }
    // ensure we pass the wrapper element to Lobby after mount
    setContainerEl(wrapperRef.current);

    return () => {
      disconnect();
      // optional cleanup: stopGame();
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div ref={gameRef} style={{ width: 800, height: 600 }} />
      <Lobby containerEl={containerEl} />
      <Hud />
    </div>
  );
}

export default App;
