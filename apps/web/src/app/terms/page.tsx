import Link from "next/link";
import { SiteNav } from "@/components/AppNav";

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main className="container section">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>Terms of Service</h1>
        <p className="meta">Last updated: July 31, 2026</p>
        <div className="panel wide" style={{ lineHeight: 1.6, color: "var(--muted)" }}>
          <p>
            By using Attune you agree to these terms. You must be 18+. Attune is for genuine
            friendship and romantic connection — harassment, scams, and non-consensual content
            are prohibited.
          </p>
          <h2 style={{ color: "var(--ink)" }}>Subscriptions</h2>
          <p>
            Free accounts receive limited daily likes. Attune Plus is a paid subscription billed
            through Stripe (web) or Apple / Google (mobile). Renewals and cancellations follow the
            store or Stripe portal rules. Prices shown in-app may include applicable taxes.
          </p>
          <h2 style={{ color: "var(--ink)" }}>Safety</h2>
          <p>
            You are responsible for interactions offline. Use block/report tools. We may suspend
            accounts that violate community standards.
          </p>
          <h2 style={{ color: "var(--ink)" }}>Disclaimer</h2>
          <p>
            Attune is provided as-is. Matching suggestions are compatibility estimates, not
            guarantees. Neurotype tags are optional self-identification, not medical advice.
          </p>
          <p>
            <Link href="/privacy">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </>
  );
}
