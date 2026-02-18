// admin-dashboard.js

(function () {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    window.location.href = "signin.html";
    return;
  }

  const loanList = document.getElementById("loanList");
  const withdrawList = document.getElementById("withdrawList");
  const auditLogs = document.getElementById("auditLogs");
  const toast = document.getElementById("toast");
  const ctx = document.getElementById("loanChart");

  /* =====================================================
     ================= TOAST =============================
  ===================================================== */

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  /* =====================================================
     ================= WITHDRAWAL SYSTEM =================
  ===================================================== */

  const STATUS_LABELS = {
    pending: "Pending",
    broadcast_hold: "Broadcast Hold (47%)",
    broadcast_approved: "Broadcast Approved",
    compliance_hold: "Compliance Hold (73%)",
    compliance_approved: "Compliance Approved",
    completed: "Completed",
    rejected: "Rejected"
  };

  async function fetchWithdrawals() {
    const res = await fetch("/api/admin/withdraw", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    return await res.json();
  }

  async function renderWithdrawals() {

    withdrawList.innerHTML = "";

    const withdrawals = await fetchWithdrawals();

    if (!withdrawals || withdrawals.length === 0) {
      withdrawList.innerHTML = "<p>No withdrawal requests.</p>";
      return;
    }

    withdrawals.forEach(w => {

      const div = document.createElement("div");
      div.className = "withdraw-card";

      div.innerHTML = `
        <h4>${w.userId?.email || "Unknown User"}</h4>
        <p><strong>Amount:</strong> $${Number(w.amount).toLocaleString()}</p>
        <p><strong>Wallet:</strong> ${w.walletAddress}</p>
        <p><strong>Network:</strong> ${w.network}</p>
        <p class="status">
          Status: ${STATUS_LABELS[w.status]}
        </p>
        <div class="actions" id="actions-${w._id}"></div>
      `;

      withdrawList.appendChild(div);

      renderWithdrawActions(w);
    });
  }

  function renderWithdrawActions(w) {

    const container = document.getElementById(`actions-${w._id}`);
    container.innerHTML = "";

    if (w.status === "broadcast_hold") {
      container.innerHTML += `
        <button class="btn green"
          onclick="approveBroadcast('${w._id}')">
          Approve Broadcast
        </button>
      `;
    }

    if (w.status === "compliance_hold") {
      container.innerHTML += `
        <button class="btn green"
          onclick="approveCompliance('${w._id}')">
          Approve Compliance
        </button>
      `;
    }

    if (!["completed", "rejected"].includes(w.status)) {
      container.innerHTML += `
        <button class="btn red"
          onclick="rejectWithdrawal('${w._id}')">
          Reject
        </button>
      `;
    }
  }

  window.approveBroadcast = async function (id) {
    await fetch(`/api/admin/withdraw/${id}/broadcast-approve`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    showToast("Broadcast approved.");
    renderWithdrawals();
  };

  window.approveCompliance = async function (id) {
    await fetch(`/api/admin/withdraw/${id}/compliance-approve`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    showToast("Compliance approved.");
    renderWithdrawals();
  };

  window.rejectWithdrawal = async function (id) {

    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    await fetch(`/api/admin/withdraw/${id}/reject`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ reason })
    });

    showToast("Withdrawal rejected.");
    renderWithdrawals();
  };

  /* =====================================================
     ================= LOAN SYSTEM (UNCHANGED) ===========
  ===================================================== */

  let loans = JSON.parse(localStorage.getItem("adminLoans")) || [];

  function renderLoans() {
    loanList.innerHTML = "";

    if (loans.length === 0) {
      loanList.innerHTML = "<p>No loan applications.</p>";
      return;
    }

    loans.forEach(loan => {

      const div = document.createElement("div");
      div.className = "loan-card";

      div.innerHTML = `
        <h4>${loan.user}</h4>
        <p><strong>Amount:</strong> $${loan.amount.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${loan.duration} months</p>
        <p class="status ${loan.status}">
          Status: ${loan.status.toUpperCase()}
        </p>
      `;

      loanList.appendChild(div);
    });
  }

  /* =====================================================
     ================= ANALYTICS =========================
  ===================================================== */

  let chart;

  function renderAnalytics() {

    const counts = {
      pending: loans.filter(l => l.status === "pending").length,
      approved: loans.filter(l => l.status === "approved").length,
      credited: loans.filter(l => l.status === "credited").length,
      rejected: loans.filter(l => l.status === "rejected").length
    };

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Pending", "Approved", "Credited", "Rejected"],
        datasets: [{
          label: "Loan Status Overview",
          data: [
            counts.pending,
            counts.approved,
            counts.credited,
            counts.rejected
          ],
          backgroundColor: [
            "#facc15",
            "#4ade80",
            "#60a5fa",
            "#ef4444"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  /* =====================================================
     ================= INIT ==============================
  ===================================================== */

  renderLoans();
  renderWithdrawals();
  renderAnalytics();

})();