// Use env override when provided; otherwise same-origin so Vite dev proxy can handle /api.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const isJsonResponse = (res) => {
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json");
};

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers || {}) },
    });
  } catch (err) {
    // Surface network errors (e.g., CORS or connectivity) to the caller.
    throw new Error(err?.message || "Network error");
  }

  if (!res.ok) {
    const message = isJsonResponse(res)
      ? (await res.json())?.message || res.statusText
      : res.statusText;
    throw new Error(message || "Request failed");
  }

  if (!res.body || res.status === 204) return null;
  if (isJsonResponse(res)) return res.json();
  return res.text();
}

// Expose for utilities that need custom paths/methods.
export async function apiRequest(path, options) {
  return request(path, options);
}

export async function createData(content) {
  return request("/api/data", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getData(id) {
  return request(`/api/data/${id}`, {
    method: "GET",
  });
}

export function getApiBase() {
  return API_BASE || window.location.origin;
}
