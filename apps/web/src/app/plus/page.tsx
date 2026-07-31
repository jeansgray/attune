"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLUS_FEATURES, PLUS_PRODUCTS } from "@attune/shared";
import { SiteNav } from "@/components/AppNav";
import { api, getToken } from "@/lib/api";

type Entitlement = {
  isPlus: boolean;
  plan: string;
  currentPeriodEnd: string | null;
  likesRemainingToday: number | null;
  dailyLikeLimit: number;
};

export default function PlusPage() {
  const router = useRouter();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function refresh() {
    const e = await api<Entitlement>("/billing/entitlement");
    setEntitlement(e);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("success") === "1";
    const sessionId = params.get("session_id");
    setSuccess(ok);
    (async () => {
      try {
        if (ok && sessionId) {
          const res = await api<{ confirmed: boolean; entitlement: Entitlement }>(
            "/billing/confirm-session",
            {
              method: "POST",
              body: JSON.stringify({ sessionId }),
            },
          );
          setEntitlement(res.entitlement);
          return;
        }
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    })();
  }, [router]);

  async function checkout(productKey: "monthly" | "yearly") {
    setLoading(productKey);
    setError("");
    try {
      const res = await api<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ productKey }),
      });
      if (res.url) window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  }

  async function portal() {
    setLoading("portal");
    try {
      const res = await api<{ url: string }>("/billing/portal", { method: "POST" });
      if (res.url) window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal unavailable");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <SiteNav authed />
      <main className="container">
        <div className="panel wide">
          <h1 style={{ marginTop: 0 }}>Attune Plus</h1>
          <p className="meta">
            Freemium friends & dating that respects your battery — upgrade when you want more
            reach.
          </p>
          {success ? <p className="score">Welcome to Plus — your subscription is active.</p> : null}
          {error ? <p className="error">{error}</p> : null}

          {entitlement?.isPlus ? (
            <div style={{ marginBottom: "1.5rem" }}>
              <p className="score">You have Attune Plus</p>
              {entitlement.currentPeriodEnd ? (
                <p className="meta">
                  Renews / ends {new Date(entitlement.currentPeriodEnd).toLocaleDateString()}
                </p>
              ) : null}
              <button className="btn secondary" type="button" onClick={() => void portal()}>
                Manage billing
              </button>
            </div>
          ) : (
            <p className="meta" style={{ marginBottom: "1.25rem" }}>
              Free plan: {entitlement?.likesRemainingToday ?? "—"} /{" "}
              {entitlement?.dailyLikeLimit ?? 5} likes left today.
            </p>
          )}

          <ul style={{ paddingLeft: "1.1rem", color: "var(--muted)", lineHeight: 1.7 }}>
            {PLUS_FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          {!entitlement?.isPlus ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
              <button
                className="btn"
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("monthly")}
              >
                {loading === "monthly"
                  ? "Starting…"
                  : `${PLUS_PRODUCTS.monthly.label} · ${PLUS_PRODUCTS.monthly.priceLabel}`}
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={loading !== null}
                onClick={() => void checkout("yearly")}
              >
                {loading === "yearly"
                  ? "Starting…"
                  : `${PLUS_PRODUCTS.yearly.label} · ${PLUS_PRODUCTS.yearly.priceLabel} (${PLUS_PRODUCTS.yearly.savingsLabel})`}
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
