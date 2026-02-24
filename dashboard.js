(function(){

/* ================= CONFIG ================= */

const API = "https://api.cryptodigitalpro.com";
const token = localStorage.getItem("token");

if(!token){
  location.href="signin.html";
  return;
}

let pollingInterval=null;
let currentWithdrawal=null;
let lastDashboardData=null;

/* ================= ELEMENTS ================= */

const $ = id => document.getElementById(id);

const withdrawBtn = $("withdrawBtn");
const progressBar = $("withdrawProgress");
const progressWrap = $("withdrawProgressWrap");

const withdrawModal = $("withdrawModal");
const modalTitle = $("modalTitle");
const modalMessage = $("modalMessage");

const rejectionBox = $("withdrawRejectionContainer");

const chatModal = $("messageModal");
const chatMessages = $("chatMessages");
const chatInput = $("adminMessageText");
const sendChatBtn = $("sendAdminMessage");

const outstandingBox = $("outstandingBox");
const depositedBox = $("depositedBox");
const withdrawnBox = $("withdrawnBox");
const availableBox = $("availableBox");

/* ================= SAFE API ================= */

async function api(url, options={}){
  try{
    const res = await fetch(API+url,{
      headers:{
        Authorization:"Bearer "+token,
        "Content-Type":"application/json"
      },
      ...options
    });

    if(res.status===401){
      localStorage.clear();
      location.href="signin.html";
      return null;
    }

    if(!res.ok) return null;

    return await res.json();
  }catch(err){
    console.error("API ERROR:",err);
    return null;
  }
}

/* ================= BALANCE ANIMATION ================= */

function animateBalance(el, value){
  if(!el) return;

  const start = parseFloat(el.textContent.replace(/[^0-9.]/g,"")) || 0;
  const end = parseFloat(value) || 0;
  const duration = 600;
  const startTime = performance.now();

  function step(now){
    const progress = Math.min((now - startTime)/duration,1);
    const current = start + (end - start)*progress;
    el.textContent = "$"+current.toFixed(2);
    if(progress<1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ================= WITHDRAW ================= */

if(withdrawBtn){
  withdrawBtn.onclick = async ()=>{
    withdrawBtn.disabled = true;

    const data = await api("/api/withdraw",{
      method:"POST",
      body:JSON.stringify({amount:1000})
    });

    withdrawBtn.disabled = false;

    if(!data?.withdrawal){
      alert("Withdrawal failed.");
      return;
    }

    currentWithdrawal = data.withdrawal;

    if(progressWrap) progressWrap.style.display="block";
    animateProgress(40);

    showModal("Withdrawal Processing",
      "Your withdrawal request is being processed.");

    startPollingFallback();
  };
}

/* ================= PROGRESS ================= */

function animateProgress(target){
  if(!progressBar) return;

  let current = parseInt(progressBar.textContent) || 0;

  function step(){
    if(current >= target) return;
    current++;
    progressBar.style.width = current+"%";
    progressBar.textContent = current+"%";
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ================= MODAL ================= */

function showModal(title,msg){
  if(!withdrawModal || !modalTitle || !modalMessage) return;

  modalTitle.textContent = title;
  modalMessage.textContent = msg;
  withdrawModal.classList.remove("hidden");
}

/* ================= REJECTION ================= */

function showRejection(reason){
  if(!rejectionBox) return;

  rejectionBox.innerHTML="";
  const box = document.createElement("div");
  box.className="rejection-box";

  const strong = document.createElement("strong");
  strong.textContent="Withdrawal Rejected:";
  box.appendChild(strong);

  const p = document.createElement("p");
  p.textContent = reason || "Compliance requirements not met.";
  box.appendChild(p);

  const btn = document.createElement("button");
  btn.className="btn";
  btn.textContent="Contact Admin";
  btn.onclick=openChat;
  box.appendChild(btn);

  rejectionBox.appendChild(box);
}

/* ================= CHAT ================= */

function openChat(){
  if(chatModal) chatModal.classList.remove("hidden");
  loadChat();
}

async function loadChat(){
  const messages = await api("/api/support-messages");
  if(!Array.isArray(messages) || !chatMessages) return;

  chatMessages.innerHTML="";

  messages.forEach(m=>{
    const div=document.createElement("div");
    div.className = m.sender==="admin"?"chat-admin":"chat-user";
    div.textContent = m.message;
    chatMessages.appendChild(div);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if(sendChatBtn){
  sendChatBtn.onclick=async()=>{
    const msg = chatInput.value.trim();
    if(!msg) return;

    sendChatBtn.disabled=true;

    await api("/api/support-message",{
      method:"POST",
      body:JSON.stringify({
        withdrawalId:currentWithdrawal?._id,
        message:msg
      })
    });

    sendChatBtn.disabled=false;
    chatInput.value="";
    loadChat();
  };
}

/* ================= DASHBOARD ================= */

async function refreshDashboard(){
  const data = await api("/api/dashboard");
  if(!data) return;

  lastDashboardData=data;

  if(data.balances){
    animateBalance(outstandingBox,data.balances.outstanding);
    animateBalance(depositedBox,data.balances.deposited);
    animateBalance(withdrawnBox,data.balances.withdrawn);
    animateBalance(availableBox,data.balances.available);
  }

  renderLoans(data.loans||[]);
}

window.refreshDashboard=refreshDashboard;

/* ================= LOANS ================= */

function renderLoans(loans){
  const container = $("loanContainer");
  if(!container) return;

  container.innerHTML="";

  if(!loans.length){
    container.textContent="No loan applications found.";
    return;
  }

  loans.forEach(loan=>{
    const card=document.createElement("div");
    card.className="loan-card";

    const h3=document.createElement("h3");
    h3.textContent=loan.loanType||"Loan Application";
    card.appendChild(h3);

    const amount=document.createElement("p");
    amount.textContent="Amount: $"+loan.amount;
    card.appendChild(amount);

    const status=document.createElement("p");
    status.textContent="Status: "+loan.status;
    card.appendChild(status);

    const btn=document.createElement("button");
    btn.className="btn";
    btn.textContent="View Details";
    btn.onclick=()=>openLoanDetails(loan);
    card.appendChild(btn);

    container.appendChild(card);
  });
}

/* ================= SOCKET ================= */

const socket = io(API,{
  transports:["websocket"],
  reconnection:true
});

socket.on("connect",()=>{
  const id=localStorage.getItem("userId");
  if(id) socket.emit("register",id);
});

socket.on("loan_update",data=>{
  if(!data?.loanId) return;

  if(lastDashboardData?.loans){
    const loan = lastDashboardData.loans.find(
      l=>l._id===data.loanId
    );
    if(loan) loan.status=data.status;
  }

  refreshDashboard();
});

socket.on("withdraw_update",data=>{
  if(data.status==="processing") animateProgress(70);
  if(data.status==="completed") animateProgress(100);
  refreshDashboard();
});

/* ================= POLLING FALLBACK ================= */

function startPollingFallback(){
  if(pollingInterval) clearInterval(pollingInterval);

  pollingInterval=setInterval(()=>{
    if(!socket.connected){
      refreshDashboard();
    }
  },10000);
}

/* ================= INIT ================= */

refreshDashboard();

})();