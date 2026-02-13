const token = localStorage.getItem("token");
if (!token) return;

const ws = new WebSocket("wss://cryptodigitalpro-api.onrender.com");

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "identify",
    token
  }));
};

ws.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.type === "loan_status") {
    const el = document.getElementById("loanStatus");
    el.textContent = data.status.toUpperCase();
    el.className = "status-badge " + data.status;
  }

  if (data.type === "notification") {
    showToast(data.message);
  }
};

function showToast(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:#111;
    color:#fff;
    padding:12px 16px;
    border-radius:8px;
    box-shadow:0 8px 30px rgba(0,0,0,.6);
    z-index:9999;
  `;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),5000);
}

