import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { connect, disconnect, isConnected, setGameId, onConnectionChange } from "../../network";
import LobbyHeader from "./LobbyHeader";
import ServerList from "./ServerList";
import LobbyControls from "./LobbyControls";
import { container, box } from "./lobbyStyles";
import { loadServers, saveServers, normalizeUrl, stripProtocolPort } from "./lobbyUtils";

function useRecentServers() {
  const [recent, setRecent] = useState<string[]>(() => loadServers());

  useEffect(() => {
    setRecent(loadServers());
  }, []);

  const add = useCallback((s: string) => {
    setRecent((prev) => {
      const next = [s, ...prev.filter((r) => r !== s)].slice(0, 6);
      saveServers(next);
      return next;
    });
  }, []);

  const remove = useCallback((s: string) => {
    setRecent((prev) => {
      const next = prev.filter((r) => r !== s);
      saveServers(next);
      return next;
    });
  }, []);

  return { recent, add, remove };
}

type Props = { containerEl?: HTMLElement | null };

export default function Lobby({ containerEl }: Props = {}) {
  const { recent, add, remove } = useRecentServers();
  const [url, setUrl] = useState<string>(() => {
    try {
      if (typeof window !== "undefined" && window.location) {
        const host = window.location.hostname;
        const pageDefault = `${host}:3000`;
        return pageDefault;
      }
      const rec = loadServers();
      if (rec && rec.length > 0) {
        return stripProtocolPort(rec[0]);
      }
    } catch (e) {}
    return "localhost";
  });

  const [connected, setConnected] = useState<boolean>(isConnected());

  useEffect(() => {
    const unsub = onConnectionChange((c) => setConnected(c));
    setConnected(isConnected());
    return unsub;
  }, []);

  function handleConnect() {
    const full = normalizeUrl(url);
    connect(full);
    setGameId(stripProtocolPort(full));
    add(full);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleConnect();
  }

  function handleDisconnect() {
    disconnect();
    setConnected(false);
  }

  function useRecent(r: string) {
    setUrl(stripProtocolPort(r));
    connect(r);
    setGameId(stripProtocolPort(r));
    add(r);
  }

  function removeRecent(r: string) {
    remove(r);
  }

  const lobbyEl = (
    <div style={container}>
      <div style={box}>
        <LobbyHeader connected={connected} />
        <LobbyControls url={url} onChange={setUrl} onKeyDown={handleKey} onConnect={handleConnect} onDisconnect={handleDisconnect} connected={connected} />
        <ServerList items={recent} onUse={useRecent} onRemove={removeRecent} />
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(lobbyEl, document.body);
  }
  return lobbyEl;
}
