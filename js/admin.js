import { api } from "./api.js";
import { connectWS } from "./ws.js";

const token = localStorage.getItem("token");

if (!token) {
  location.replace("/login.html");
}

/* ================= LOANS ================= */
async function loadLoans() {
  const loans = await api("/admin/loans");
  loanList.innerHTML = loans.map(l => `
    <tr>
      <td>${l.email}</td>
      <td>$${l.amount}</td>
      <td>${l.status}</td>
      <td>
        <button onclick="setLoan(${l.id},'approved')">Approve</button>
        <button onclick="setLoan(${l.id},'rejected')">Reject</button>
      </td>
    </tr>
  `).join("");
}

window.setLoan = async (id, status) => {
  await api("/admin/loan-status", "POST", { loan_id: id, status });
  loadLoans();
};

/* ================= WITHDRAWALS ================= */
async function loadWithdrawals() {
  const list = await api("/admin/withdrawals");

  withdrawList.innerHTML = list.map(w => `
    <div class="card">
      <b>${w.user_email}</b><br>
      $${w.amount} — ${w.status} (${w.progress}%)

      ${w.status === "fee_required"
        ? `<button onclick="confirmFee(${w.id})">Confirm Gas Fee</button>`
        : ""}

      ${w.status === "verification_hold"
        ? `<button onclick="verifyWithdraw(${w.id})">Verify</button>
           <button onclick="rejectWithdraw(${w.id})">Reject</button>`
        : ""}
    </div>
  `).join("");
}

window.confirmFee = id =>
  api("/admin/withdraw/confirm-fee", "POST", { id }).then(loadWithdrawals);

window.verifyWithdraw = id =>
  api("/admin/withdraw/verify", "POST", { id }).then(loadWithdrawals);

window.rejectWithdraw = id =>
  api("/admin/withdraw/reject", "POST", { id }).then(loadWithdrawals);

/* ================= LOGS ================= */
async function loadLogs() {
  const logs = await api("/admin/logs");
  auditLogs.innerHTML = logs.map(l => `
    <div>${l.email} → ${l.action}</div>
  `).join("");
}

/* ================= WS REFRESH ================= */
connectWS({
  isAdmin: true,
  onMessage() {
    loadLoans();
    loadWithdrawals();
    loadLogs();
  }
});

/* INIT */
loadLoans();
loadWithdrawals();
loadLogs();

(async () => {
  const res = await authFetch(API + "/users/me");
  const user = await res.json();

  if (!user.is_admin) {
    alert("Access denied");
    logout();
  }
})();

export async function api(url, method="GET", body){
  const token = localStorage.getItem("token");

  const res = await fetch(API_BASE + url, {
    method,
    headers:{
      "Content-Type":"application/json",
      Authorization: "Bearer " + token
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if(res.status === 401){
    localStorage.clear();
    alert("Session expired. Please sign in again.");
    location.href = "signin.html";
    throw new Error("Session expired");
  }

  return res.json();
}