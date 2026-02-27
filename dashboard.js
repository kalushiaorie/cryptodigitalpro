(function(){

/* ================= CONFIG ================= */

const API = "https://api.cryptodigitalpro.com";

function getToken(){
 const t = localStorage.getItem("token");
 if(!t || t.length < 20){
  secureLogout();
  return null;
 }
 return t;
}

function secureLogout(){
 localStorage.removeItem("token");
 sessionStorage.clear();
 window.location.href = "signin.html";
}

const token = getToken();
if(!token) return;

/* ================= GLOBAL STATE ================= */

const offlineQueue = [];
let currentWithdrawal = null;

/* ================= GLOBAL LOADER ================= */

const loader = document.getElementById("globalLoader");

function showLoader(){
 loader?.classList.remove("hidden");
}

function hideLoader(){
 loader?.classList.add("hidden");
}

/* ================= GLOBAL ERROR MESSAGE ================= */

function showError(message="Something went wrong. Please try again."){
 let errorBox = document.getElementById("globalError");

 if(!errorBox){
  errorBox = document.createElement("div");
  errorBox.id = "globalError";
  errorBox.style.cssText = `
   position:fixed;
   top:20px;
   right:20px;
   background:#b91c1c;
   color:white;
   padding:15px 20px;
   border-radius:8px;
   z-index:9999;
   box-shadow:0 10px 25px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(errorBox);
 }

 errorBox.innerText = message;
 errorBox.classList.remove("hidden");

 setTimeout(()=>{
  errorBox.classList.add("hidden");
 },4000);
}

/* ================= SAFE API ================= */

async function api(url, options = {}){
 try{

  showLoader();

  const res = await fetch(API + url, {
   headers:{
    Authorization: "Bearer " + token,
    "Content-Type":"application/json"
   },
   ...options
  });

  if(res.status === 401){
   secureLogout();
   return null;
  }

  if(!res.ok){
   showError("Server error: " + res.status);
   return null;
  }

  const ct = res.headers.get("content-type");
  if(!ct || !ct.includes("application/json")){
   showError("Invalid server response.");
   return null;
  }

  return await res.json();

 }catch(err){
  console.error("API ERROR:", err);
  offlineQueue.push({url, options});
  showError("Network error. Trying again automatically.");
  return null;
 }finally{
  hideLoader();
 }
}

/* ================= OFFLINE RETRY ================= */

setInterval(async()=>{
 if(!offlineQueue.length || !navigator.onLine) return;

 const job = offlineQueue.shift();

 try{
  await fetch(API + job.url, {
   headers:{
    Authorization:"Bearer " + token,
    "Content-Type":"application/json"
   },
   ...job.options
  });
 }catch{}
}, 5000);

/* ================= MODAL MANAGER ================= */

const modals = document.querySelectorAll(".modal");

function openModal(id){
 modals.forEach(m => m.classList.add("hidden"));
 const modal = document.getElementById(id);
 modal?.classList.remove("hidden");
}

function closeAllModals(){
 modals.forEach(m => m.classList.add("hidden"));
}

document.addEventListener("keydown",(e)=>{
 if(e.key === "Escape") closeAllModals();
});

modals.forEach(modal=>{
 modal.addEventListener("click",(e)=>{
  if(e.target === modal) closeAllModals();
 });
});

document.querySelectorAll(".closeModal").forEach(btn=>{
 btn.addEventListener("click", closeAllModals);
});

/* ================= DASHBOARD ================= */

async function refreshDashboard(){

 const data = await api("/api/dashboard");
 if(!data) return;

 const {
  balances = {},
  loans = []
 } = data;

 const setText = (id,val)=>{
  const el = document.getElementById(id);
  if(el) el.innerText = "$" + (val || 0);
 };

 setText("outstandingBox", balances.outstanding);
 setText("depositedBox", balances.deposited);
 setText("withdrawnBox", balances.withdrawn);
 setText("availableBox", balances.available);

 const loanContainer = document.getElementById("loanContainer");
 if(!loanContainer) return;

 if(loans.length){
  loanContainer.innerHTML = loans.map(loan=>{
   const safeLoan = encodeURIComponent(JSON.stringify(loan));
   return `
   <div class="loan-card">
    <h3>${loan.loanType || "Loan Application"}</h3>
    <p><strong>Amount:</strong> $${loan.amount}</p>
    <p><strong>Status:</strong> ${loan.status.toUpperCase()}</p>
    <button class="btn loanViewBtn" data-loan="${safeLoan}">
     View Details
    </button>
   </div>
   `;
  }).join("");

  document.querySelectorAll(".loanViewBtn").forEach(btn=>{
   btn.addEventListener("click", ()=>{
    const loan = JSON.parse(decodeURIComponent(btn.dataset.loan));
    openLoanDetails(loan);
   });
  });

 }else{
  loanContainer.innerHTML = `<div>No loan applications found.</div>`;
 }
}

function openLoanDetails(loan){

 document.getElementById("loanModalTitle").innerText =
  loan.loanType || "Loan Details";

 document.getElementById("loanTimeline").innerHTML = `
  <p><strong>Amount:</strong> $${loan.amount}</p>
  <p><strong>Status:</strong> ${loan.status}</p>
  <p><strong>Date:</strong> ${loan.createdAt || "-"}</p>
 `;

 document.getElementById("loanAdminNotes").innerHTML =
  loan.adminNotes
   ? `<p><strong>Admin Notes:</strong><br>${loan.adminNotes}</p>`
   : "";

 openModal("loanDetailsModal");
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", ()=>{
 refreshDashboard();
 setInterval(refreshDashboard, 10000);
});

})();