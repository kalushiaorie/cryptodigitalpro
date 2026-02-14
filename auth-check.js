(function () {
  const API = "https://cryptodigitalpro-api.onrender.com";
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "signin.html";
    return;
  }

  fetch(API + "/api/auth/verify", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.valid) {
      localStorage.removeItem("token");
      window.location.href = "signin.html";
      return;
    }

    // 🔐 Admin page protection
    if (document.body.classList.contains("admin-page")) {
      if (!data.user || !data.user.is_admin) {
        window.location.href = "dashboard.html";
      }
    }
  })
  .catch(() => {
    window.location.href = "signin.html";
  });
})();
