(function(){

try{

/* ================= CONFIG ================= */

const API = "https://api.cryptodigitalpro.com";

function getToken(){
 const t = localStorage.getItem("token");
 if(!t || t.length < 5){
  console.warn("No valid token, running in offline mode");
  return null;
 }
 return t;
}

function secureLogout(){
 localStorage.clear();
 window.location.href = "signin.html";
}

const token = getToken();

/* ================= HELPERS ================= */

function $(id){ return document.getElementById(id); }

/* ================= LOADER ================= */

function showLoader(){ $("globalLoader")?.classList.remove("hidden"); }
function hideLoader(){ $("globalLoader")?.classList.add("hidden"); }

/* ================= ERROR ================= */

function showError(msg){
 console.log(msg);

 let box = $("globalError");
 if(!box){
  box = document.createElement("div");
  box.id = "globalError";
  box.style.cssText =
    "position:fixed;top:20px;right:20px;background:#111;color:#fff;padding:10px;border-radius:6px;z-index:9999;";
  document.body.appendChild(box);
 }

 box.innerText = msg;
 box.classList.remove("hidden");

 setTimeout(()=>box.classList.add("hidden"),3000);
}

/* ================= API ================= */

async function api(url, options={}){
 if(!token) return null;

 try{
  showLoader();

  const res = await fetch(API+url,{
   headers:{
    Authorization:"Bearer "+token,
    "Content-Type":"application/json"
   },
   ...options
  });

  if(res.status===401){
   secureLogout();
   return null;
  }

  if(!res.ok){
   return null;
  }

  return await res.json();

 }catch(e){
  console.warn("API failed, using local data");
  return null;
 }finally{
  hideLoader();
 }
}

/* ================= MODALS ================= */

function openModal(id){
 document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
 $(id)?.classList.remove("hidden");
}

function closeModals(){
 document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}

document.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("closeModal") ||
    e.target.id === "closeSettingsBtn" ||
    e.target.innerText?.toLowerCase().includes("close") ||
    e.target.innerText?.toLowerCase().includes("cancel")
  ) {
    closeModals();
  }
});

/* ================= LOCAL STORAGE ================= */

function loadLocalLoans(){
 return JSON.parse(localStorage.getItem("loans") || "[]");
}

/* ================= RENDER ================= */

function renderLoans(loans){

 const container = $("loanContainer");
 if(!container) return;

 if(!loans.length){
  container.innerHTML = "No loan applications yet.";
  return;
 }

 container.innerHTML = loans.map(l => `
   <div class="loan-card">
     <h3>${l.loanType || "Loan"}</h3>
     <p><strong>$${l.amount}</strong></p>
     <p>Status: ${l.status || "Pending"}</p>
     <button class="viewLoan" data-id='${JSON.stringify(l)}'>View</button>
   </div>
 `).join("");

 document.querySelectorAll(".viewLoan").forEach(btn=>{
  btn.addEventListener("click",()=>{
   try{
    const loan = JSON.parse(btn.dataset.id);
    showLoan(loan);
   }catch{}
  });
 });
}

/* ================= DASHBOARD ================= */

async function loadDashboard(){

 // 🔥 ALWAYS SHOW LOCAL FIRST (instant UI)
 const localLoans = loadLocalLoans();
 renderLoans(localLoans);

 // 🔁 TRY API (optional override)
 const data = await api("/api/loans");

 if(data && Array.isArray(data)){
  renderLoans(data);
 }

}

/* ================= LOAN DETAILS ================= */

function showLoan(loan){

 $("loanModalTitle").innerText = loan.loanType || "Loan";
 $("loanTimeline").innerHTML = `
  <p><strong>Amount:</strong> $${loan.amount}</p>
  <p><strong>Status:</strong> ${loan.status}</p>
  <p><strong>Date:</strong> ${loan.createdAt || loan.date || "-"}</p>
 `;

 openModal("loanDetailsModal");
}

/* ================= BUTTONS ================= */

function bind(id, fn){
 const el = $(id);
 if(el) el.addEventListener("click", fn);
}

bind("settingsBtn", ()=>openModal("settingsModal"));
bind("adminBtn", ()=>openModal("adminModal"));
bind("verifyBtn", ()=>openModal("verifyModal"));
bind("uploadBtn", ()=>openModal("uploadModal"));
bind("logoutBtn", secureLogout);

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded",()=>{
 console.log("✅ DASHBOARD READY");

 loadDashboard();
 setInterval(loadDashboard,10000);
});

}catch(e){
 console.error("CRASH:",e);
}

})();