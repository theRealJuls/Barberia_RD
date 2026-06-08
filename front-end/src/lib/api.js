const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

export async function apiRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Error de comunicación con el servidor.");
  }
  return payload;
}
