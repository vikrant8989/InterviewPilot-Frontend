import { getApiBaseUrl } from "./config";

export type ApiError = { message: string; code?: string };

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(opts.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Request failed: ${res.status}`;
    try {
      const body = JSON.parse(text);
      message = body?.detail || body?.message || message;
    } catch {
      // ignore
    }
    throw { message } satisfies ApiError;
  }

  return (await res.json()) as T;
}

