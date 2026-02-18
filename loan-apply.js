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

  /* ================= STEP CONTROL ================= */

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
    progressText.textContent =
      `Step ${current + 1} of ${steps.length} (${percent}%)`;
  }

  function validateStep(index) {
    const requiredFields = steps[index].querySelectorAll("[required]");
    let valid = true;

    requiredFields.forEach(field => {
      field.classList.remove("invalid");

      if (field.type === "checkbox") {
        if (!field.checked) valid = false;
      } else if (!field.value || !field.value.toString().trim()) {
        field.classList.add("invalid");
        valid = false;
      }
    });

    return valid;
  }

  /* ================= REVIEW BUILDER ================= */

  function buildReview() {
    const data = new FormData(form);

    const fullAddress = `
      ${data.get("street")},
      ${data.get("city")},
      ${data.get("state")} ${data.get("zip")},
      ${data.get("country")}
    `;

    const employerAddress = `
      ${data.get("employerStreet")},
      ${data.get("employerCity")},
      ${data.get("employerState")} ${data.get("employerZip")}
    `;

    reviewBox.innerHTML = `
      <div class="review-section">
        <h3>PERSONAL INFORMATION</h3>
        <p><strong>Name:</strong> ${data.get("fullName")}</p>
        <p><strong>Email:</strong> ${data.get("email")}</p>
        <p><strong>DOB:</strong> ${data.get("dob")}</p>
      </div>

      <div class="review-section">
        <h3>RESIDENTIAL ADDRESS</h3>
        <p>${fullAddress}</p>
      </div>

      <div class="review-section">
        <h3>EMPLOYMENT DETAILS</h3>
        <p><strong>Status:</strong> ${data.get("employment")}</p>
        <p><strong>Occupation:</strong> ${data.get("occupation")}</p>
        <p><strong>Employer:</strong> ${data.get("employerName")}</p>
        <p>${employerAddress}</p>
        <p><strong>Income:</strong> $${Number(data.get("income") || 0).toLocaleString()}</p>
      </div>

      <div class="review-section">
        <h3>LOAN REQUEST</h3>
        <p><strong>Amount:</strong> $${Number(data.get("amount") || 0).toLocaleString()}</p>
        <p><strong>Duration:</strong> ${data.get("duration")} months</p>
        <p><strong>Purpose:</strong> ${data.get("purpose") || "-"}</p>
      </div>
    `;
  }

  /* ================= NAVIGATION ================= */

  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (!validateStep(current)) return;

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

  /* ================= SUBMIT (NETLIFY HANDLED) ================= */

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validateStep(current)) return;

    if (!agreeCheckbox.checked) {
      alert("Please confirm your details.");
      return;
    }

    // ✅ MARK USER AS APPLIED
    localStorage.setItem("hasAppliedLoan", "true");

    // ✅ SAVE LOAN AMOUNT FOR DASHBOARD
    const amountField = form.querySelector("input[name='amount']");
    if (amountField) {
      localStorage.setItem("lastLoanAmount", amountField.value);
    }

    // Let Netlify handle submission
    form.submit();

    // Show success modal
    thankModal.style.display = "flex";
  });

  /* ================= THANK YOU REDIRECT ================= */

  if (thankNext) {
    thankNext.addEventListener("click", function () {
      window.location.href = "dashboard.html";
    });
  }

  /* ================= INIT ================= */

  showStep(0);

})();