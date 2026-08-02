export function setTokens(access: string, refresh: string) {
  try {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
  } catch (e) {}
}

export function clearTokens() {
  try {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    try {
      stopRefresh();
    } catch (e) {}
  } catch (e) {}
}


export function getAccess(): string | null {
  try {
    return localStorage.getItem("access");
  } catch (e) {
    return null;
  }
}

export function getRefresh(): string | null {
  try {
    return localStorage.getItem("refresh");
  } catch (e) {
    return null;
  }
}

export function decodeToken(access?: string | null): any | null {
  try {
    const token = access || getAccess();
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

import axios from "axios";

let refreshTimer: number | null = null;

function getExpiryMs(token?: string | null): number | null {
  const p = decodeToken(token);
  if (!p || !p.exp) return null;
  // exp is seconds since epoch
  const expMs = p.exp * 1000;
  return expMs - Date.now();
}

export async function refreshToken(): Promise<boolean> {
  try {
    const refresh = getRefresh();
    if (!refresh) return false;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/";
    const resp = await axios.post(`${base}token/refresh/`, { refresh });
    const newAccess = resp.data?.access;
    if (newAccess) {
      setTokens(newAccess, refresh);
      scheduleRefresh(newAccess);
      return true;
    }
  } catch (e) {
    console.error("refreshToken failed", e);
  }
  return false;
}

export function scheduleRefresh(access?: string | null) {
  try {
    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    const token = access || getAccess();
    const ms = getExpiryMs(token);
    if (!ms) return;
    // schedule refresh 60 seconds before expiry or at half the lifetime if short
    const when = Math.max(1000, ms - 60000);
    refreshTimer = window.setTimeout(() => {
      refreshToken().catch(() => {});
    }, when) as unknown as number;
  } catch (e) {}
}

export function stopRefresh() {
  if (refreshTimer) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export function getUsername(): string | null {
  const p = decodeToken();
  return p?.username ?? null;
}

export function getRole(): string | null {
  const username = getUsername();
  if (!username) return null;
  const n = username.toLowerCase();
  if (n.startsWith("reception")) return "Receptionist";
  if (n.startsWith("doctor")) return "Doctor";
  if (n.startsWith("patient")) return "Patient";
  return null;
}

export function isAuthenticated(): boolean {
  return !!getAccess();
}

export default {
  setTokens,
  clearTokens,
  getAccess,
  getRefresh,
  decodeToken,
  getUsername,
  getRole,
  isAuthenticated,
  scheduleRefresh,
  stopRefresh,
  refreshToken,
};
