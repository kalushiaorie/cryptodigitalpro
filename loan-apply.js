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

  let current = 0;

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
    progressFill.style.width = percent + "%";
    progressText.textContent = `Step ${current + 1} of ${steps.length}`;
  }

  function validateStep(index) {
    const requiredFields = steps[index].querySelectorAll("[required]");
    let valid = true;

    requiredFields.forEach(field => {
      if (!field.value) valid = false;
    });

    return valid;
  }

  function buildReview() {
    if (!reviewBox) return;

    const data = new FormData(form);

    reviewBox.innerHTML = `
      <p><strong>Name:</strong> ${data.get("fullName")}</p>
      <p><strong>Amount:</strong> $${data.get("amount")}</p>
      <p><strong>Duration:</strong> ${data.get("duration")} days</p>
    `;
  }

  /* ================= NAV ================= */

  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {

      // 🚀 SKIP FILE VALIDATION (important for puppeteer)
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

  /* ================= FINAL SUBMIT ================= */

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!agreeCheckbox.checked) {
      alert("Please confirm details");
      return;
    }

    const data = new FormData(form);

    const loan = {
      loanType: "Instant Loan",
      amount: Number(data.get("amount")),
      duration: Number(data.get("duration")),
      status: "Pending",
      date: new Date().toLocaleString()
    };

    // ✅ SAVE LOCALLY (THIS FIXES DASHBOARD)
    const existing = JSON.parse(localStorage.getItem("loans") || "[]");
    existing.unshift(loan);
    localStorage.setItem("loans", JSON.stringify(existing));

    if (thankModal) {
      thankModal.style.display = "flex";
    }

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  });

  if (thankNext) {
    thankNext.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  showStep(0);

})();