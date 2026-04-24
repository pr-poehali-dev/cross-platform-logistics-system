const URLS = {
  auth:   "https://functions.poehali.dev/abfcec0e-8a07-46c1-a180-390e2111a31a",
  orders: "https://functions.poehali.dev/78dd637d-8917-4fc3-a0f5-3ad6988bbf28",
  admin:  "https://functions.poehali.dev/2ba01886-cbb5-4e89-a6b7-2033a13a3533",
};

function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-Auth-Token": getToken() };
}

export async function apiLogin(login: string, password: string) {
  const r = await fetch(URLS.auth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  return r.json();
}

export async function apiMe() {
  const r = await fetch(`${URLS.auth}?action=me`, { headers: authHeaders() });
  return r.json();
}

export async function apiGetOrders() {
  const r = await fetch(`${URLS.orders}?action=list`, { headers: authHeaders() });
  return r.json();
}

export async function apiCreateOrder(data: Record<string, string>) {
  const r = await fetch(`${URLS.orders}?action=create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiUpdateOrder(id: number, fields: Record<string, unknown>) {
  const r = await fetch(`${URLS.orders}?action=update`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ id, ...fields }),
  });
  return r.json();
}

export async function apiGetLogs() {
  const r = await fetch(`${URLS.orders}?action=logs`, { headers: authHeaders() });
  return r.json();
}

export async function apiGetRefs() {
  const r = await fetch(`${URLS.orders}?action=refs`, { headers: authHeaders() });
  return r.json();
}

// ── Admin API ──────────────────────────────────────────────────────────────
export async function apiAdminList(resource: string) {
  const r = await fetch(`${URLS.admin}?resource=${resource}&action=list`, { headers: authHeaders() });
  return r.json();
}

export async function apiAdminAdd(resource: string, data: Record<string, unknown>) {
  const r = await fetch(`${URLS.admin}?resource=${resource}&action=add`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiAdminEdit(resource: string, data: Record<string, unknown>) {
  const r = await fetch(`${URLS.admin}?resource=${resource}&action=edit`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiAdminDelete(resource: string, id: number) {
  const r = await fetch(`${URLS.admin}?resource=${resource}&action=delete`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ id }),
  });
  return r.json();
}