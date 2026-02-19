(function(){

/* ================= CONFIG ================= */

// ✅ USE YOUR LIVE BACKEND
const API = "https://api.cryptodigitalpro.com";

const token = localStorage.getItem("token");
const hasAppliedLoan = localStorage.getItem("hasAppliedLoan");

// 🔒 Block if not logged in
if (!token) {
  window.location.href = "signin.html";
  return;
}

// 🔒 Block if loan not submitted
if (!hasAppliedLoan) {
  window.location.href = "loan-form.html";
  return;
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

let currentWithdrawal = null;
let pollingInterval = null;

/* ================= API ================= */

async function api(url, options = {}) {
  try {
    const res = await fetch(API + url, {
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      ...options
    });

    // 🔒 Auto logout if token invalid
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "signin.html";
      return {};
    }

    return await res.json();
  } catch (err) {
    console.error("API Error:", err);
    return {};
  }
}

/* ================= WITHDRAW ================= */

if (withdrawBtn) {
  withdrawBtn.addEventListener("click", async () => {

    const data = await api("/api/withdraw", {
      method: "POST",
      body: JSON.stringify({
        amount: 1000
      })
    });

    if (!data || !data.withdrawal) {
      alert(data.message || "Withdrawal failed.");
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

/* ================= AUTO POLLING ================= */

function startPolling() {

  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {

    if (!currentWithdrawal) return;

    const data = await api("/api/withdraw");

    if (!data || !data.withdrawal) return;

    const status = data.withdrawal.status;

    if (status === "processing") {
      animateProgress(70);
    }

    if (status === "completed") {
      animateProgress(100);
      showModal(
        "Withdrawal Completed",
        "Funds released successfully."
      );
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

  progressBar.classList.add("progress-pulse");

  let current = parseInt(progressBar.style.width) || 0;

  const interval = setInterval(()=>{
    if(current >= target){
      clearInterval(interval);
      progressBar.classList.remove("progress-pulse");
    } else {
      current++;
      progressBar.style.width = current + "%";
      progressBar.innerText = current + "%";
    }
  }, 20);
}

/* ================= MODAL ================= */

function showModal(title, msg){
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

/* ================= CHAT SYSTEM ================= */

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

/* ================= LOAD DASHBOARD ================= */

(async function init(){

  const data = await api("/api/dashboard");

  if (!data || !data.balances) return;

  document.getElementById("availableBox")
    .innerText = "$" + (data.balances.available || 0);

  document.getElementById("depositedBox")
    .innerText = "$" + (data.balances.deposited || 0);

  document.getElementById("outstandingBox")
    .innerText = "$" + (data.balances.outstanding || 0);

  document.getElementById("withdrawnBox")
    .innerText = "$" + (data.balances.withdrawn || 0);

})();

})();
