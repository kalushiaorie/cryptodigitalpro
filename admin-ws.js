const ws = new WebSocket("wss://cryptodigitalpro-api.onrender.com");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "notification") {
    alert("ADMIN ALERT: " + data.message);
  }
};
