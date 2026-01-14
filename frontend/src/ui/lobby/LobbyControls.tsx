import React from "react";
import { input, btn, btnSecondary, btnDisabled } from "./lobbyStyles";

type Props = {
  url: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connected: boolean;
  mapId: string;
  onMapChange: (mapId: string) => void;
  maps: Array<{ id: string; label: string }>;
};

export default function LobbyControls({ url, onChange, onKeyDown, onConnect, onDisconnect, connected, mapId, onMapChange, maps }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input aria-label="server-url" value={url} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder="host:port or ws://host:port" style={input} />
      <select aria-label="map-select" value={mapId} onChange={(e) => onMapChange(e.target.value)} style={{ ...input, maxWidth: 180 }}>
        {maps.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
      <button onClick={onConnect} disabled={connected} style={connected ? btnDisabled : btn}>Connect</button>
      <button onClick={onDisconnect} disabled={!connected} style={!connected ? btnDisabled : btnSecondary}>Disconnect</button>
    </div>
  );
}
