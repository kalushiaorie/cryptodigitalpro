const API = "https://api.cryptodigitalpro.com/api";
const token = localStorage.getItem("token");

function api(path, method="GET", body){
  return fetch(API+path,{
    method,
    headers:{
      "Content-Type":"application/json",
      Authorization:"Bearer "+token
    },
    body: body ? JSON.stringify(body) : undefined
  }).then(r=>r.json());
}

/* TAB SWITCH */
document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  }
})

/* PROFILE */
function saveProfile(){
  api("/user/profile","PATCH",{
    name:name.value,
    email:email.value,
    phone:phone.value
  }).then(alertMsg);
}

/* AVATAR */
function uploadAvatar(){
  const file=avatar.files[0];
  const fd=new FormData();
  fd.append("avatar",file);

  fetch(API+"/user/avatar",{
    method:"POST",
    headers:{Authorization:"Bearer "+token},
    body:fd
  }).then(r=>r.json()).then(alertMsg);
}

/* PASSWORD */
function changePassword(){
  api("/user/password","PATCH",{
    oldPassword:oldPass.value,
    newPassword:newPass.value
  }).then(alertMsg);
}

/* 2FA */
function toggle2FA(){
  api("/user/2fa/toggle","POST").then(alertMsg);
}

/* KYC */
function uploadID(){
  uploadFile("idUpload","/verify/id");
}

function uploadAddress(){
  uploadFile("addressUpload","/verify/address");
}

function uploadFile(inputId,endpoint){
  const fd=new FormData();
  fd.append("file",document.getElementById(inputId).files[0]);

  fetch(API+endpoint,{
    method:"POST",
    headers:{Authorization:"Bearer "+token},
    body:fd
  }).then(r=>r.json()).then(alertMsg);
}

/* DOCUMENTS */
function loadDocs(){
  api("/user/documents").then(data=>{
    docList.innerHTML = data.length
      ? data.map(d=>`<div>${d.type} <a href="${d.url}" target="_blank">View</a></div>`).join("")
      : "No documents yet";
  });
}
loadDocs();

/* SUPPORT */
function sendSupport(){
  api("/support/ticket","POST",{message:supportMsg.value})
  .then(alertMsg);
}

function alertMsg(res){
  alert(res.message || "Done");
}