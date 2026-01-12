import React from "react";
import { input, btn, btnSecondary, btnDisabled } from "./lobbyStyles";

type Props = {
  url: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connected: boolean;
};

export default function LobbyControls({ url, onChange, onKeyDown, onConnect, onDisconnect, connected }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input aria-label="server-url" value={url} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder="host:port or ws://host:port" style={input} />
      <button onClick={onConnect} disabled={connected} style={connected ? btnDisabled : btn}>Connect</button>
      <button onClick={onDisconnect} disabled={!connected} style={!connected ? btnDisabled : btnSecondary}>Disconnect</button>
    </div>
  );
}
