const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN_KEY = 'kp_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(path, { method = 'GET', body, query } = {}) {
  let url = `${BASE}/api${path}`;
  if (query) {
    const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== null));
    if ([...qs].length) url += `?${qs}`;
  }
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'Cannot reach server. Check your internet connection.', 'NETWORK');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data?.error?.message || 'Request failed', data?.error?.code);
  }
  return data;
}

// Raw request for file uploads (FormData) and downloads (Blob).
async function raw(path, { method = 'GET', form, query } = {}) {
  let url = `${BASE}/api${path}`;
  if (query) {
    const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== null));
    if ([...qs].length) url += `?${qs}`;
  }
  const token = getToken();
  let res;
  try {
    res = await fetch(url, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  } catch {
    throw new ApiError(0, 'Cannot reach server. Check your internet connection.', 'NETWORK');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data?.error?.message || 'Request failed', data?.error?.code);
  }
  return res;
}

export const upload = async (path, form) => (await raw(path, { method: 'POST', form })).json();
export const getBlob = async (path, query) => (await raw(path, { query })).blob();

// Downloads a server file (e.g. CSV) with the auth header and saves it.
export async function download(path, query, filename) {
  const blob = await getBlob(path, query);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const get = (path, query) => api(path, { query });
export const post = (path, body) => api(path, { method: 'POST', body });
export const put = (path, body) => api(path, { method: 'PUT', body });
export const patch = (path, body) => api(path, { method: 'PATCH', body });
export const del = (path) => api(path, { method: 'DELETE' });
