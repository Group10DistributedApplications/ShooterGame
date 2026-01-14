import { useEffect, useRef, useState } from "react";
import "./App.css";
import { startGame } from "./game/phaserGame";
import { disconnect, onConnectionChange } from "./network";
import Hud from "./ui/Hud";
import Lobby from "./ui/lobby/Lobby";
import StartButton from "./ui/StartButton";
import SettingsButton from "./ui/SettingsButton";
import sharedConfig from "../../shared/config.json";

function App() {
  const gameRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);
  const [lobbyVisible, setLobbyVisible] = useState<boolean>(true);

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

  // subscribe to connection changes and auto-close lobby on connect
  useEffect(() => {
    const u = onConnectionChange((c: boolean) => { if (c) setLobbyVisible(false); });
    return () => { try { u(); } catch (_) {} };
  }, []);

  // Center the game and leave a bottom buffer so UI (HUD, buttons) don't overlap
  return (
    <div ref={wrapperRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 96 }}>
      <div
        ref={gameRef}
        style={{
          width: "min(1100px, 100%)",
          height: "min(700px, calc(100% - 96px))",
          maxWidth: "1400px",
          maxHeight: "900px",
          boxSizing: "border-box",
          flex: "0 0 auto",
          position: "relative",
        }}
      />
      <StartButton targetEl={gameRef.current} />
      <SettingsButton targetEl={gameRef.current} onToggle={() => setLobbyVisible((v) => !v)} />
      <Lobby containerEl={containerEl} maxPlayers={sharedConfig?.MAX_PLAYERS ?? 6} visible={lobbyVisible} />
      <Hud targetEl={gameRef.current} />
    </div>
  );
}

export default App;
