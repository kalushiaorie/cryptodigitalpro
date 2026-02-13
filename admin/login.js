const API = "https://cryptodigitalpro-api.onrender.com/api";

async function adminLogin() {
  const email = emailInput.value;
  const password = passwordInput.value;

  const res = await fetch(API + "/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  localStorage.setItem("adminToken", data.token);
  location.replace("/admin/kyc.html");
}
