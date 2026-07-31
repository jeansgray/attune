"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/AppNav";
import { api, getToken } from "@/lib/api";

type MatchRow = {
  id: string;
  otherUser: {
    id: string;
    profile: { displayName: string; photoUrls: string[]; socialBattery: string } | null;
  };
  lastMessage: { body: string; createdAt: string } | null;
};

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<MatchRow[]>("/matches")
      .then(setMatches)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [router]);

  return (
    <>
      <SiteNav authed />
      <main className="container" style={{ paddingBottom: "3rem" }}>
        <h1 className="brand">Matches</h1>
        <p className="meta">Mutual likes — chat when your batteries allow.</p>
        {error ? <p className="error">{error}</p> : null}
        <div className="matches-list">
          {matches.map((m) => (
            <Link className="match-row" key={m.id} href={`/matches/${m.id}`}>
              <strong>{m.otherUser.profile?.displayName ?? "Match"}</strong>
              <div className="meta">
                battery {m.otherUser.profile?.socialBattery ?? "unknown"}
                {m.lastMessage ? ` · ${m.lastMessage.body}` : " · Say hello"}
              </div>
            </Link>
          ))}
          {matches.length === 0 ? (
            <p className="meta">No matches yet — like a few prompts in Discover.</p>
          ) : null}
        </div>
      </main>
    </>
  );
}
