"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/AppNav";
import { api, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await api<{ accessToken: string }>("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          displayName: form.get("displayName"),
        }),
      });
      setToken(res.accessToken);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="container">
        <form className="auth-panel" onSubmit={onSubmit}>
          <h1 style={{ marginTop: 0 }}>Join Attune</h1>
          <p className="meta">
            Friends, romance, or both — build a needs profile and match on what matters.
          </p>
          {error ? <p className="error">{error}</p> : null}
          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input id="displayName" name="displayName" required maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={8} />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Continue"}
          </button>
          <p className="meta" style={{ marginTop: "1rem" }}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </form>
      </main>
    </>
  );
}
