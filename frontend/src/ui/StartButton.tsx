import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import * as net from "../network";

type Props = { targetEl?: HTMLElement | null };

export default function StartButton({ targetEl }: Props) {
  const [connected, setConnected] = useState<boolean>(net.isConnected());
  const [registered, setRegistered] = useState<boolean>(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const unsubConn = net.onConnectionChange((c) => setConnected(c));
    const unsubReg = net.onRegistered(() => setRegistered(true));
    return () => {
      try { unsubConn(); } catch (_) {}
      try { unsubReg(); } catch (_) {}
    };
  }, []);

  function handleStart() {
    try { console.log("ui: Start button clicked (portal)"); } catch (_) {}
    try { console.log("ui: connected=", connected, "registered=", registered); } catch (_) {}
    net.sendStartGame();
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
      const bw = btnRef.current.offsetWidth || 100;
      const top = rect.top + 12;
      const left = rect.left + rect.width - 12 - bw;
      setPos({ top, left });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const obs = new MutationObserver(update);
    if (targetEl) obs.observe(targetEl, { attributes: true, childList: false, subtree: false });
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); obs.disconnect(); };
  }, [targetEl]);

  const btn = (
    <div style={{ ...portalWrapperStyle, top: pos ? pos.top : undefined, left: pos ? pos.left : undefined }}>
      <button ref={btnRef} onClick={handleStart} style={{ ...buttonStyle, opacity }}>
        Start Game
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
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "#2d8cff",
  color: "#fff",
  cursor: "pointer",
};


