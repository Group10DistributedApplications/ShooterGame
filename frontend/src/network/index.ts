let ws: WebSocket | null = null;
let sendQueue: string[] = [];

export function connect(url = "ws://localhost:3000") {
  if (ws) return;
  try {
    ws = new WebSocket(url);
    ws.onopen = () => {
      console.log("network: connected to", url);
      // flush queued messages
      while (sendQueue.length > 0) {
        const m = sendQueue.shift()!;
        try { ws!.send(m); } catch (e) { console.error("network: flush send failed", e); }
      }
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && data.type === "state") {
          // pass full state (players + projectiles) to handlers
          stateHandlers.forEach((h) => h(data));
          return;
        }
        // other message types can be handled here if needed
      } catch (e) {
        console.log("network: message (raw)", ev.data);
      }
    };
    ws.onclose = () => {
      console.log("network: closed");
      ws = null;
    };
    ws.onerror = (e) => console.error("network: error", e);
  } catch (err) {
    console.error("network: connect failed", err);
    ws = null;
  }
}

export function disconnect() {
  if (!ws) return;
  ws.close();
  ws = null;
}

export function sendRaw(message: string) {
  if (!ws) {
    connect();
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

export function register(playerId: number) {
  const msg = JSON.stringify({ type: "register", playerId });
  sendRaw(msg);
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
