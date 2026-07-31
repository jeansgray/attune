import { Platform } from "react-native";

const host =
  Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:4000`;

let token: string | null = null;

export function getToken() {
  return token;
}

export function setToken(next: string | null) {
  token = next;
}

export async function api<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");
  if (opts.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}/api${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}
