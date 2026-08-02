"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { INTENT_LABELS, NEUROTYPE_LABELS, type NeurotypeTag } from "@attune/shared";
import { SiteNav } from "@/components/AppNav";
import { ProfileGallery } from "@/components/ProfileGallery";
import { PromptCard } from "@/components/PromptCard";
import { SafetyActions } from "@/components/SafetyActions";
import { SwipeDeck } from "@/components/SwipeDeck";
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
  prompts: {
    id: string;
    promptText: string;
    answer: string;
    mediaType?: string;
    mediaUrl?: string | null;
  }[];
};

function ProfileCardView({
  card,
  onBlocked,
}: {
  card: DiscoverCard;
  onBlocked: (userId: string) => void;
}) {
  return (
    <article className="profile-card swipe-profile">
      <ProfileGallery photoUrls={card.profile.photoUrls} alt={card.profile.displayName} />
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
        <div className="prompt-stack">
          {card.prompts.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
        <div style={{ marginTop: "1rem" }}>
          <SafetyActions
            userId={card.userId}
            displayName={card.profile.displayName}
            onBlocked={() => onBlocked(card.userId)}
          />
        </div>
        {card.score.interestBonus > 0 ? (
          <p className="meta" style={{ marginTop: "0.6rem" }}>
            Shared interests boost this match
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const [items, setItems] = useState<DiscoverCard[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [matchName, setMatchName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const removeCard = useCallback((userId: string) => {
    setItems((prev) => prev.filter((i) => i.userId !== userId));
  }, []);

  const top = items[0];
  const next = items[1];

  const onPass = useCallback(() => {
    if (!top) return;
    removeCard(top.userId);
  }, [removeCard, top]);

  const onLike = useCallback(async () => {
    if (!top) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<{ matched: boolean; entitlement: Entitlement }>("/likes", {
        method: "POST",
        body: JSON.stringify({
          toUserId: top.userId,
          promptId: top.prompts[0]?.id,
          comment: top.prompts[0]
            ? `Loved your answer about ${top.prompts[0].promptText.slice(0, 40)}`
            : undefined,
        }),
      });
      removeCard(top.userId);
      setEntitlement(res.entitlement);
      if (res.matched) setMatchName(top.profile.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Like failed");
      throw err;
    } finally {
      setBusy(false);
    }
  }, [removeCard, top]);

  const topCard = useMemo(
    () => (top ? <ProfileCardView card={top} onBlocked={removeCard} /> : null),
    [removeCard, top],
  );
  const nextCard = useMemo(
    () => (next ? <ProfileCardView card={next} onBlocked={removeCard} /> : null),
    [next, removeCard],
  );

  return (
    <>
      <SiteNav authed />
      <main className="container">
        <div className="page-head">
          <div>
            <h1>Discover</h1>
            <p className="meta">Swipe to connect — ranked by needs fit, not popularity.</p>
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
        {!loading && items.length === 0 ? (
          <p className="meta">No more profiles right now. Check matches or tweak your needs.</p>
        ) : null}

        {!loading && items.length > 0 ? (
          <SwipeDeck
            hasCard={Boolean(top)}
            disabled={busy}
            onLike={onLike}
            onPass={onPass}
            topCard={topCard}
            nextCard={nextCard}
          />
        ) : null}

        <p className="meta" style={{ marginTop: "2rem" }}>
          Filter by intent anytime — {Object.values(INTENT_LABELS).join(", ")}.
        </p>
      </main>

      {matchName ? (
        <div className="match-modal" role="dialog" aria-label="It's a match">
          <div className="match-modal-card">
            <h2>It’s a match</h2>
            <p className="meta">You and {matchName} both liked each other.</p>
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.25rem" }}>
              <Link className="btn" href="/matches">
                Open matches
              </Link>
              <button className="btn secondary" type="button" onClick={() => setMatchName(null)}>
                Keep swiping
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
