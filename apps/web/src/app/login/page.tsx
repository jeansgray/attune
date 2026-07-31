"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/AppNav";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await api<{ accessToken: string; user: { onboardingComplete: boolean } }>(
        "/auth/login",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        },
      );
      setToken(res.accessToken);
      router.push(res.user.onboardingComplete ? "/discover" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="container">
        <form className="auth-panel" onSubmit={onSubmit}>
          <h1 className="brand" style={{ marginTop: 0 }}>
            Welcome back
          </h1>
          <p className="meta">Demo: you@attune.demo / password123</p>
          {error ? <p className="error">{error}</p> : null}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required defaultValue="you@attune.demo" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="password123"
            />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </button>
          <p className="meta" style={{ marginTop: "1rem" }}>
            New here? <Link href="/register">Create an account</Link>
          </p>
        </form>
      </main>
    </>
  );
}
