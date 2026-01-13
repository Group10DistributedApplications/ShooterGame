// can change to your server IP if needed
// Example: export const SERVER_URL = "ws://192.168.1.23:3000";
export const SERVER_URL = "ws://localhost:3000";

let ws: WebSocket | null = null;
let sendQueue: string[] = [];
let connectionHandlers: Array<(connected: boolean) => void> = [];
let registeredHandlers: Array<(playerId: number) => void> = [];
let errorHandlers: Array<(message: string) => void> = [];
let gameOverHandlers: Array<(msg: any) => void> = [];
let gameStartHandlers: Array<() => void> = [];

export function connect(url = SERVER_URL) {
  if (ws) return;
  try {
    ws = new WebSocket(url);
    ws.onopen = () => {
      console.log("network: connected to", url);
      connectionHandlers.forEach((h) => h(true));
      // flush queued messages
      while (sendQueue.length > 0) {
        const m = sendQueue.shift()!;
        try { ws!.send(m); } catch (e) { console.error("network: flush send failed", e); }
      }
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (!data || !data.type) return;

        switch (data.type) {
          case "state":
            stateHandlers.forEach((h) => h(data));
            break;
          case "registered":
            registeredHandlers.forEach((h) => h(data.playerId));
            break;
          case "game_over":
            gameOverHandlers.forEach((h) => h(data));
            break;
          case "game_start":
            gameStartHandlers.forEach((h) => h());
            break;
          case "error":
            errorHandlers.forEach((h) => h(data.message || ""));
            break;
          default:
            // unknown message types are ignored by default
            break;
        }
        return;
      } catch (e) {
        console.log("network: message (raw)", ev.data);
      }
    };
    ws.onclose = () => {
      console.log("network: closed");
      connectionHandlers.forEach((h) => h(false));
      ws = null;
    };
    ws.onerror = (e) => console.error("network: error", e);
  } catch (err) {
    console.error("network: connect failed", err);
    ws = null;
  }
}

let currentGameId: string | undefined = undefined;

export function setGameId(id: string | undefined) {
  currentGameId = id;
}

export function getGameId(): string | undefined {
  return currentGameId;
}

export function disconnect() {
  if (!ws) return;
  ws.close();
  connectionHandlers.forEach((h) => h(false));
  ws = null;
}

export function sendRaw(message: string) {
  if (!ws) {
    sendQueue.push(message);
    return;
  }
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  } else {
    sendQueue.push(message);
  }
}

export function sendInput(playerId: number, action: string, payload?: any) {
  const msg = JSON.stringify({ type: "input", playerId, action, payload });
  sendRaw(msg);
}

export function register(playerId: number, gameId?: string) {
  const payload: any = { type: "register", playerId };
  if (gameId) payload.gameId = gameId;
  const msg = JSON.stringify(payload);
  sendRaw(msg);
}

// Track last registered local player id so UI can send player-scoped commands
let _localPlayerId: number | null = null;
export function getLocalPlayerId(): number | null {
  return _localPlayerId;
}

// Wrap register to set the tracked id then send register message
export function registerLocal(playerId: number, gameId?: string) {
  _localPlayerId = playerId;
  try { console.log("network: registerLocal ->", playerId, gameId); } catch (_) {}
  register(playerId, gameId);
}

// Convenience helper to request game start (sends as an input action)
export function sendStartGame(payload?: string) {
  try { console.log("network: sendStartGame called, localId=", _localPlayerId, "payload=", payload); } catch (_) {}
  if (!_localPlayerId) return;
  sendInput(_localPlayerId, "START", payload || "");
}

export function ping() {
  sendRaw(JSON.stringify({ type: "ping" }));
}

let stateHandlers: Array<(state: any) => void> = [];

export function onState(cb: (state: any) => void) {
  stateHandlers.push(cb);
  return () => {
    stateHandlers = stateHandlers.filter((h) => h !== cb);
  };
}

export function onGameOver(cb: (msg: any) => void) {
  gameOverHandlers.push(cb);
  return () => { gameOverHandlers = gameOverHandlers.filter(h => h !== cb); };
}

export function onGameStart(cb: () => void) {
  gameStartHandlers.push(cb);
  return () => { gameStartHandlers = gameStartHandlers.filter(h => h !== cb); };
}

export function onRegistered(cb: (playerId: number) => void) {
  registeredHandlers.push(cb);
  return () => { registeredHandlers = registeredHandlers.filter(h => h !== cb); };
}

export function onError(cb: (message: string) => void) {
  errorHandlers.push(cb);
  return () => { errorHandlers = errorHandlers.filter(h => h !== cb); };
}

export function onConnectionChange(cb: (connected: boolean) => void) {
  connectionHandlers.push(cb);
  return () => {
    connectionHandlers = connectionHandlers.filter((h) => h !== cb);
  };
}

export function isConnected(): boolean {
  return !!ws && ws.readyState === WebSocket.OPEN;
}
