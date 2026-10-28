import { supabase } from "./supabase";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function req(path, { method = "GET", body } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  list: () => req("/api/trips"),
  get: (id) => req(`/api/trips/${id}`),
  generate: (prefs) => req("/api/trips/generate", { method: "POST", body: prefs }),
  save: (payload) => req("/api/trips", { method: "POST", body: payload }),
  update: (id, patch) => req(`/api/trips/${id}`, { method: "PUT", body: patch }),
  remove: (id) => req(`/api/trips/${id}`, { method: "DELETE" }),
  regenerate: (id, payload) => req(`/api/trips/${id}/regenerate`, { method: "POST", body: payload }),
};
