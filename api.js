export const API = "https://cryptodigitalpro-api.onrender.com/api";

export function getToken() {
  return localStorage.getItem("token");
}

export async function api(path, method = "GET", body) {
  const token = getToken();
  if (!token) location.href = "login.html";

  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: body ? JSON.stringify(body) : null
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    location.href = "login.html";
    return;
  }

  return res.json();
}
