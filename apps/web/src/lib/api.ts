const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("attune_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("attune_token", token);
  else localStorage.removeItem("attune_token");
}

function extractErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Request failed";
  const e = err as { message?: unknown; error?: string };
  if (typeof e.message === "string") return e.message;
  if (e.message && typeof e.message === "object") {
    const nested = e.message as { message?: string };
    if (typeof nested.message === "string") return nested.message;
  }
  if (Array.isArray(e.message)) return e.message.join(", ");
  if (typeof e.error === "string") return e.error;
  return "Request failed";
}

export async function api<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...opts,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(extractErrorMessage(err));
  }
  return res.json() as Promise<T>;
}
