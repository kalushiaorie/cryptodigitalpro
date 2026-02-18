// auth-check.js
(function () {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const hasAppliedLoan = localStorage.getItem("hasAppliedLoan");

  const currentPath = window.location.pathname.toLowerCase();

  const isAdminPage = currentPath.includes("admin");
  const isDashboardPage = currentPath.includes("dashboard");

  // 🔒 1️⃣ Not logged in
  if (!token) {
    localStorage.setItem("redirectAfterLogin", window.location.href);

    if (isAdminPage) {
      window.location.href = "admin-signin.html";
    } else {
      window.location.href = "signin.html";
    }
    return;
  }

  // 👑 2️⃣ Admin pages protection
  if (isAdminPage) {
    if (role !== "admin") {
      window.location.href = "dashboard.html";
      return;
    }
  }

  // 👤 3️⃣ User dashboard protection
  if (isDashboardPage && !isAdminPage) {
    if (role !== "user") {
      window.location.href = "admin-dashboard.html";
      return;
    }

    if (!hasAppliedLoan) {
      window.location.href = "Busines-loan-form.html";
      return;
    }
  }

})();