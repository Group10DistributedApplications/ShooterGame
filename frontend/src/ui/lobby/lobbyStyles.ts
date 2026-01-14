import React from "react";

export const container: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: 0,
  zIndex: 9999,
  pointerEvents: "auto",
  background: "radial-gradient(120% 140% at 20% 20%, rgba(45,140,255,0.12), transparent 45%), radial-gradient(120% 140% at 80% 0%, rgba(255,108,0,0.08), transparent 40%), #05060a",
};

export const box: React.CSSProperties = {
  background: "rgba(11,11,14,0.94)",
  color: "#f5f7ff",
  padding: 16,
  borderRadius: 12,
  width: 420,
  fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

export const input: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
  color: "#f8fbff",
  fontWeight: 500,
};

export const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #2d8cff, #2da1ff)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  letterSpacing: 0.2,
  boxShadow: "0 12px 30px rgba(45,140,255,0.25)",
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
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04))",
  color: "#f5f7ff",
  cursor: "pointer",
  fontWeight: 700,
  letterSpacing: 0.2,
};

export const btnDisabled: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
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

export const controlsColumn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 10,
};

export const fieldRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 200px",
  gap: 10,
};

export const buttonRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};
