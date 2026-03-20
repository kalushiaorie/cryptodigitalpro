(function () {

  const form = document.getElementById("loanContainer");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".step"));
  const nextBtns = form.querySelectorAll(".next");
  const prevBtns = form.querySelectorAll(".prev");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const reviewBox = document.getElementById("loanReview");
  const agreeCheckbox = document.getElementById("loanAgree");
  const thankModal = document.getElementById("loan_thank");
  const thankNext = document.getElementById("thank_next");

  const API = "http://localhost:5000";

  let current = 0;

  /* ================= STEP ================= */

  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });

    current = index;
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateProgress() {
    const percent = Math.round(((current + 1) / steps.length) * 100);
    if (progressFill) progressFill.style.width = percent + "%";
    if (progressText) {
      progressText.textContent = `Step ${current + 1} of ${steps.length}`;
    }
  }

  function validateStep(index) {
    const requiredFields = steps[index].querySelectorAll("[required]");
    let valid = true;

    requiredFields.forEach(field => {
      field.classList.remove("invalid");

      if (!field.value || !field.value.toString().trim()) {
        field.classList.add("invalid");
        valid = false;
      }
    });

    return valid;
  }

  function buildReview() {
    if (!reviewBox) return;

    const data = new FormData(form);

    reviewBox.innerHTML = `
      <p><strong>Name:</strong> ${data.get("fullName") || "-"}</p>
      <p><strong>Amount:</strong> $${data.get("amount") || 0}</p>
      <p><strong>Duration:</strong> ${data.get("duration") || 0} days</p>
    `;
  }

  /* ================= NAV ================= */

  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {

      if (current !== 3 && !validateStep(current)) return;

      if (current === steps.length - 2) {
        buildReview();
      }

      if (current < steps.length - 1) {
        showStep(current + 1);
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (current > 0) showStep(current - 1);
    });
  });

  /* ================= SUBMIT ================= */

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!agreeCheckbox || !agreeCheckbox.checked) {
      alert("Please confirm details");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "signin.html";
      return;
    }

    const data = new FormData(form);

    const payload = {
      loanType: "Instant Loan",
      amount: Number(data.get("amount") || 0),
      duration: Number(data.get("duration") || 0)
    };

    /* ===== LOCAL SAVE (FAST UI) ===== */
    const localLoan = {
      ...payload,
      status: "Pending",
      date: new Date().toLocaleString()
    };

    const existing = JSON.parse(localStorage.getItem("loans") || "[]");
    existing.unshift(localLoan);
    localStorage.setItem("loans", JSON.stringify(existing));

    /* ===== BACKEND SEND (REAL DB) ===== */
    try {
      const res = await fetch(`${API}/api/loan`, {   // ✅ FIXED ROUTE
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token   // ✅ FIXED AUTH
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.warn("Backend rejected loan");
      }

    } catch (err) {
      console.warn("Backend offline, using local only");
    }

    /* ===== SUCCESS UI ===== */
    if (thankModal) {
      thankModal.style.display = "flex";
    }

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  });

  /* ================= THANK BUTTON ================= */

  if (thankNext) {
    thankNext.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  /* ================= INIT ================= */

  showStep(0);

})();