const API = "https://cryptodigitalpro-api.onrender.com/api/admin";
const token = localStorage.getItem("token");

let selectedLoanId = null;

async function loadLoans() {
  const res = await fetch(API + "/loans?status=pending", {
    headers: {
      Authorization: "Bearer " + token
    }
  });
  const loans = await res.json();

  const tbody = document.querySelector("#loanTable tbody");
  tbody.innerHTML = "";

  loans.forEach(l => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.id}</td>
      <td>${l.email}</td>
      <td>$${l.amount}</td>
      <td>${l.status}</td>
      <td><button onclick="openModal(${l.id})">Review</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function openModal(loanId) {
  selectedLoanId = loanId;
  document.getElementById("reviewModal").style.display = "block";
}

function closeModal() {
  selectedLoanId = null;
  document.getElementById("reviewModal").style.display = "none";
}

async function approveLoan() {
  await updateStatus("approved");
}

async function rejectLoan() {
  const reason = document.getElementById("rejectReason").value.trim();
  if (!reason) {
    alert("Rejection reason required");
    return;
  }
  await updateStatus("rejected", reason);
}

async function updateStatus(status, reason = null) {
  const res = await fetch(API + "/loan-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      loan_id: selectedLoanId,
      status,
      reason
    })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }

  closeModal();
  loadLoans();
}

loadLoans();
