import React from "react";
import { header, statusRow, statusDot } from "./lobbyStyles";

type Props = { connected: boolean };

export default function LobbyHeader({ connected }: Props) {
  return (
    <div style={header}>
      <div style={{ fontWeight: 700, fontSize: 18 }}>Lobby</div>
      <div style={statusRow}>
        <div style={{ ...statusDot, background: connected ? "#25c26b" : "#d33" }} />
        <div style={{ fontSize: 12, opacity: 0.9 }}>{connected ? "Connected" : "Disconnected"}</div>
      </div>
    </div>
  );
}
