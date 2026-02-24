(function(){

/* ================= CONFIG ================= */

const API="https://api.cryptodigitalpro.com";
const token=localStorage.getItem("token");

if(!token){
 location.href="signin.html";
 return;
}

const offlineQueue=[];
let pollingInterval=null;
let currentWithdrawal=null;

/* ================= ELEMENTS ================= */

const withdrawBtn=document.getElementById("withdrawBtn");
const progressBar=document.getElementById("withdrawProgress");
const progressWrap=document.getElementById("withdrawProgressWrap");

const withdrawModal=document.getElementById("withdrawModal");
const modalTitle=document.getElementById("modalTitle");
const modalMessage=document.getElementById("modalMessage");

const rejectionBox=document.getElementById("withdrawRejectionContainer");

const chatModal=document.getElementById("messageModal");
const chatMessages=document.getElementById("chatMessages");
const chatInput=document.getElementById("adminMessageText");
const sendChatBtn=document.getElementById("sendAdminMessage");

const outstandingBox=document.getElementById("outstandingBox");
const depositedBox=document.getElementById("depositedBox");
const withdrawnBox=document.getElementById("withdrawnBox");
const availableBox=document.getElementById("availableBox");

const adminBtn=document.getElementById("adminBtn");
const verifyBtn=document.getElementById("verifyBtn");
const uploadBtn=document.getElementById("uploadBtn");

/* ================= HEADER BUTTONS ================= */

if(adminBtn)
 adminBtn.onclick=()=>document.getElementById("adminModal")?.classList.remove("hidden");

if(verifyBtn)
 verifyBtn.onclick=()=>document.getElementById("verifyModal")?.classList.remove("hidden");

if(uploadBtn)
 uploadBtn.onclick=()=>document.getElementById("uploadModal")?.classList.remove("hidden");

/* ================= LOGOUT ================= */

const logout=document.getElementById("logoutBtn");

if(logout){
 logout.onclick=()=>{
  localStorage.clear();
  location.href="signin.html";
 };
}

/* ================= SAFE API ================= */

async function api(url,options={}){
 try{

  const res=await fetch(API+url,{
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

  const ct=res.headers.get("content-type");
  if(!ct||!ct.includes("application/json")) return null;

  return await res.json();

 }catch(err){
  console.error("API ERROR:",err);
  offlineQueue.push({url,options});
  return null;
 }
}

/* ================= OFFLINE QUEUE ================= */

setInterval(async()=>{
 if(!offlineQueue.length||!navigator.onLine) return;

 const job=offlineQueue.shift();

 try{
  await fetch(API+job.url,{
   headers:{
    Authorization:"Bearer "+token,
    "Content-Type":"application/json"
   },
   ...job.options
  });
 }catch{}
},5000);

/* ================= WITHDRAW ================= */

if(withdrawBtn){

 withdrawBtn.onclick=async()=>{

  const data=await api("/api/withdraw",{
   method:"POST",
   body:JSON.stringify({amount:1000})
  });

  if(!data||!data.withdrawal){
   alert(data?.message||"Withdrawal failed.");
   return;
  }

  currentWithdrawal=data.withdrawal;

  if(progressWrap)
   progressWrap.style.display="block";

  animateProgress(40);

  showModal(
   "Withdrawal Processing",
   "Your withdrawal request is being processed."
  );

  startPolling();
 };
}

/* ================= POLLING ================= */

function startPolling(){

 if(pollingInterval)
  clearInterval(pollingInterval);

 pollingInterval=setInterval(async()=>{

  const data=await api("/api/withdraw");
  if(!data||!data.withdrawal) return;

  const status=data.withdrawal.status;

  if(status==="processing")
   animateProgress(70);

  if(status==="completed"){
   animateProgress(100);
   showModal("Withdrawal Completed","Funds released successfully.");
   clearInterval(pollingInterval);
  }

  if(status==="rejected"){
   clearInterval(pollingInterval);
   showRejection(data.withdrawal.rejectionReason);
  }

 },5000);
}

/* ================= PROGRESS BAR ================= */

function animateProgress(target){

if(!progressBar) return;

let current=parseInt(progressBar.style.width)||0;

const step=()=>{
if(current>=target) return;

current+=1;
progressBar.style.width=current+"%";
progressBar.innerText=current+"%";

requestAnimationFrame(step);
};

requestAnimationFrame(step);
}
/* ================= MODAL ================= */

function showModal(title,msg){

 if(!withdrawModal) return;

 modalTitle.innerText=title;
 modalMessage.innerText=msg;

 withdrawModal.classList.remove("hidden");
}

/* ================= REJECTION ================= */

function showRejection(reason){

 if(!rejectionBox) return;

 rejectionBox.innerHTML=`
<div class="rejection-box">
<strong>Withdrawal Rejected:</strong><br/>
${reason||"Compliance requirements not met."}
<br><br>
<button class="btn" id="contactAdminBtn">Contact Admin</button>
</div>`;

 document.getElementById("contactAdminBtn")
 ?.addEventListener("click",openChat);
}

/* ================= CHAT ================= */

function openChat(){
 if(chatModal)
  chatModal.classList.remove("hidden");
 loadChat();
}

async function loadChat(){

 const messages=await api("/api/support-messages");

 if(!messages||!Array.isArray(messages)||!chatMessages)
  return;

 chatMessages.innerHTML=messages.map(m=>`
<div class="${m.sender==='admin'?'chat-admin':'chat-user'}">
<strong>${m.sender}:</strong> ${m.message}
</div>`).join("");

 chatMessages.scrollTop=chatMessages.scrollHeight;
}

if(sendChatBtn){

 sendChatBtn.onclick=async()=>{

  const msg=chatInput.value.trim();
  if(!msg) return;

  await api("/api/support-message",{
   method:"POST",
   body:JSON.stringify({
    withdrawalId:currentWithdrawal?._id,
    message:msg
   })
  });

  chatInput.value="";
  loadChat();
 };
}

/* ================= DASHBOARD ================= */

async function refreshDashboard(){

 const data=await api("/api/dashboard");
 if(!data) return;

 window.lastDashboardData=data;

/* balances */

if(data.balances){
animateBalance(outstandingBox,data.balances.outstanding);
animateBalance(depositedBox,data.balances.deposited);
animateBalance(withdrawnBox,data.balances.withdrawn);
animateBalance(availableBox,data.balances.available);
}

/* loans */

 const loanContainer=document.getElementById("loanContainer");
 if(!loanContainer) return;

 if(data.loans?.length){

  loanContainer.innerHTML=data.loans.map(loan=>{

   const safeLoan=encodeURIComponent(JSON.stringify(loan));

   const color=
    loan.status==="approved"?"#16a34a":
    loan.status==="rejected"?"#dc2626":
    loan.status==="pending"?"#f59e0b":"#3b82f6";

   return`
<div class="loan-card" style="background:#0f172a;padding:20px;border-radius:10px;margin-bottom:15px;border-left:5px solid ${color};">
<h3>${loan.loanType||"Loan Application"}</h3>
<p><strong>Amount:</strong> $${loan.amount}</p>
<p><strong>Status:</strong> <span style="color:${color};font-weight:bold;">${loan.status.toUpperCase()}</span></p>
<button class="btn loanViewBtn" data-loan="${safeLoan}">View Details</button>
</div>`;

  }).join("");

/* safe listeners */

 document.querySelectorAll(".loanViewBtn").forEach(btn=>{
  btn.addEventListener("click",()=>{
   const loan=JSON.parse(decodeURIComponent(btn.dataset.loan));
   openLoanDetails(loan);
  });
 });

 }else{
  loanContainer.innerHTML=`<div style="padding:15px;background:#1e293b;border-radius:8px;">No loan applications found.</div>`;
 }
}

window.refreshDashboard=refreshDashboard;

/* ================= LOAN MODAL ================= */

window.openLoanDetails=function(loan){

 const modal=document.getElementById("loanDetailsModal");
 const timeline=document.getElementById("loanTimeline");
 const notes=document.getElementById("loanAdminNotes");
 const title=document.getElementById("loanModalTitle");

 if(!modal||!timeline||!notes||!title) return;

 title.innerText=(loan.loanType||"Loan")+" - $"+loan.amount;

 const steps=["pending","review","approved"];
 const rejected=["pending","review","rejected"];

 const flow=loan.status==="rejected"?rejected:steps;

 timeline.innerHTML=flow.map(step=>{

  const active=flow.indexOf(step)<=flow.indexOf(loan.status);
  const color=step==="rejected"?"#dc2626":"#16a34a";

  return`
<div style="margin-bottom:10px;">
<span style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px;background:${active?color:"#334155"};"></span>
<strong style="color:${active?color:"#94a3b8"};">${step.toUpperCase()}</strong>
</div>`;

 }).join("");

 notes.innerHTML=`<strong>Admin Notes:</strong><br>${loan.adminNotes||"No notes provided yet."}`;

 modal.classList.remove("hidden");
};

window.closeLoanModal=function(){
 document.getElementById("loanDetailsModal")
 ?.classList.add("hidden");
};

/* ================= REALTIME SOCKET ================= */

const socket=io(API,{
 transports:["websocket","polling"],
 reconnection:true,
 reconnectionAttempts:Infinity,
 reconnectionDelay:1500,
 timeout:10000
});

/* register */

socket.on("connect",()=>{
 const id=localStorage.getItem("userId");
 if(id) socket.emit("register",id);
});

/* heartbeat */

let lastPing=Date.now();

socket.on("pong",()=>{
 lastPing=Date.now();
});

setInterval(()=>{
 if(socket.connected)
  socket.emit("ping");
},8000);

setInterval(()=>{
 if(Date.now()-lastPing>20000){
  console.warn("Socket stale → refreshing dashboard");
  refreshDashboard();
 }
},10000);

/* realtime events */

let notifyCount=0;
const badge=document.getElementById("notifyCount");
const list=document.querySelector(".notify-list");

function addNotification(msg){

 notifyCount++;

 if(badge)
  badge.innerText=notifyCount;

 if(list){

  const item=document.createElement("div");
  item.style.padding="8px";
  item.style.borderBottom="1px solid #1f2937";
  item.innerText=msg;

  list.prepend(item);
 }

 const tc=document.getElementById("toastContainer");

 if(tc){
  const toast=document.createElement("div");
  toast.className="toast";
  toast.innerText=msg;
  tc.appendChild(toast);
  setTimeout(()=>toast.remove(),4000);
 }
}

socket.on("loan_update",data=>{
addNotification(data.message);

/* LIVE TIMELINE UPDATE */
if(window.lastDashboardData?.loans){
const loan = window.lastDashboardData.loans.find(l=>l.status==="pending" || l.status==="approved" || l.status==="rejected");
if(loan){
loan.status=data.status;
animateTimelineStatus(data.status);
}
}

refreshDashboard();
});

socket.on("withdraw_update",data=>{

 addNotification(data.message||"Withdrawal update");

 if(data.status==="processing") animateProgress(70);
 if(data.status==="completed") animateProgress(100);

 refreshDashboard();
});

/* fallback refresh */

setInterval(()=>{
 if(!socket.connected)
  refreshDashboard();
},15000);

//* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

  /* Header shrink */
  window.addEventListener("scroll", () => {
    const h = document.querySelector(".header");
    if (!h) return;
    h.classList.toggle("shrink", window.scrollY > 40);
  });

  /* Footer year */
  const yearEl = document.getElementById("footerYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Card animation */
  document.querySelectorAll(".balance-box").forEach((card,i)=>{
    setTimeout(()=>card.classList.add("show"),150*i);
  });

  const statusDot=document.querySelector(".footer-status .dot");
  const statusText=document.querySelector(".footer-status");

  socket.on("connect",()=>{
    if(statusDot){
      statusDot.style.background="#22c55e";
      statusText.innerHTML='<span class="dot"></span> System Status: Operational';
    }
  });

  socket.on("disconnect",()=>{
    if(statusDot){
      statusDot.style.background="#ef4444";
      statusText.innerHTML='<span class="dot"></span> System Status: Connection Issue';
    }
  });

});

refreshDashboard();

})();