"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/AppNav";
import { api, getToken, setToken } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<{ email: string }>("/auth/me")
      .then((me) => setEmail(me.email))
      .catch(() => router.replace("/login"));
  }, [router]);

  async function onDelete(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (confirm !== "DELETE") {
      setError('Type DELETE in the confirmation box to continue.');
      return;
    }
    if (
      !window.confirm(
        "This permanently deletes your Attune account, photos, prompts, matches, and messages. Continue?",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await api("/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ password, confirm: "DELETE" }),
      });
      setToken(null);
      router.replace("/register");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SiteNav authed />
      <main className="container">
        <div className="panel wide" style={{ marginTop: "2rem" }}>
          <h1 style={{ marginTop: 0 }}>Settings</h1>
          <p className="meta">Signed in as {email || "…"}</p>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem" }}>
            Delete account
          </h2>
          <p className="meta">
            Removes your profile, photos, voice/video prompts, likes, matches, and messages. This
            cannot be undone. Cancel Attune Plus in Stripe or App Store separately if you subscribed.
          </p>
          {error ? <p className="error">{error}</p> : null}
          <form onSubmit={onDelete}>
            <div className="field">
              <label htmlFor="password">Current password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="confirm">Type DELETE to confirm</label>
              <input
                id="confirm"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            <button className="btn secondary" type="submit" disabled={busy}>
              {busy ? "Deleting…" : "Delete my account"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
