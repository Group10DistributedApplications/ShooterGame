import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { connect, disconnect, SERVER_URL, isConnected } from "../network";

const STORAGE_KEY = "sg_servers";

function loadServers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveServers(list: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

export default function Lobby({ containerEl }: { containerEl?: HTMLElement | null } = {}) {
  const [url, setUrl] = useState<string>("localhost");
  const [recent, setRecent] = useState<string[]>([]);
  const [connected, setConnected] = useState<boolean>(isConnected());

  useEffect(() => {
    setRecent(loadServers());
  }, []);

  useEffect(() => {
    const id = setInterval(() => setConnected(isConnected()), 500);
    return () => clearInterval(id);
  }, []);

  function handleConnect() {
    const full = normalizeUrl(url);
    connect(full);
    const next = [full, ...recent.filter((r) => r !== full)].slice(0, 6);
    setRecent(next);
    saveServers(next);
    setConnected(true);
  }

  function handleDisconnect() {
    disconnect();
    setConnected(false);
  }

  function useRecent(r: string) {
    // r is normalized (ws://host:port)
    setUrl(stripProtocolPort(r));
    connect(r);
    const next = [r, ...recent.filter((x) => x !== r)].slice(0, 6);
    setRecent(next);
    saveServers(next);
    setConnected(true);
  }

  const lobbyEl = (
    <div style={container}>
      <div style={box}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Lobby</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            aria-label="server-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={input}
          />
          <button onClick={handleConnect} disabled={connected} style={btn}>
            Connect
          </button>
          <button onClick={handleDisconnect} disabled={!connected} style={btn}>
            Disconnect
          </button>
        </div>

        {recent.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Recent</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recent.map((r) => (
                <div key={r} style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => useRecent(r)} style={smallButton}>
                    Join
                  </button>
                  <div style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stripProtocolPort(r)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    // Always mount into document.body as a fixed overlay so Phaser won't remove it
    return createPortal(lobbyEl, document.body);
  }
  return lobbyEl;
}

function normalizeUrl(input: string): string {
  const s = (input || "").trim();
  if (!s) return SERVER_URL;
  try {
    if (s.startsWith("ws://") || s.startsWith("wss://")) {
      const u = new URL(s);
      const port = u.port || "3000";
      return `${u.protocol}//${u.hostname}:${port}`;
    }
    if (s.startsWith("http://") || s.startsWith("https://")) {
      const u = new URL(s);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      const port = u.port || "3000";
      return `${proto}//${u.hostname}:${port}`;
    }
  } catch (e) {
    // fallthrough
  }

  // host:port or host
  const parts = s.split(":");
  if (parts.length === 2 && parts[1]) {
    return `ws://${parts[0]}:${parts[1]}`;
  }
  return `ws://${s}:3000`;
}

function stripProtocolPort(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.port ? `:${u.port}` : "");
  } catch (e) {
    return url;
  }
}

const container: React.CSSProperties = {
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

const box: React.CSSProperties = {
  background: "#0b0b0b",
  color: "#fff",
  padding: 12,
  borderRadius: 6,
  width: 360,
  fontFamily: "sans-serif",
};

const input: React.CSSProperties = {
  flex: 1,
  padding: 6,
  borderRadius: 4,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#111",
  color: "#fff",
};

const btn: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 4,
  border: "none",
  background: "#2d8cff",
  color: "#fff",
  cursor: "pointer",
};

const smallButton: React.CSSProperties = {
  padding: "4px 6px",
  borderRadius: 4,
  border: "none",
  background: "#2d8cff",
  color: "#fff",
  cursor: "pointer",
};
