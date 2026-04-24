const URLS = {
  auth:   "https://functions.poehali.dev/abfcec0e-8a07-46c1-a180-390e2111a31a",
  orders: "https://functions.poehali.dev/78dd637d-8917-4fc3-a0f5-3ad6988bbf28",
  admin:  "https://functions.poehali.dev/2ba01886-cbb5-4e89-a6b7-2033a13a3533",
};

function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", "Authorization": getToken() };
}

async function safeFetch(input: string, init?: RequestInit): Promise<Record<string, unknown>> {
  try {
    const r = await fetch(input, init);
    return r.json();
  } catch {
    return { error: "Ошибка сети. Проверьте подключение и попробуйте снова." };
  }
}

export async function apiLogin(login: string, password: string) {
  return safeFetch(URLS.auth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
}

export async function apiMe() {
  return safeFetch(`${URLS.auth}?action=me`, { headers: authHeaders() });
}

export async function apiGetOrders() {
  return safeFetch(`${URLS.orders}?action=list`, { headers: authHeaders() });
}

export async function apiCreateOrder(data: Record<string, string>) {
  return safeFetch(`${URLS.orders}?action=create`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  });
}

export async function apiUpdateOrder(id: number, fields: Record<string, unknown>) {
  return safeFetch(`${URLS.orders}?action=update`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ id, ...fields }),
  });
}

export async function apiGetLogs() {
  return safeFetch(`${URLS.orders}?action=logs`, { headers: authHeaders() });
}

export async function apiGetRefs() {
  return safeFetch(`${URLS.orders}?action=refs`, { headers: authHeaders() });
}

// ── Admin API ──────────────────────────────────────────────────────────────
export async function apiAdminList(resource: string) {
  return safeFetch(`${URLS.admin}?resource=${resource}&action=list`, { headers: authHeaders() });
}

export async function apiAdminAdd(resource: string, data: Record<string, unknown>) {
  return safeFetch(`${URLS.admin}?resource=${resource}&action=add`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  });
}

export async function apiAdminEdit(resource: string, data: Record<string, unknown>) {
  return safeFetch(`${URLS.admin}?resource=${resource}&action=edit`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(data),
  });
}

export async function apiAdminDelete(resource: string, id: number) {
  return safeFetch(`${URLS.admin}?resource=${resource}&action=delete`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ id }),
  });
}
