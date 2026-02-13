import { API } from "./api.js";
import { authHeaders } from "./auth.js";

const form = document.getElementById("loanForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(API + "/api/loans/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Loan request failed");
        return;
      }

      alert("Loan application submitted successfully");
      window.location.href = "loan.html";

    } catch (err) {
      alert("Network error");
      console.error(err);
    }
  });
}
