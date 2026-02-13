(function () {

  /* ================= CONFIG ================= */
  const API = "https://cryptodigitalpro-api.onrender.com";
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  /* ================= ELEMENTS ================= */
  const loanList = document.getElementById("loanList");
  const txList = document.getElementById("txList");
  const depositedBox = document.getElementById("depositedBox");
  const availableBox = document.getElementById("availableBox");

  const notifyCount = document.getElementById("notifyCount");
  const notifyList = document.querySelector(".notify-list");
  const notifyWrapper = document.querySelector(".notify-wrapper");

  const adminBtn = document.getElementById("adminBtn");
  const verifyBtn = document.getElementById("verifyBtn");
  const uploadBtn = document.getElementById("uploadBtn");

  const adminModal = document.getElementById("adminModal");
  const verifyModal = document.getElementById("verifyModal");
  const uploadModal = document.getElementById("uploadModal");

  const adminMessages = document.getElementById("adminMessages");

  /* ================= FETCH HELPER ================= */
  async function apiFetch(url, options = {}) {
    const res = await fetch(API + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "signin.html";
      return;
    }

    return res.json();
  }

  /* ================= LOAD DASHBOARD ================= */
  async function loadDashboard() {
    try {
      const data = await apiFetch("/api/dashboard");

      if (!data) return;

      renderBalances(data.balances);
      renderLoans(data.loans);
      renderTransactions(data.transactions);
      renderNotifications(data.notifications);
      renderAdminMessages(data.adminMessages);

    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }

  /* ================= RENDER BALANCES ================= */
  function renderBalances(balances = {}) {
    depositedBox.textContent =
      "$" + Number(balances.deposited || 0).toLocaleString();

    availableBox.textContent =
      "$" + Number(balances.available || 0).toLocaleString();
  }

  /* ================= RENDER LOANS ================= */
  function renderLoans(loans = []) {
    if (!loans.length) {
      loanList.innerHTML = "No loan applications yet.";
      return;
    }

    loanList.innerHTML = loans.map(loan => `
      <div class="loan-item">
        <strong>${loan.loan_type}</strong>
        <div class="small">
          Amount: $${Number(loan.amount).toLocaleString()} |
          Status: ${loan.status}
        </div>
      </div>
    `).join("");
  }

  /* ================= RENDER TRANSACTIONS ================= */
  function renderTransactions(transactions = []) {
    if (!transactions.length) {
      txList.innerHTML = "No transactions available.";
      return;
    }

    txList.innerHTML = transactions.map(tx => `
      <div class="tx-item">
        <div>${tx.type}</div>
        <div>$${Number(tx.amount).toLocaleString()}</div>
      </div>
    `).join("");
  }

  /* ================= NOTIFICATIONS ================= */
  function renderNotifications(notifications = []) {
    notifyCount.textContent = notifications.length;

    if (!notifications.length) {
      notifyList.innerHTML = "<div class='small'>No notifications</div>";
      return;
    }

    notifyList.innerHTML = notifications.map(n => `
      <div class="notify-item small">
        ${n.message}
      </div>
    `).join("");
  }

  /* ================= ADMIN MESSAGES ================= */
  function renderAdminMessages(messages = []) {
    if (!messages.length) {
      adminMessages.innerHTML = "No messages.";
      return;
    }

    adminMessages.innerHTML = messages.map(msg => `
      <div class="admin-msg">
        <strong>${msg.title}</strong>
        <div class="small">${msg.body}</div>
      </div>
    `).join("");

    adminBtn.textContent = `Admin Messages (${messages.length})`;
  }

  /* ================= MODAL CONTROL ================= */
  function openModal(modal) {
    modal.classList.remove("hidden");
  }

  function closeModals() {
    document.querySelectorAll(".modal").forEach(m =>
      m.classList.add("hidden")
    );
  }

  adminBtn.addEventListener("click", () => openModal(adminModal));
  verifyBtn.addEventListener("click", () => openModal(verifyModal));
  uploadBtn.addEventListener("click", () => openModal(uploadModal));

  document.querySelectorAll(".closeModal").forEach(btn => {
    btn.addEventListener("click", closeModals);
  });

  /* ================= NOTIFICATION DROPDOWN ================= */
  notifyWrapper.addEventListener("click", () => {
    notifyWrapper.classList.toggle("open");
  });

  document.querySelector(".notify-clear").addEventListener("click", () => {
    notifyList.innerHTML = "<div class='small'>No notifications</div>";
    notifyCount.textContent = "0";
  });

  document.querySelector(".notify-close").addEventListener("click", () => {
    notifyWrapper.classList.remove("open");
  });

  /* ================= VERIFY SUBMIT ================= */
  verifyModal.querySelector(".btn").addEventListener("click", async () => {
    await apiFetch("/api/verify", { method: "POST" });
    alert("Verification submitted.");
    closeModals();
  });

  /* ================= UPLOAD SUBMIT ================= */
  uploadModal.querySelector(".btn").addEventListener("click", async () => {
    await apiFetch("/api/upload-documents", { method: "POST" });
    alert("Documents uploaded.");
    closeModals();
  });

  /* ================= LOGOUT ================= */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "signin.html";
    });
  }

  /* ================= INIT ================= */
  loadDashboard();

})();