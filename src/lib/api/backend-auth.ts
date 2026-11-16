import { authClient } from "@/lib/auth-client";

type CachedToken = { token: string; exp: number };

let cached: CachedToken | null = null;
let inflight: Promise<string | null> | null = null;

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const json = atob(padded);
    const data = JSON.parse(json) as { exp?: number };
    return typeof data.exp === "number" ? data.exp : null;
  } catch {
    return null;
  }
}

function isValid(c: CachedToken | null): c is CachedToken {
  if (!c?.token) return false;
  const now = Math.floor(Date.now() / 1000);
  return c.exp > now + 30;
}

async function fetchToken(force = false): Promise<string | null> {
  if (!force && isValid(cached)) return cached.token;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const result = await authClient.token();
      const token = (result as { data?: { token?: string } } | null)?.data?.token;
      if (!token) {
        cached = null;
        return null;
      }
      const exp = decodeJwtExp(token) ?? Math.floor(Date.now() / 1000) + 300;
      cached = { token, exp };
      return token;
    } catch {
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function getBackendAuthHeaders(forceRefresh = false): Promise<HeadersInit> {
  const token = await fetchToken(forceRefresh);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWithBackendAuth(
  input: string | URL | Request,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const authHeaders = await getBackendAuthHeaders(!retry);
  const headers = new Headers(init.headers ?? {});
  for (const [k, v] of Object.entries(authHeaders)) headers.set(k, v);

  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });

  if (response.status === 401 && retry) {
    await fetchToken(true);
    return fetchWithBackendAuth(input, init, false);
  }

  return response;
}