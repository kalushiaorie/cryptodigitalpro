(function () {

  /* ================= CONFIG ================= */
  const API = "https://cryptodigitalpro-api.onrender.com";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  /* ================= ELEMENTS ================= */
  const loanList = document.getElementById("loanList");
  const txList = document.getElementById("txList");
  const depositedBox = document.getElementById("depositedBox");
  const availableBox = document.getElementById("availableBox");
  const outstandingBox = document.getElementById("outstandingBox");
  const withdrawnBox = document.getElementById("withdrawnBox");

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
    try {
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

      return await res.json();
    } catch (err) {
      console.error("API Error:", err);
    }
  }

  /* ================= SOCKET.IO ================= */
  if (user && window.io) {
    const socket = io(API);

    socket.on("connect", () => {
      socket.emit("join", user.id);
    });

    socket.on("new_notification", (data) => {
      if (!notifyCount || !notifyList) return;

      const currentCount = Number(notifyCount.textContent || 0) + 1;
      notifyCount.textContent = currentCount;
      notifyCount.classList.add("badge-unread");

      const item = document.createElement("div");
      item.className = "notify-item small notify-animate";
      item.textContent = data.title || data.message || "New notification";

      notifyList.prepend(item);

      setTimeout(() => {
        item.classList.remove("notify-animate");
      }, 400);
    });

    socket.on("new_admin_message", (msg) => {
      if (!adminMessages || !adminBtn) return;

      const messageItem = document.createElement("div");
      messageItem.className = "admin-msg admin-animate";
      messageItem.innerHTML = `
        <strong>${msg.title}</strong>
        <div class="small">${msg.body}</div>
      `;

      adminMessages.prepend(messageItem);

      const match = adminBtn.textContent.match(/\((\d+)\)/);
      const count = match ? Number(match[1]) : 0;
      adminBtn.textContent = `Admin Messages (${count + 1})`;
      adminBtn.classList.add("badge-unread");

      setTimeout(() => {
        messageItem.classList.remove("admin-animate");
      }, 400);
    });
  }

  /* ================= LOAD KYC STATUS ================= */
  async function loadKycStatus() {
    try {
      const res = await fetch(API + "/api/kyc/status", {
        headers: { Authorization: "Bearer " + token }
      });

      if (!res.ok) return;

      const data = await res.json();
      const withdrawBtn = document.getElementById("withdrawBtn");
      if (!verifyBtn || !withdrawBtn) return;

      if (data.status === "approved") {
        verifyBtn.textContent = "Verified ✔";
        verifyBtn.style.background = "#16c784";
        withdrawBtn.disabled = false;
        withdrawBtn.classList.remove("locked");
        withdrawBtn.innerHTML = "Withdraw";
      } else {
        verifyBtn.textContent =
          data.status === "pending"
            ? "Verification Pending"
            : "Not Verified";

        withdrawBtn.disabled = true;
        withdrawBtn.classList.add("locked");
        withdrawBtn.innerHTML =
          data.status === "pending"
            ? "Withdraw (KYC Pending)"
            : "Withdraw (KYC Required)";
      }
    } catch (err) {
      console.error("KYC status error:", err);
    }
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

  /* ================= RENDER FUNCTIONS ================= */
  function renderBalances(balances = {}) {
    if (depositedBox)
      depositedBox.textContent =
        "$" + Number(balances.deposited || 0).toLocaleString();
    if (availableBox)
      availableBox.textContent =
        "$" + Number(balances.available || 0).toLocaleString();
    if (outstandingBox)
      outstandingBox.textContent =
        "$" + Number(balances.outstanding || 0).toLocaleString();
    if (withdrawnBox)
      withdrawnBox.textContent =
        "$" + Number(balances.withdrawn || 0).toLocaleString();
  }

  function renderLoans(loans = []) {
    if (!loanList) return;
    loanList.innerHTML = loans.length
      ? loans.map(loan => `
          <div class="loan-item">
            <strong>${loan.loan_type}</strong>
            <div class="small">
              Amount: $${Number(loan.amount).toLocaleString()} |
              Status: ${loan.status}
            </div>
          </div>
        `).join("")
      : "No loan applications yet.";
  }

  function renderTransactions(transactions = []) {
    if (!txList) return;
    txList.innerHTML = transactions.length
      ? transactions.map(tx => `
          <div class="tx-item">
            <div>${tx.type}</div>
            <div>$${Number(tx.amount).toLocaleString()}</div>
          </div>
        `).join("")
      : "No transactions available.";
  }

  function renderNotifications(notifications = []) {
    if (!notifyList || !notifyCount) return;
    notifyCount.textContent = notifications.length;
    notifyList.innerHTML = notifications.length
      ? notifications.map(n => `
          <div class="notify-item small">
            ${n.message}
          </div>
        `).join("")
      : "<div class='small'>No notifications</div>";
  }

  function renderAdminMessages(messages = []) {
    if (!adminMessages || !adminBtn) return;
    adminMessages.innerHTML = messages.length
      ? messages.map(msg => `
          <div class="admin-msg">
            <strong>${msg.title}</strong>
            <div class="small">${msg.body}</div>
          </div>
        `).join("")
      : "No messages.";

    adminBtn.textContent = `Admin Messages (${messages.length})`;
  }

  /* ================= MODALS ================= */
  function openModal(modal) {
    if (modal) modal.classList.remove("hidden");
  }

  function closeModals() {
    document.querySelectorAll(".modal")
      .forEach(m => m.classList.add("hidden"));
  }

  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      openModal(adminModal);
      adminBtn.classList.remove("badge-unread");
    });
  }

  if (verifyBtn)
    verifyBtn.addEventListener("click", () => openModal(verifyModal));

  if (uploadBtn)
    uploadBtn.addEventListener("click", () => openModal(uploadModal));

  document.querySelectorAll(".closeModal")
    .forEach(btn => btn.addEventListener("click", closeModals));

  /* ================= NOTIFICATION DROPDOWN ================= */
  if (notifyWrapper) {
    notifyWrapper.addEventListener("click", () => {
      notifyWrapper.classList.toggle("open");
      if (notifyCount)
        notifyCount.classList.remove("badge-unread");
    });
  }

  document.querySelector(".notify-clear")?.addEventListener("click", () => {
    if (notifyList) notifyList.innerHTML = "<div class='small'>No notifications</div>";
    if (notifyCount) notifyCount.textContent = "0";
  });

  document.querySelector(".notify-close")?.addEventListener("click", () => {
    notifyWrapper?.classList.remove("open");
  });

  /* ================= LOGOUT ================= */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "signin.html";
    });
  }

  /* ================= INIT ================= */
  loadKycStatus();
  loadDashboard();

})();
