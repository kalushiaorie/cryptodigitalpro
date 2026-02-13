import { api } from "./admin.js";

/* ================= RENDER ================= */

function renderLoanCard(loan){
  return `
    <div class="loan-card">
      <h4>
        Loan #${loan.id} —
        <span class="status ${loan.status}">${loan.status.toUpperCase()}</span>
      </h4>

      <p><b>User:</b> ${loan.email}</p>
      <p><b>Amount:</b> $${loan.amount}</p>

      ${renderLoanActions(loan)}
    </div>
  `;
}

function renderLoanActions(loan){
  if(loan.status === "pending"){
    return `
      <button class="btn green" onclick="approveLoan(${loan.id})">Approve</button>
      <button class="btn red" onclick="rejectLoan(${loan.id})">Reject</button>
    `;
  }

  if(loan.status === "approved"){
    return `
      <div class="warning">⚠️ Credit is irreversible</div>

      <input id="amt-${loan.id}" type="number" value="${loan.amount}" />
      <input id="reason-${loan.id}" placeholder="Approval reason" />
      <label>
        <input type="checkbox" id="confirm-${loan.id}" /> I confirm
      </label><br/>

      <button class="btn danger"
        onclick="creditLoan(${loan.id},${loan.user_id})">
        Credit Balance
      </button>
    `;
  }

  return `<i>No actions available</i>`;
}

/* ================= LOAD ================= */

async function loadLoans(){
  const loans = await api("/admin/loans");
  document.getElementById("loanList").innerHTML =
    loans.map(renderLoanCard).join("");
}

async function loadLogs(){
  const logs = await api("/admin/logs");
  document.getElementById("auditLogs").innerHTML =
    logs.map(l =>
      `<div>${l.email} → ${l.action}
       <small>${new Date(l.created_at).toLocaleString()}</small></div>`
    ).join("");
}

async function loadChart(){
  const s = await api("/admin/analytics");
  new Chart(document.getElementById("loanChart"),{
    type:"bar",
    data:{
      labels:["Total Loans","Pending"],
      datasets:[{
        label:"Stats",
        data:[s.totalLoans,s.pendingLoans]
      }]
    }
  });
}

/* ================= ACTIONS ================= */

window.approveLoan = async id => {
  await api("/admin/loan-status","POST",{loan_id:id,status:"approved"});
  loadLoans();
};

window.rejectLoan = async id => {
  await api("/admin/loan-status","POST",{loan_id:id,status:"rejected"});
  loadLoans();
};

/* 🔥 SAFE CREDIT (SINGLE PATH) */
window.creditLoan = async (loanId,userId)=>{
  const amount = Number(document.getElementById(`amt-${loanId}`).value);
  const reason = document.getElementById(`reason-${loanId}`).value;
  const confirm = document.getElementById(`confirm-${loanId}`).checked;

  if(!confirm) return alert("Confirm irreversible action");
  if(!reason)  return alert("Reason required");

  await api("/admin/balance/adjust","POST",{userId,amount,reason});
  await api("/admin/loan-status","POST",{loan_id:loanId,status:"credited"});

  location.reload(); // safest post-money UX
};

/* ================= INIT ================= */
loadLoans();
loadLogs();
loadChart();