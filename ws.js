export function connectWS({ userId = null, isAdmin = false, onMessage }) {
  const ws = new WebSocket("wss://cryptodigitalpro-api.onrender.com");

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "identify",
      userId,
      isAdmin
    }));
  };

  ws.onmessage = e => {
    const data = JSON.parse(e.data);
    onMessage?.(data);
  };

  return ws;
}
