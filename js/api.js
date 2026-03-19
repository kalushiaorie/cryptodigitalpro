const API_BASE = "http://localhost:3000";

export async function apiRequest(endpoint, method = "GET", data = null, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "API error");

  return result;
}
