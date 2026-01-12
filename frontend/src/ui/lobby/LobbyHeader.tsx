import React from "react";
import { header, statusRow, statusDot } from "./lobbyStyles";

type Props = { connected: boolean; maxPlayers?: number; isRegistered?: boolean; registrationError?: string | null };

export default function LobbyHeader({ connected, maxPlayers, isRegistered, registrationError }: Props) {
  let dotColor = "#d33";
  let label = "Disconnected";
  if (connected) {
    if (isRegistered) {
      dotColor = "#25c26b";
      label = "Connected";
    } else if (registrationError) {
      dotColor = "#f39c12"; // orange
      label = `Registration failed`;
    } else {
      dotColor = "#f1c40f"; // yellow
      label = "Connected (unregistered)";
    }
  }

  return (
    <div style={header}>
      <div style={{ fontWeight: 700, fontSize: 18 }}>Lobby</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={statusRow}>
          <div style={{ ...statusDot, background: dotColor }} />
          <div style={{ fontSize: 12, opacity: 0.9 }}>{label}</div>
        </div>
        {typeof maxPlayers === "number" && (
          <div style={{ fontSize: 12, opacity: 0.9 }}>Max players: {maxPlayers}</div>
        )}
        {registrationError && <div style={{ fontSize: 12, color: "#ff7b7b" }}>{registrationError}</div>}
      </div>
    </div>
  );
}
