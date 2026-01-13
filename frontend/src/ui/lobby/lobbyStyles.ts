import React from "react";

export const container: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingLeft: 16,
  zIndex: 9999,
  pointerEvents: "auto",
};

export const box: React.CSSProperties = {
  background: "#0b0b0b",
  color: "#fff",
  padding: 12,
  borderRadius: 6,
  width: 360,
  fontFamily: "sans-serif",
};

export const input: React.CSSProperties = {
  flex: 1,
  padding: 6,
  borderRadius: 4,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#111",
  color: "#fff",
};

export const btn: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 4,
  border: "none",
  background: "#2d8cff",
  color: "#fff",
  cursor: "pointer",
};

export const smallButton: React.CSSProperties = {
  padding: "4px 6px",
  borderRadius: 4,
  border: "none",
  background: "#2d8cff",
  color: "#fff",
  cursor: "pointer",
};

export const btnSecondary: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
};

export const btnDisabled: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 4,
  border: "none",
  background: "#444",
  color: "#bbb",
  cursor: "not-allowed",
  opacity: 0.8,
};

export const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const statusRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export const statusDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 10,
  boxShadow: "0 0 6px rgba(0,0,0,0.6)",
};

export const serverRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 8px",
  borderRadius: 6,
  background: "rgba(255,255,255,0.02)",
};

export const serverIcon: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  background: "rgba(255,255,255,0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  color: "#fff",
};

export const removeButton: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  opacity: 0.7,
};
