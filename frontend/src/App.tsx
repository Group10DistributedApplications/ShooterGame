import { useEffect, useRef } from "react";
import "./App.css";
import { startGame } from "./game/phaserGame";
import { connect, disconnect } from "./network";
import Hud from "./ui/Hud";

function App() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) {
      startGame(gameRef.current);
    }

    // start network (stub). Change URL as needed.
    connect();

    return () => {
      disconnect();
      // optional cleanup: stopGame();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <div ref={gameRef} />
      <Hud />
    </div>
  );
}

export default App;
