(function(){

const API="https://api.cryptodigitalpro.com";
const token=localStorage.getItem("token");
if(!token){location.href="signin.html";return;}

/* ELEMENTS */
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

/* BALANCE ELEMENTS (FIX) */
const outstandingBox=document.getElementById("outstandingBox");
const depositedBox=document.getElementById("depositedBox");
const withdrawnBox=document.getElementById("withdrawnBox");
const availableBox=document.getElementById("availableBox");

/* HEADER BUTTONS */
const adminBtn=document.getElementById("adminBtn");
const verifyBtn=document.getElementById("verifyBtn");
const uploadBtn=document.getElementById("uploadBtn");

if(adminBtn) adminBtn.onclick=()=>document.getElementById("adminModal")?.classList.remove("hidden");
if(verifyBtn) verifyBtn.onclick=()=>document.getElementById("verifyModal")?.classList.remove("hidden");
if(uploadBtn) uploadBtn.onclick=()=>document.getElementById("uploadModal")?.classList.remove("hidden");

/* LOGOUT */
const logout=document.getElementById("logoutBtn");
if(logout){
logout.onclick=()=>{
localStorage.clear();
location.href="signin.html";
};
}

let currentWithdrawal=null;
let pollingInterval=null;

/* SAFE API */
async function api(url,options={}){
try{
const res=await fetch(API+url,{
headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
...options
});
if(res.status===401){localStorage.clear();location.href="signin.html";return null;}
const ct=res.headers.get("content-type");
if(!ct||!ct.includes("application/json")) return null;
return await res.json();
}catch(e){console.error("API ERROR:",e);return null;}
}

/* WITHDRAW */
if(withdrawBtn){
withdrawBtn.onclick=async()=>{
const data=await api("/api/withdraw",{method:"POST",body:JSON.stringify({amount:1000})});
if(!data||!data.withdrawal){alert(data?.message||"Withdrawal failed.");return;}
currentWithdrawal=data.withdrawal;
if(progressWrap) progressWrap.style.display="block";
animateProgress(40);
showModal("Withdrawal Processing","Your withdrawal request is being processed.");
startPolling();
};
}

/* POLLING */
function startPolling(){
if(pollingInterval) clearInterval(pollingInterval);
pollingInterval=setInterval(async()=>{
const data=await api("/api/withdraw");
if(!data||!data.withdrawal)return;
const status=data.withdrawal.status;

if(status==="processing") animateProgress(70);

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

/* PROGRESS */
function animateProgress(target){
if(!progressBar)return;
let current=parseInt(progressBar.style.width)||0;
const i=setInterval(()=>{
if(current>=target) return clearInterval(i);
current++;
progressBar.style.width=current+"%";
progressBar.innerText=current+"%";
},20);
}

/* MODAL */
function showModal(title,msg){
if(!withdrawModal)return;
modalTitle.innerText=title;
modalMessage.innerText=msg;
withdrawModal.classList.remove("hidden");
}

/* REJECTION */
function showRejection(reason){
if(!rejectionBox) return;
rejectionBox.innerHTML=`
<div class="rejection-box">
<strong>Withdrawal Rejected:</strong><br/>
${reason||"Compliance requirements not met."}
<br><br>
<button class="btn" id="contactAdminBtn">Contact Admin</button>
</div>`;
document.getElementById("contactAdminBtn")?.addEventListener("click",openChat);
}

/* CHAT */
function openChat(){
if(chatModal) chatModal.classList.remove("hidden");
loadChat();
}

async function loadChat(){
const messages=await api("/api/support-messages");
if(!messages||!Array.isArray(messages)||!chatMessages)return;
chatMessages.innerHTML=messages.map(m=>`
<div class="${m.sender==='admin'?'chat-admin':'chat-user'}">
<strong>${m.sender}:</strong> ${m.message}
</div>`).join("");
chatMessages.scrollTop=chatMessages.scrollHeight;
}

if(sendChatBtn){
sendChatBtn.onclick=async()=>{
const msg=chatInput.value.trim();
if(!msg)return;
await api("/api/support-message",{method:"POST",body:JSON.stringify({withdrawalId:currentWithdrawal?._id,message:msg})});
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
if(outstandingBox) outstandingBox.innerText="$"+(data.balances.outstanding||0);
if(depositedBox) depositedBox.innerText="$"+(data.balances.deposited||0);
if(withdrawnBox) withdrawnBox.innerText="$"+(data.balances.withdrawn||0);
if(availableBox) availableBox.innerText="$"+(data.balances.available||0);
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
<button class="btn" onclick='openLoanDetails(JSON.parse(decodeURIComponent("${safeLoan}")))'>View Details</button>
</div>`;
}).join("");
}else{
loanContainer.innerHTML=`<div style="padding:15px;background:#1e293b;border-radius:8px;">No loan applications found.</div>`;
}
}

window.refreshDashboard=refreshDashboard;

/* INIT LOAD */
refreshDashboard();

/* DETAILS */
window.openLoanDetails=function(loan){
const modal=document.getElementById("loanDetailsModal");
const timeline=document.getElementById("loanTimeline");
const notes=document.getElementById("loanAdminNotes");
const title=document.getElementById("loanModalTitle");

if(!modal||!timeline||!notes||!title) return;

title.innerText=(loan.loanType||"Loan")+" - $"+loan.amount;

const steps=["pending","review","approved"];
const rejectedSteps=["pending","review","rejected"];
const active=loan.status==="rejected"?rejectedSteps:steps;

timeline.innerHTML=active.map(step=>{
const activeStep=active.indexOf(step)<=active.indexOf(loan.status);
const color=step==="rejected"?"#dc2626":"#16a34a";
return`
<div style="margin-bottom:10px;">
<span style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px;background:${activeStep?color:"#334155"};"></span>
<strong style="color:${activeStep?color:"#94a3b8"};">${step.toUpperCase()}</strong>
</div>`;
}).join("");

notes.innerHTML=`<strong>Admin Notes:</strong><br>${loan.adminNotes||"No notes provided yet."}`;
modal.classList.remove("hidden");
};

window.closeLoanModal=function(){
document.getElementById("loanDetailsModal")?.classList.add("hidden");
};

/* REALTIME */
const socket=io(API,{reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:2000});

socket.on("connect",()=>{
const id=localStorage.getItem("userId");
if(id) socket.emit("register",id);
});

let notifyCount=0;
const badge=document.getElementById("notifyCount");
const list=document.querySelector(".notify-list");

function addNotification(msg){
notifyCount++;
if(badge) badge.innerText=notifyCount;

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
refreshDashboard();
});

socket.on("withdraw_update",data=>{
addNotification(data.message);

if(data.status==="processing") animateProgress(70);
if(data.status==="completed") animateProgress(100);

refreshDashboard();
});

/* FALLBACK AUTO REFRESH */
setInterval(()=>{
if(!socket.connected) refreshDashboard();
},15000);

})();