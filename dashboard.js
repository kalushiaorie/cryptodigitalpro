(function(){

const API = "https://cryptodigitalpro-api.onrender.com";
const token = localStorage.getItem("token");

if(!token){
  window.location.href = "signin.html";
  return;
}

const withdrawBtn = document.getElementById("withdrawBtn");
const progressBar = document.getElementById("withdrawProgress");
const withdrawModal = document.getElementById("withdrawModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const rejectionBox = document.getElementById("rejectionReason");

const chatModal = document.getElementById("chatModal");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

let currentWithdrawal = null;
let pollingInterval = null;

/* ================= API ================= */

async function api(url, options={}){
  const res = await fetch(API+url,{
    headers:{
      "Authorization":"Bearer "+token,
      "Content-Type":"application/json"
    },
    ...options
  });
  return await res.json();
}

/* ================= WITHDRAW ================= */

withdrawBtn.addEventListener("click", async ()=>{

  const data = await api("/api/user/withdraw",{
    method:"POST",
    body:JSON.stringify({
      amount:1000,
      walletAddress:"USER_WALLET",
      network:"TRC20"
    })
  });

  currentWithdrawal = data.withdrawal;

  animateProgress(47);
  showModal("Network Broadcast Pending",
    "Waiting for admin broadcast approval...");

  startPolling();
});

/* ================= AUTO POLLING ================= */

function startPolling(){
  if(pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async ()=>{

    if(!currentWithdrawal) return;

    const data = await api("/api/user/withdraw/"+currentWithdrawal._id);

    if(data.status === "broadcast_approved"){
      animateProgress(73);
      showModal("Compliance Review",
        "Withdrawal under compliance review...");
    }

    if(data.status === "completed"){
      animateProgress(100);
      showModal("Withdrawal Completed",
        "Funds released successfully.");
      clearInterval(pollingInterval);
    }

    if(data.status === "rejected"){
      clearInterval(pollingInterval);
      showRejection(data.rejectionReason);
    }

  }, 4000);
}

/* ================= PROGRESS ANIMATION ================= */

function animateProgress(target){

  progressBar.classList.add("progress-pulse");

  let current = parseInt(progressBar.style.width) || 0;

  const interval = setInterval(()=>{
    if(current >= target){
      clearInterval(interval);
      progressBar.classList.remove("progress-pulse");
    } else {
      current++;
      progressBar.style.width = current+"%";
      progressBar.innerText = current+"%";
    }
  }, 15);
}

/* ================= MODAL ================= */

function showModal(title,msg){
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
      <button class="btn" onclick="openChat()">Contact Admin</button>
    </div>
  `;
}

/* ================= CHAT SYSTEM ================= */

window.openChat = function(){
  chatModal.classList.remove("hidden");
  loadChat();
};

async function loadChat(){
  const messages = await api("/api/user/support-messages");

  chatMessages.innerHTML = messages.map(m=>`
    <div class="${m.sender==='admin'?'chat-admin':'chat-user'}">
      <strong>${m.sender}:</strong> ${m.message}
    </div>
  `).join("");
}

document.getElementById("sendChat")
.addEventListener("click", async ()=>{

  const msg = chatInput.value.trim();
  if(!msg) return;

  await api("/api/user/support-message",{
    method:"POST",
    body:JSON.stringify({
      withdrawalId:currentWithdrawal?._id,
      message:msg
    })
  });

  chatInput.value="";
  loadChat();
});

/* ================= LOAD DASHBOARD ================= */

(async function init(){
  const data = await api("/api/dashboard");
  document.getElementById("availableBox")
    .innerText = "$"+(data.user.availableBalance||0);
})();
})();