import { useEffect, useRef } from "react";
import { startGame } from "./game/phaserGame";

function App() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) {
      startGame(gameRef.current);
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <div ref={gameRef} />
    </div>
  );
}

export default App;
