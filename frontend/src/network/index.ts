let ws: WebSocket | null = null;

export function connect(url = "ws://localhost:3000") {
  if (ws) return;
  try {
    ws = new WebSocket(url);
    ws.onopen = () => console.log("network: connected to", url);
    ws.onmessage = (ev) => console.log("network: message", ev.data);
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

export function send(message: string) {
  if (!ws) return;
  ws.send(message);
}
