import Link from "next/link";
import { SiteNav } from "@/components/AppNav";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="container hero">
          <div className="hero-visual" aria-hidden />
          <div className="hero-copy">
            <h1 className="brand-hero">Attune</h1>
            <p>
              Dating built for neurodivergent social wants and needs — sensory fit,
              communication clarity, and real pacing.
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
        </section>

        <section className="container section">
          <h2>Match on how you actually connect</h2>
          <p className="lede">
            Labels are optional. Compatibility is scored on communication, sensory profile,
            social energy, and relationship intent.
          </p>
          <div className="grid-3">
            <article className="feature" style={{ animationDelay: "80ms" }}>
              <h3>Needs profile</h3>
              <p>
                Set reply pace, processing time, noise sensitivity, parallel play preference,
                and more — then we rank people who fit.
              </p>
            </article>
            <article className="feature" style={{ animationDelay: "160ms" }}>
              <h3>Prompt-led discovery</h3>
              <p>
                Profile prompts and special interests first — depth over endless scrolling.
              </p>
            </article>
            <article className="feature" style={{ animationDelay: "240ms" }}>
              <h3>Low-stimulation by design</h3>
              <p>
                Calm interface, optional social battery status, and space to recharge without
                ghosting guilt.
              </p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
