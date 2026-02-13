const API = "https://cryptodigitalpro-api.onrender.com/api";
const token = localStorage.getItem("token");

let selectedLoan = null;

async function lockLoan(lock) {
  if (!selectedLoan) return alert("Select a loan");

  await fetch(API + "/admin/loan-lock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      user_id: selectedLoan.user_id,
      locked: lock
    })
  });

  alert(lock ? "Withdrawals locked" : "Withdrawals unlocked");
}

async function creditUser() {
  if (!selectedLoan) return alert("Select a loan");

  const amount = Number(document.getElementById("creditAmount").value);
  if (!amount) return alert("Invalid amount");

  await fetch(API + "/admin/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      user_id: selectedLoan.user_id,
      amount,
      type: "credit",
      note: "Admin wallet credit"
    })
  });

  alert("Wallet credited");
}

async function confirmFee(id) {
  await api("/admin/withdrawals/confirm-fee", "POST", { id });
  loadWithdrawals();
}
