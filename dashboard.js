(function(){

/* ================= CONFIG ================= */

const API = "https://api.cryptodigitalpro.com";
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

if (!token) {
  window.location.href = "signin.html";
  return;
}

/* ================= REALTIME SOCKET ================= */

let socket = null;

if (window.io) {
  socket = io(API, { transports:["websocket","polling"] });

  socket.on("connect", ()=>{
    if(userId) socket.emit("register", userId);
  });

  socket.on("loan_update", data=>{
    addNotification(data.message || "Loan update received");
    refreshDashboard();
  });

  socket.on("withdraw_update", data=>{
    addNotification(data.message || "Withdrawal update received");
    refreshDashboard();
  });
}

/* ================= ELEMENTS ================= */

const withdrawBtn = document.getElementById("withdrawBtn");
const progressBar = document.getElementById("withdrawProgress");
const progressWrap = document.getElementById("withdrawProgressWrap");
const withdrawModal = document.getElementById("withdrawModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const rejectionBox = document.getElementById("withdrawRejectionContainer");

const chatModal = document.getElementById("messageModal");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("adminMessageText");
const sendChatBtn = document.getElementById("sendAdminMessage");

const badge = document.getElementById("notifyCount");
const notifyList = document.querySelector(".notify-list");
const toastContainer = document.getElementById("toastContainer");

let notifyCount = 0;
let currentWithdrawal = null;
let pollingInterval = null;

/* ================= NOTIFICATIONS ================= */

function addNotification(msg){

  notifyCount++;
  if(badge) badge.innerText = notifyCount;

  if(notifyList){
    const item=document.createElement("div");
    item.style.padding="8px";
    item.style.borderBottom="1px solid #1f2937";
    item.innerText=msg;
    notifyList.prepend(item);
  }

  if(toastContainer){
    const toast=document.createElement("div");
    toast.className="toast";
    toast.innerText=msg;
    toastContainer.appendChild(toast);
    setTimeout(()=>toast.remove(),4000);
  }
}

/* ================= LOGOUT ================= */

const logoutBtn = document.getElementById("logoutBtn");
if(logoutBtn){
  logoutBtn.addEventListener("click",()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href="signin.html";
  });
}

/* ================= SAFE API ================= */

async function api(url, options = {}) {
  try {

    const res = await fetch(API + url, {
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      ...options
    });

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      window.location.href = "signin.html";
      return null;
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API returned non JSON:", await res.text());
      return null;
    }

    return await res.json();

  } catch (err) {
    console.error("API Error:", err);
    return null;
  }
}

/* ================= WITHDRAW ================= */

if (withdrawBtn) {
  withdrawBtn.addEventListener("click", async () => {

    const data = await api("/api/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount: 1000 })
    });

    if (!data || !data.withdrawal) {
      alert(data?.message || "Withdrawal failed.");
      return;
    }

    currentWithdrawal = data.withdrawal;

    progressWrap.style.display = "block";
    animateProgress(40);

    showModal(
      "Withdrawal Processing",
      "Your withdrawal request is being processed."
    );

    startPolling();
  });
}

/* ================= POLLING ================= */

function startPolling(){

  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {

    const data = await api("/api/withdraw");
    if (!data || !data.withdrawal) return;

    const status = data.withdrawal.status;

    if (status === "processing") animateProgress(70);

    if (status === "completed") {
      animateProgress(100);
      showModal("Withdrawal Completed","Funds released successfully.");
      clearInterval(pollingInterval);
    }

    if (status === "rejected") {
      clearInterval(pollingInterval);
      showRejection(data.withdrawal.rejectionReason);
    }

  }, 5000);
}

/* ================= PROGRESS ================= */

function animateProgress(target){
  if (!progressBar) return;

  let current = parseInt(progressBar.style.width) || 0;

  const interval = setInterval(()=>{
    if(current >= target){
      clearInterval(interval);
    } else {
      current++;
      progressBar.style.width = current + "%";
      progressBar.innerText = current + "%";
    }
  }, 20);
}

/* ================= MODAL ================= */

function showModal(title,msg){
  if (!withdrawModal) return;

  modalTitle.innerText = title;
  modalMessage.innerText = msg;
  withdrawModal.classList.remove("hidden");
}

/* ================= REJECTION ================= */

function showRejection(reason){
  rejectionBox.innerHTML = `
    <div class="rejection-box">
      <strong>Withdrawal Rejected:</strong><br/>
      ${reason || "Compliance requirements not met."}
      <br/><br/>
      <button class="btn" id="contactAdminBtn">
        Contact Admin
      </button>
    </div>
  `;

  document.getElementById("contactAdminBtn")
    .addEventListener("click", openChat);
}

/* ================= CHAT ================= */

function openChat(){
  if (!chatModal) return;
  chatModal.classList.remove("hidden");
  loadChat();
}

async function loadChat(){
  const messages = await api("/api/support-messages");
  if(!messages || !Array.isArray(messages)) return;

  chatMessages.innerHTML = messages.map(m=>`
    <div class="${m.sender==='admin'?'chat-admin':'chat-user'}">
      <strong>${m.sender}:</strong> ${m.message}
    </div>
  `).join("");

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (sendChatBtn) {
  sendChatBtn.addEventListener("click", async ()=>{
    const msg = chatInput.value.trim();
    if(!msg) return;

    await api("/api/support-message",{
      method:"POST",
      body:JSON.stringify({
        withdrawalId: currentWithdrawal?._id,
        message: msg
      })
    });

    chatInput.value="";
    loadChat();
  });
}

/* ================= DASHBOARD LOAD ================= */

async function loadDashboard(){

  const data = await api("/api/dashboard");
  if (!data) return;

  if (data.balances) {
    document.getElementById("availableBox").innerText =
      "$" + (data.balances.available || 0);

    document.getElementById("depositedBox").innerText =
      "$" + (data.balances.deposited || 0);

    document.getElementById("outstandingBox").innerText =
      "$" + (data.balances.outstanding || 0);

    document.getElementById("withdrawnBox").innerText =
      "$" + (data.balances.withdrawn || 0);
  }

  const loanContainer = document.getElementById("loanContainer");

  if (loanContainer && data.loans && data.loans.length > 0) {

    loanContainer.innerHTML = data.loans.map(loan => {

      const statusColor =
        loan.status === "approved" ? "#16a34a" :
        loan.status === "rejected" ? "#dc2626" :
        loan.status === "pending" ? "#f59e0b" :
        "#3b82f6";

      return `
        <div class="loan-card" style="
          background:#0f172a;
          padding:20px;
          border-radius:10px;
          margin-bottom:15px;
          border-left:5px solid ${statusColor};
        ">
          <h3>${loan.loanType || "Loan Application"}</h3>
          <p><strong>Amount:</strong> $${loan.amount}</p>
          <p><strong>Status:</strong>
            <span style="color:${statusColor};font-weight:bold;">
              ${loan.status.toUpperCase()}
            </span>
          </p>
          <button class="btn"
            onclick='window.openLoanDetails(${JSON.stringify(loan)})'>
            View Details
          </button>
        </div>
      `;
    }).join("");

  } else if (loanContainer) {
    loanContainer.innerHTML =
      `<div style="padding:15px;background:#1e293b;border-radius:8px;">
        No loan applications found.
      </div>`;
  }
}

window.refreshDashboard = loadDashboard;

/* ================= LOAN DETAILS ================= */

window.openLoanDetails = function(loan){

  const modal = document.getElementById("loanDetailsModal");
  const timeline = document.getElementById("loanTimeline");
  const notes = document.getElementById("loanAdminNotes");
  const title = document.getElementById("loanModalTitle");

  title.innerText = (loan.loanType || "Loan") + " - $" + loan.amount;

  const steps = ["pending","review","approved"];
  const rejectedSteps = ["pending","review","rejected"];
  const activeSteps =
    loan.status === "rejected" ? rejectedSteps : steps;

  timeline.innerHTML = activeSteps.map(step => {

    const isActive =
      activeSteps.indexOf(step) <= activeSteps.indexOf(loan.status);

    const color = step === "rejected" ? "#dc2626" : "#16a34a";

    return `
      <div style="margin-bottom:10px;">
        <span style="
          display:inline-block;
          width:12px;
          height:12px;
          border-radius:50%;
          margin-right:8px;
          background:${isActive ? color : "#334155"};
        "></span>

        <strong style="color:${isActive ? color : "#94a3b8"};">
          ${step.toUpperCase()}
        </strong>
      </div>
    `;
  }).join("");

  notes.innerHTML = `
    <strong>Admin Notes:</strong><br/>
    ${loan.adminNotes || "No notes provided yet."}
  `;

  modal.classList.remove("hidden");
};

window.closeLoanModal = function(){
  document.getElementById("loanDetailsModal")
    .classList.add("hidden");
};

/* ================= INIT ================= */

loadDashboard();

})();