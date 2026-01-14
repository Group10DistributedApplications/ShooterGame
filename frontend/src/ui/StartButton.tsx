import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import * as net from "../network";
import { getSelectedMapId } from "../game/mapConfigs";

type Props = { targetEl?: HTMLElement | null };

export default function StartButton({ targetEl }: Props) {
  const [connected, setConnected] = useState<boolean>(net.isConnected());
  const [registered, setRegistered] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [label, setLabel] = useState<string>("Start Game");
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const unsubConn = net.onConnectionChange((c) => setConnected(c));
    const unsubReg = net.onRegistered(() => setRegistered(true));
    const unsubGameOver = net.onGameOver(() => {
      // show button again as "Play Again" when a match ends
      setLabel("Play Again");
      setVisible(true);
    });
    const unsubGameStart = net.onGameStart(() => {
      // hide button when a game starts
      setVisible(false);
      setLabel("Start Game");
    });
    return () => {
      try { unsubConn(); } catch (_) {}
      try { unsubReg(); } catch (_) {}
      try { unsubGameOver(); } catch (_) {}
      try { unsubGameStart(); } catch (_) {}
    };
  }, []);

  function handleStart() {
    try { console.log("ui: Start button clicked (portal)"); } catch (_) {}
    try { console.log("ui: connected=", connected, "registered=", registered); } catch (_) {}
    net.sendStartGame(getSelectedMapId());
    // hide immediately after click until game_over
    setVisible(false);
  }

  // Visual disabled state but keep clickable so we can trace behavior
  const opacity = connected && registered ? 1 : 0.6;

  useEffect(() => {
    function update() {
      if (!targetEl || !btnRef.current) {
        setPos(null);
        return;
      }
      const rect = targetEl.getBoundingClientRect();
      const bw = btnRef.current.offsetWidth || 160;
      // bottom-center of the target element; nudge upward slightly
      const top = rect.top + rect.height - 72; // moved up a bit
      const left = rect.left + Math.max(0, Math.round(rect.width / 2 - bw / 2));
      setPos({ top, left });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const obs = new MutationObserver(update);
    if (targetEl) obs.observe(targetEl, { attributes: true, childList: false, subtree: false });
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); obs.disconnect(); };
  }, [targetEl]);

  if (!visible) return null;

  const btn = (
    <div style={{ ...portalWrapperStyle, top: pos ? pos.top : undefined, left: pos ? pos.left : undefined }}>
      <button ref={btnRef} onClick={handleStart} style={{ ...buttonStyle, opacity }}>
        {label}
      </button>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(btn, document.body);
  }
  return btn;
}

const portalWrapperStyle: React.CSSProperties = {
  position: "fixed",
  top: 12,
  right: 12,
  zIndex: 20000,
  pointerEvents: "auto",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#2d8cff",
  color: "#fff",
  cursor: "pointer",
  fontSize: "16px",
  minWidth: 160,
};


