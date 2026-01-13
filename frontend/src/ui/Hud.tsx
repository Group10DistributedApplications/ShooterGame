import React, { useEffect, useState } from "react";
import * as net from "../network";

export default function Hud() {
  const [gameOver, setGameOver] = useState<{ winner: number | null } | null>(null);

  useEffect(() => {
    const unsub = net.onGameOver((msg) => {
      setGameOver({ winner: msg && msg.winner !== undefined ? msg.winner : null });
    });
    // also clear overlay on game start
    const unsubStart = net.onGameStart(() => { setGameOver(null); });
    return () => { try { unsub(); } catch (_) {} try { unsubStart(); } catch (_) {} };
  }, []);

  const localId = net.getLocalPlayerId();

  return (
    <>
      <div style={hudStyle} aria-hidden>
        <div style={{ fontWeight: 700 }}>Score: 0</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>FPS: --</div>
      </div>
      {gameOver && (
        <div style={overlayStyle}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>
            {gameOver.winner === null ? "Draw" : (gameOver.winner === localId ? "You Win!" : `Player ${gameOver.winner} Wins`)}
          </div>
        </div>
      )}
    </>
  );
}

const hudStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  color: "#fff",
  zIndex: 1000,
  fontFamily: "monospace",
  pointerEvents: "none",
};

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
  pointerEvents: "none",
  color: "#fff",
  textShadow: "0 2px 10px rgba(0,0,0,0.8)",
};
