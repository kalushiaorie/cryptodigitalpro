const API = "https://cryptodigitalpro-api.onrender.com";
const token = localStorage.getItem("token");

const loanList = document.getElementById("loanList");
const withdrawList = document.getElementById("withdrawList");
const kycList = document.getElementById("kycList");
const auditLogs = document.getElementById("auditLogs");
const toast = document.getElementById("toast");

let chartInstance = null;

/* ================= TOAST ================= */
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),3000);
}

/* ================= FETCH HELPER ================= */
async function fetchData(endpoint){
  const res = await fetch(API + endpoint,{
    headers:{ Authorization:"Bearer "+token }
  });
  return res.json();
}

/* ================= LOANS ================= */
async function loadLoans(){
  const loans = await fetchData("/api/admin/loans");
  loanList.innerHTML="";

  loans.forEach(l=>{
    loanList.innerHTML+=`
      <div class="loan-card">
        <strong>${l.user_email}</strong><br>
        $${l.amount} – ${l.duration} months<br>
        <span class="status ${l.status}">${l.status}</span>

        <div class="actions">
          <button class="btn green" onclick="updateLoan('${l._id}','approved')">Approve</button>
          <button class="btn red" onclick="updateLoan('${l._id}','rejected')">Reject</button>
          <button class="btn gray" onclick="updateLoan('${l._id}','credited')">Mark Credited</button>
        </div>
      </div>
    `;
  });
}

window.updateLoan = async (id,status)=>{
  await fetch(API+`/api/admin/loans/${id}`,{
    method:"PATCH",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    },
    body:JSON.stringify({status})
  });
  showToast("Loan updated");
  refreshAll();
};

/* ================= WITHDRAWALS ================= */
async function loadWithdrawals(){
  const data = await fetchData("/api/admin/withdrawals");
  withdrawList.innerHTML="";

  data.forEach(w=>{
    withdrawList.innerHTML+=`
      <div class="withdraw-card">
        <strong>${w.user_email}</strong><br>
        $${w.amount}<br>
        <span class="status ${w.status}">${w.status}</span>

        <div class="actions">
          <button class="btn green" onclick="updateWithdraw('${w._id}','approved')">Approve</button>
          <button class="btn red" onclick="updateWithdraw('${w._id}','rejected')">Reject</button>
        </div>
      </div>
    `;
  });
}

window.updateWithdraw = async(id,status)=>{
  await fetch(API+`/api/admin/withdrawals/${id}`,{
    method:"PATCH",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    },
    body:JSON.stringify({status})
  });
  showToast("Withdrawal updated");
  refreshAll();
};

/* ================= KYC CONTROL ================= */
async function loadKYC(){
  const kyc = await fetchData("/api/admin/kyc");
  kycList.innerHTML="";

  kyc.forEach(k=>{
    kycList.innerHTML+=`
      <div class="loan-card">
        <strong>${k.user_email}</strong><br>
        Status: <span class="status ${k.status}">${k.status}</span>

        <div class="actions">
          <button class="btn green" onclick="updateKYC('${k._id}','approved')">Approve</button>
          <button class="btn red" onclick="updateKYC('${k._id}','rejected')">Reject</button>
        </div>
      </div>
    `;
  });
}

window.updateKYC = async(id,status)=>{
  await fetch(API+`/api/admin/kyc/${id}`,{
    method:"PATCH",
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    },
    body:JSON.stringify({status})
  });
  showToast("KYC updated");
  refreshAll();
};

/* ================= ANALYTICS ================= */
async function loadAnalytics(){
  const data = await fetchData("/api/admin/analytics");

  if(chartInstance){
    chartInstance.destroy();
  }

  chartInstance = new Chart(document.getElementById("loanChart"),{
    type:"bar",
    data:{
      labels:["Pending","Approved","Credited","Rejected"],
      datasets:[{
        label:"Loans",
        data:[
          data.pending,
          data.approved,
          data.credited,
          data.rejected
        ],
        backgroundColor:["#facc15","#4ade80","#60a5fa","#ef4444"]
      }]
    }
  });
}

/* ================= AUDIT ================= */
async function loadAudit(){
  const logs = await fetchData("/api/admin/audit");
  auditLogs.innerHTML = logs.map(l=>`
    <div>${l.action} – ${l.user_email}</div>
  `).join("");
}

/* ================= REAL-TIME AUTO REFRESH ================= */

/* 🔥 Refresh Everything */
function refreshAll(){
  loadLoans();
  loadWithdrawals();
  loadKYC();
  loadAnalytics();
  loadAudit();
}

/* 🔥 WebSocket Live Updates */
const ws = new WebSocket("wss://cryptodigitalpro-api.onrender.com");

ws.onmessage = (event)=>{
  const data = JSON.parse(event.data);

  if(data.type==="loan_update" ||
     data.type==="withdraw_update" ||
     data.type==="kyc_update"){

    showToast("Live update received");
    refreshAll();
  }
};

/* ================= INIT ================= */
refreshAll();