let ws: WebSocket | null = null;

export function connect(url = "ws://localhost:3000") {
  if (ws) return;
  try {
    ws = new WebSocket(url);
    ws.onopen = () => console.log("network: connected to", url);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
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
  if (!ws) return;
  ws.send(message);
}

export function sendInput(playerId: number, action: string) {
  if (!ws) return;
  const msg = JSON.stringify({ type: "input", playerId, action });
  ws.send(msg);
}

export function register(playerId: number) {
  if (!ws) return;
  const msg = JSON.stringify({ type: "register", playerId });
  ws.send(msg);
}

export function ping() {
  if (!ws) return;
  ws.send(JSON.stringify({ type: "ping" }));
}
