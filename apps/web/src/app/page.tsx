import Link from "next/link";
import { SiteNav } from "@/components/AppNav";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="hero">
          <div className="hero-visual" aria-hidden />
          <div className="container hero-inner">
            <div className="hero-copy">
              <h1 className="brand-hero">Attune</h1>
              <p>
                Friends and dating for neurodivergent social wants and needs —
                sensory fit, clear communication, and pacing that feels human.
              </p>
              <div className="hero-cta">
                <Link className="btn" href="/register">
                  Start matching
                </Link>
                <Link className="btn secondary" href="/login">
                  I have an account
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container section">
          <h2>Match on how you actually connect</h2>
          <p className="lede">
            Looking for friendship, romance, or something in between — labels
            are optional. Compatibility comes from communication style, sensory
            needs, social energy, and intent.
          </p>
          <div className="grid-3">
            <article className="feature" style={{ animationDelay: "60ms" }}>
              <h3>Friends or romance</h3>
              <p>
                Set your intent up front — friendship, queerplatonic, slow-burn
                romance, or exploring. Match with people looking for the same.
              </p>
            </article>
            <article className="feature" style={{ animationDelay: "140ms" }}>
              <h3>Needs profile</h3>
              <p>
                Reply pace, processing time, noise sensitivity, parallel play —
                set what matters, then we rank people who fit.
              </p>
            </article>
            <article className="feature" style={{ animationDelay: "220ms" }}>
              <h3>Attune Plus</h3>
              <p>
                Free daily likes to start. Plus unlocks unlimited likes, who
                liked you, and advanced filters when you&apos;re ready.
              </p>
            </article>
          </div>
          <p className="footer-links">
            <Link href="/privacy">Privacy</Link>
            {" · "}
            <Link href="/terms">Terms</Link>
          </p>
        </section>
      </main>
    </>
  );
}
