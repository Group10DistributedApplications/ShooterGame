import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as net from "../network";

type Props = { targetEl?: HTMLElement | null };

export default function Hud({ targetEl }: Props = {}) {
  const [gameOver, setGameOver] = useState<{ winner: number | null } | null>(null);
  const [connected, setConnected] = useState<boolean>(net.isConnected());
  const [serverUrl, setServerUrl] = useState<string>(net.getServerUrl());
  const [gameId, setGameId] = useState<string | undefined>(net.getGameId());

  useEffect(() => {
    const unsub = net.onGameOver((msg) => {
      setGameOver({ winner: msg && msg.winner !== undefined ? msg.winner : null });
    });
    // also clear overlay on game start
    const unsubStart = net.onGameStart(() => { setGameOver(null); });
    const unsubConn = net.onConnectionChange((c) => {
      setConnected(!!c);
      try { setServerUrl(net.getServerUrl()); } catch (_) {}
      try { setGameId(net.getGameId()); } catch (_) { setGameId(undefined); }
      // debug
      try { console.debug("HUD: onConnectionChange -> connected=", c, "serverUrl=", net.getServerUrl(), "gameId=", net.getGameId()); } catch (_) {}
    });
    return () => { try { unsub(); } catch (_) {} try { unsubStart(); } catch (_) {} try { unsubConn(); } catch (_) {} };
  }, []);

  useEffect(() => {
    // sync initial server url in case connect happened before mount
    try { setServerUrl(net.getServerUrl()); } catch (_) {}
    try { setGameId(net.getGameId()); } catch (_) { setGameId(undefined); }
  }, []);

  const localId = net.getLocalPlayerId();

  // format serverUrl to host:port when possible
  let serverHostPort = serverUrl;
  try {
    const u = new URL(serverUrl);
    serverHostPort = u.hostname + (u.port ? `:${u.port}` : "");
  } catch (_) {
    // fallback: strip protocol if present
    serverHostPort = serverUrl.replace(/^wss?:\/\//, "");
  }

  const content = (
    <>
      <div style={hudStyle} aria-hidden>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
          {connected ? (gameId ? `Room: ${gameId}` : `Server: ${serverHostPort}`) : "Server: Disconnected"}
        </div>
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

  if (typeof document !== "undefined" && targetEl) {
    try {
      return createPortal(content, targetEl);
    } catch (_) {
      return content;
    }
  }

  return content;
}

const hudStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  color: "#fff",
  zIndex: 1000,
  fontFamily: "monospace",
  pointerEvents: "none",
  backgroundColor: "rgba(0,0,0,0.6)",
  padding: "8px 10px",
  borderRadius: 6,
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
