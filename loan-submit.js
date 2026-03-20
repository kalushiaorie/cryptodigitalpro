document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loanForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = document.getElementById("amount")?.value;
    const duration = document.getElementById("duration")?.value;
    const type = document.getElementById("loanType")?.value;

    // ✅ validation
    if (!amount || !duration || !type) {
      alert("Please fill all fields");
      return;
    }

    const formData = {
      amount,
      duration,
      type
    };

    try {
      // ✅ call API
      const res = await fetch("https://api.cryptodigitalpro.com/api/loans/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        alert("❌ Loan submission failed");
        return;
      }

      const data = await res.json();

      alert("✅ Loan submitted successfully!");

      // ✅ optional: reset form
      form.reset();

      // ✅ optional: redirect or refresh
      window.location.href = "dashboard.html";

    } catch (err) {
      console.error(err);
      alert("⚠️ Network error");
    }

  });

});