export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

export function authHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}
requireAuth()
requireAdmin()
getToken()
logout()
