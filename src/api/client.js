// Cliente HTTP de la API FastAPI de Green Saver.
// - Agrega "Authorization: Bearer <token>" cuando hay sesión.
// - Si la API responde 401, intenta UNA vez renovar el token con el refresh token
//   y repite la petición; si no se puede, cierra la sesión.
// - Convierte los distintos formatos de error de FastAPI en un mensaje legible.

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

let session = { token: null, refreshToken: null };
let onSessionChange = () => {};
let onSessionExpired = () => {};

export function configureSession({ token, refreshToken, onChange, onExpired }) {
  session = { token: token ?? null, refreshToken: refreshToken ?? null };
  if (onChange) onSessionChange = onChange;
  if (onExpired) onSessionExpired = onExpired;
}

export function setTokens(token, refreshToken) {
  session = { token, refreshToken: token ? refreshToken ?? session.refreshToken : null };
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function errorMessage(data, status) {
  if (typeof data === "string" && data.trim()) return data;
  const detail = data?.detail ?? data?.message;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const campo = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : null;
        return campo ? `${campo}: ${d.msg}` : d?.msg || String(d);
      })
      .join(" · ");
  }
  if (status === 0) return "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";
  return `El servidor respondió con un error (${status}).`;
}

async function parse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function rawRequest(path, { method = "GET", body, query, auth = true } = {}) {
  const url = new URL(API_URL + path);
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`;

  let response;
  try {
    response = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(errorMessage(null, 0), 0, null);
  }
  const data = await parse(response);
  return { response, data };
}

let refreshing = null;

async function refreshTokens() {
  if (!session.refreshToken) return false;
  if (!refreshing) {
    refreshing = (async () => {
      const { response, data } = await rawRequest("/auth/refresh", {
        method: "POST",
        body: { refreshToken: session.refreshToken },
        auth: false,
      });
      if (!response.ok || !data?.access_token) return false;
      setTokens(data.access_token, data.refresh_token);
      onSessionChange(data);
      return true;
    })().finally(() => {
      setTimeout(() => (refreshing = null), 0);
    });
  }
  return refreshing;
}

export async function api(path, options = {}) {
  let { response, data } = await rawRequest(path, options);
  if (response.status === 401 && options.auth !== false && session.refreshToken) {
    const ok = await refreshTokens().catch(() => false);
    if (ok) {
      ({ response, data } = await rawRequest(path, options));
    }
  }
  if (response.status === 401 && options.auth !== false && session.token) {
    onSessionExpired();
  }
  if (!response.ok) {
    throw new ApiError(errorMessage(data, response.status), response.status, data);
  }
  return data;
}
