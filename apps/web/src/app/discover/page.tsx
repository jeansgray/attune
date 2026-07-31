"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { INTENT_LABELS, NEUROTYPE_LABELS, type NeurotypeTag } from "@attune/shared";
import { SiteNav } from "@/components/AppNav";
import { api, getToken } from "@/lib/api";

type DiscoverCard = {
  userId: string;
  score: { total: number; vectorSimilarity: number; interestBonus: number };
  profile: {
    displayName: string;
    bio: string;
    city: string | null;
    neurotypeTags: string[];
    specialInterests: string[];
    photoUrls: string[];
    socialBattery: string;
  };
  prompts: { id: string; promptText: string; answer: string }[];
};

export default function DiscoverPage() {
  const router = useRouter();
  const [items, setItems] = useState<DiscoverCard[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<DiscoverCard[]>("/discover");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    void load();
  }, [router]);

  async function like(card: DiscoverCard) {
    setBusyId(card.userId);
    try {
      const res = await api<{ matched: boolean }>("/likes", {
        method: "POST",
        body: JSON.stringify({
          toUserId: card.userId,
          promptId: card.prompts[0]?.id,
          comment: card.prompts[0]
            ? `Loved your answer about ${card.prompts[0].promptText.slice(0, 40)}`
            : undefined,
        }),
      });
      setItems((prev) => prev.filter((i) => i.userId !== card.userId));
      if (res.matched) {
        alert(`It's a match with ${card.profile.displayName}!`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Like failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <SiteNav authed />
      <main className="container" style={{ paddingBottom: "3rem" }}>
        <h1 className="brand">Discover</h1>
        <p className="meta">Ranked by needs compatibility — not popularity.</p>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="meta">Tuning your feed…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="meta">No more profiles right now. Check matches or tweak your needs.</p>
        ) : null}
        <div className="discover-list">
          {items.map((card) => (
            <article className="profile-card" key={card.userId}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.profile.photoUrls[0] ?? "https://api.dicebear.com/9.x/shapes/svg?seed=attune"}
                alt=""
              />
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{card.profile.displayName}</h2>
                    <p className="meta">
                      {card.profile.city ?? "Somewhere"} · battery {card.profile.socialBattery}
                    </p>
                  </div>
                  <span className="score">{card.score.total}% attune</span>
                </div>
                <p style={{ margin: "0.6rem 0" }}>{card.profile.bio}</p>
                <div className="chip-row">
                  {card.profile.neurotypeTags.map((t) => (
                    <span className="chip on" key={t}>
                      {NEUROTYPE_LABELS[t as NeurotypeTag] ?? t}
                    </span>
                  ))}
                  {card.profile.specialInterests.map((i) => (
                    <span className="chip" key={i}>
                      {i}
                    </span>
                  ))}
                </div>
                {card.prompts[0] ? (
                  <div className="prompt-block">
                    <div className="q">{card.prompts[0].promptText}</div>
                    <div>{card.prompts[0].answer}</div>
                  </div>
                ) : null}
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem" }}>
                  <button
                    className="btn"
                    type="button"
                    disabled={busyId === card.userId}
                    onClick={() => void like(card)}
                  >
                    Like
                  </button>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((i) => i.userId !== card.userId))}
                  >
                    Pass
                  </button>
                </div>
                <p className="meta" style={{ marginTop: "0.6rem" }}>
                  Needs match {card.score.vectorSimilarity}% · shared interests{" "}
                  {card.score.interestBonus}%
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className="meta" style={{ marginTop: "2rem" }}>
          Looking for something specific? Intents use labels like{" "}
          {Object.values(INTENT_LABELS).slice(0, 3).join(", ")}.
        </p>
      </main>
    </>
  );
}
