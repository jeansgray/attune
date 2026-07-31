"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { latestAllowedBirthYear, MIN_AGE, MIN_BIRTH_YEAR } from "@attune/shared";
import { SiteNav } from "@/components/AppNav";
import { api, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const maxYear = useMemo(() => latestAllowedBirthYear(), []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const birthYear = Number(form.get("birthYear"));
    try {
      const res = await api<{ accessToken: string }>("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          displayName: form.get("displayName"),
          birthYear,
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
            You must be {MIN_AGE}+.
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
          <div className="field">
            <label htmlFor="birthYear">Birth year</label>
            <input
              id="birthYear"
              name="birthYear"
              type="number"
              required
              min={MIN_BIRTH_YEAR}
              max={maxYear}
              placeholder={`e.g. ${maxYear - 5}`}
            />
            <p className="meta" style={{ marginTop: "0.35rem" }}>
              Attune is for adults {MIN_AGE} and over (born {maxYear} or earlier).
            </p>
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
