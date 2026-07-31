"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/AppNav";
import { api, getToken } from "@/lib/api";

type IncomingResponse = {
  locked: boolean;
  count: number;
  message?: string;
  likes: Array<{
    id: string;
    comment: string | null;
    fromUser: { profile: { displayName: string; photoUrls: string[] } | null };
  }>;
};

export default function LikesPage() {
  const router = useRouter();
  const [data, setData] = useState<IncomingResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<IncomingResponse>("/likes/incoming")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [router]);

  return (
    <>
      <SiteNav authed />
      <main className="container" style={{ paddingBottom: "3rem" }}>
        <div className="page-head">
          <div>
            <h1>Likes you</h1>
            <p className="meta">People who already want to connect.</p>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}

        {data?.locked ? (
          <div className="panel">
            <p>
              You have <strong>{data.count}</strong> like{data.count === 1 ? "" : "s"} waiting.
            </p>
            <p className="meta">{data.message}</p>
            <Link className="btn" href="/plus">
              Unlock with Attune Plus
            </Link>
          </div>
        ) : (
          <div className="matches-list">
            {data?.likes.map((like) => (
              <div className="match-row" key={like.id}>
                <strong>{like.fromUser.profile?.displayName ?? "Someone"}</strong>
                <div className="meta">{like.comment ?? "Liked your profile"}</div>
              </div>
            ))}
            {data && data.likes.length === 0 ? (
              <p className="meta">No likes yet — keep discovering.</p>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}
