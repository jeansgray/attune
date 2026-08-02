import Link from "next/link";
import { SiteNav } from "@/components/AppNav";

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="container section">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>Privacy Policy</h1>
        <p className="meta">Last updated: July 31, 2026</p>
        <div className="panel wide" style={{ lineHeight: 1.6, color: "var(--muted)" }}>
          <p>
            Attune (“we”) helps neurodivergent adults find compatible connection. This policy
            explains what we collect and how we use it.
          </p>
          <h2 style={{ color: "var(--ink)" }}>What we collect</h2>
          <p>
            Account info (email, password hash), profile details you provide (bio, photos, optional
            neurotype tags, needs profile, prompts), usage data (likes, matches, messages), and
            billing status from Stripe / Apple / Google (not full card numbers).
          </p>
          <h2 style={{ color: "var(--ink)" }}>How we use it</h2>
          <p>
            To power matching, messaging, safety tools, subscriptions, and product improvement. We
            do not sell personal data.
          </p>
          <h2 style={{ color: "var(--ink)" }}>Sharing</h2>
          <p>
            Service providers that process data on our behalf (hosting, email, payment processors).
            We may disclose information if required by law or to prevent harm.
          </p>
          <h2 style={{ color: "var(--ink)" }}>Your choices</h2>
          <p>
            You can update or delete profile content, cancel subscriptions via Stripe / App Store /
            Play Store, and delete your account anytime in Settings (or email privacy@attune.app).
          </p>
          <h2 style={{ color: "var(--ink)" }}>Contact</h2>
          <p>
            privacy@attune.app — replace with your real support email before App Store submission.
          </p>
          <p>
            <Link href="/terms">Terms of Service</Link>
          </p>
        </div>
      </main>
    </>
  );
}
