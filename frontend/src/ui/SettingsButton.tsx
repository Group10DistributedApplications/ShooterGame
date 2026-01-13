import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = { targetEl?: HTMLElement | null; onToggle: () => void };

export default function SettingsButton({ targetEl, onToggle }: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    function update() {
      if (!targetEl || !btnRef.current) { setPos(null); return; }
      const rect = targetEl.getBoundingClientRect();
      const top = rect.top + 12;
      // compute distance from right edge of viewport to the right edge of the target
      const right = Math.max(12, window.innerWidth - (rect.left + rect.width) + 12);
      setPos({ top, right });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [targetEl]);

  const el = (
    <div style={{ position: "fixed", top: pos ? pos.top : 12, right: pos ? pos.right : 12, zIndex: 20000 }}>
      <button ref={btnRef} onClick={onToggle} style={buttonStyle} aria-label="open-lobby">
        ⚙️
      </button>
    </div>
  );

  if (typeof document !== "undefined") return createPortal(el, document.body);
  return el;
}

const buttonStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "none",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  cursor: "pointer",
};
