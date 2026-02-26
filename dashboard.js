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
let socket=null;

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

/* ================= SAFE FALLBACK ================= */

function animateTimelineStatus(){
 console.warn("animateTimelineStatus not implemented yet");
}

/* ================= DOM READY ================= */

document.addEventListener("DOMContentLoaded", () => {

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
const logout=document.getElementById("logoutBtn");

/* ================= HEADER BUTTONS ================= */

if(adminBtn)
 adminBtn.onclick=()=>document.getElementById("adminModal")?.classList.remove("hidden");

if(verifyBtn)
 verifyBtn.onclick=()=>document.getElementById("verifyModal")?.classList.remove("hidden");

if(uploadBtn)
 uploadBtn.onclick=()=>document.getElementById("uploadModal")?.classList.remove("hidden");

if(logout){
 logout.onclick=()=>{
  localStorage.clear();
  location.href="signin.html";
 };
}

/* ================= PROGRESS ================= */

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
 if(!messages||!Array.isArray(messages)||!chatMessages) return;

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

 if(data.balances){
  outstandingBox && (outstandingBox.innerText="$"+data.balances.outstanding);
  depositedBox && (depositedBox.innerText="$"+data.balances.deposited);
  withdrawnBox && (withdrawnBox.innerText="$"+data.balances.withdrawn);
  availableBox && (availableBox.innerText="$"+data.balances.available);
 }

 const loanContainer=document.getElementById("loanContainer");
 if(!loanContainer) return;

 if(data.loans?.length){
  loanContainer.innerHTML=data.loans.map(loan=>{
   const safeLoan=encodeURIComponent(JSON.stringify(loan));
   return`
   <div class="loan-card" style="background:#0f172a;padding:20px;border-radius:10px;margin-bottom:15px;">
   <h3>${loan.loanType||"Loan Application"}</h3>
   <p><strong>Amount:</strong> $${loan.amount}</p>
   <p><strong>Status:</strong> ${loan.status.toUpperCase()}</p>
   <button class="btn loanViewBtn" data-loan="${safeLoan}">View Details</button>
   </div>`;
  }).join("");

  document.querySelectorAll(".loanViewBtn").forEach(btn=>{
   btn.addEventListener("click",()=>{
    const loan=JSON.parse(decodeURIComponent(btn.dataset.loan));
    openLoanDetails(loan);
   });
  });

 }else{
  loanContainer.innerHTML=`<div>No loan applications found.</div>`;
 }
}

window.refreshDashboard=refreshDashboard;

/* ================= SOCKET ================= */

if(typeof io!=="undefined"){
 socket=io(API,{
  transports:["websocket","polling"],
  reconnection:true,
  reconnectionAttempts:Infinity,
  reconnectionDelay:1500
 });

 socket.on("loan_update",data=>{
  refreshDashboard();
 });

 socket.on("withdraw_update",data=>{
  refreshDashboard();
 });
}

/* ================= INIT ================= */

refreshDashboard();

});

})();