import React from "react";

export default function Hud() {
  return (
    <div style={hudStyle} aria-hidden>
      <div style={{ fontWeight: 700 }}>Score: 0</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>FPS: --</div>
    </div>
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
