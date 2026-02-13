const API = "https://cryptodigitalpro-api.onrender.com/api";
const token = localStorage.getItem("adminToken");
if (!token) location.replace("/admin/login.html");

async function loadKYC() {
  const res = await fetch(API + "/admin/kyc/pending", {
    headers: { Authorization: "Bearer " + token }
  });

  const users = await res.json();
  list.innerHTML = users.map(u => `
    <div class="card">
      <b>${u.email}</b>
      <img src="${u.id_front}" />
      <img src="${u.id_back}" />
      <button onclick="approve('${u._id}')">Approve</button>
      <button onclick="reject('${u._id}')">Reject</button>
    </div>
  `).join("");
}

async function approve(id) {
  await fetch(API + `/admin/kyc/${id}/approve`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });
  loadKYC();
}

async function reject(id) {
  await fetch(API + `/admin/kyc/${id}/reject`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });
  loadKYC();
}

loadKYC();
