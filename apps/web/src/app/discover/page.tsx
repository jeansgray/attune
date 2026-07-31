"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { INTENT_LABELS, NEUROTYPE_LABELS, type NeurotypeTag } from "@attune/shared";
import { SiteNav } from "@/components/AppNav";
import { SafetyActions } from "@/components/SafetyActions";
import { api, getToken } from "@/lib/api";

type Entitlement = {
  isPlus: boolean;
  likesRemainingToday: number | null;
  dailyLikeLimit: number;
};

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
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ entitlement: Entitlement; results: DiscoverCard[] }>("/discover");
      setItems(data.results);
      setEntitlement(data.entitlement);
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
    setError("");
    try {
      const res = await api<{ matched: boolean; entitlement: Entitlement }>("/likes", {
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
      setEntitlement(res.entitlement);
      if (res.matched) {
        alert(`It's a match with ${card.profile.displayName}!`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Like failed";
      setError(message);
      if (message.toLowerCase().includes("attune plus") || message.toLowerCase().includes("likes per day")) {
        // soft nudge — stay on page
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <SiteNav authed />
      <main className="container">
        <div className="page-head">
          <div>
            <h1>Discover</h1>
            <p className="meta">Ranked by needs compatibility — not popularity.</p>
          </div>
          <div className="meta" style={{ textAlign: "right" }}>
            {entitlement?.isPlus ? (
              <span className="score">Attune Plus</span>
            ) : (
              <>
                <div>
                  {entitlement?.likesRemainingToday ?? "—"} / {entitlement?.dailyLikeLimit ?? 5} likes
                  left today
                </div>
                <Link href="/plus" style={{ color: "var(--teal)", fontWeight: 600 }}>
                  Upgrade for unlimited →
                </Link>
              </>
            )}
          </div>
        </div>
        {error ? (
          <p className="error">
            {error}{" "}
            {error.toLowerCase().includes("plus") || error.toLowerCase().includes("likes per day") ? (
              <Link href="/plus">Get Attune Plus</Link>
            ) : null}
          </p>
        ) : null}
        {loading ? <p className="meta">Tuning your feed…</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="meta">No more profiles right now. Check matches or tweak your needs.</p>
        ) : null}
        <div className="discover-list">
          {items.map((card) => (
            <article className="profile-card" key={card.userId}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  card.profile.photoUrls[0] ??
                  "https://api.dicebear.com/9.x/lorelei/svg?seed=attune&backgroundColor=d7ebe4"
                }
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
                  <span className="score">{card.score.total}% match</span>
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
                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    gap: "0.6rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
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
                  <SafetyActions
                    userId={card.userId}
                    displayName={card.profile.displayName}
                    onBlocked={() =>
                      setItems((prev) => prev.filter((i) => i.userId !== card.userId))
                    }
                  />
                </div>
                {card.score.interestBonus > 0 ? (
                  <p className="meta" style={{ marginTop: "0.6rem" }}>
                    Shared interests boost this match
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <p className="meta" style={{ marginTop: "2rem" }}>
          Filter by intent anytime — {Object.values(INTENT_LABELS).join(", ")}.
        </p>
      </main>
    </>
  );
}
