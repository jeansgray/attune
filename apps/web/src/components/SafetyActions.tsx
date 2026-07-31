"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type Props = {
  userId: string;
  displayName?: string;
  onBlocked?: () => void;
};

export function SafetyActions({ userId, displayName, onBlocked }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"blocked" | "reported" | null>(null);

  async function block() {
    if (!confirm(`Block ${displayName ?? "this person"}? They won’t appear in Discover.`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/safety/block/${userId}`, { method: "POST" });
      setDone("blocked");
      onBlocked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not block");
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    const reason = window.prompt(
      `Why are you reporting ${displayName ?? "this person"}? (required)`,
      "",
    );
    if (!reason || reason.trim().length < 3) return;
    setBusy(true);
    setError("");
    try {
      await api("/safety/report", {
        method: "POST",
        body: JSON.stringify({ reportedUserId: userId, reason: reason.trim() }),
      });
      setDone("reported");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
      <button className="btn secondary" type="button" disabled={busy} onClick={() => void report()}>
        Report
      </button>
      <button className="btn secondary" type="button" disabled={busy} onClick={() => void block()}>
        Block
      </button>
      {done === "blocked" ? <span className="meta">Blocked</span> : null}
      {done === "reported" ? <span className="meta">Report sent</span> : null}
      {error ? <span className="error">{error}</span> : null}
    </div>
  );
}
