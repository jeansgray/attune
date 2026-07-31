"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteNav } from "@/components/AppNav";
import { SafetyActions } from "@/components/SafetyActions";
import { api, getToken } from "@/lib/api";

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type MatchMeta = {
  id: string;
  userAId: string;
  userBId: string;
};

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<string>("");
  const [otherUserId, setOtherUserId] = useState<string>("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const meRes = await api<{ id: string }>("/auth/me");
    setMe(meRes.id);
    const res = await api<{ match: MatchMeta; messages: Message[] }>(
      `/matches/${params.id}/messages`,
    );
    setMessages(res.messages);
    const other =
      res.match.userAId === meRes.id ? res.match.userBId : res.match.userAId;
    setOtherUserId(other);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [params.id, router]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      const msg = await api<Message>(`/matches/${params.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((m) => [...m, msg]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    }
  }

  return (
    <>
      <SiteNav authed />
      <main className="container" style={{ paddingBottom: "3rem" }}>
        <div className="page-head">
          <h1>Chat</h1>
          {otherUserId ? (
            <SafetyActions
              userId={otherUserId}
              onBlocked={() => router.push("/matches")}
            />
          ) : null}
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="chat-list" style={{ marginBottom: "1rem" }}>
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.senderId === me ? "mine" : "theirs"}`}>
              {m.body}
            </div>
          ))}
          {messages.length === 0 ? (
            <p className="meta">
              No messages yet. Icebreaker: what&apos;s your current special interest?
            </p>
          ) : null}
        </div>
        <form onSubmit={send} style={{ display: "flex", gap: "0.6rem" }}>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Say what you mean…"
          />
          <button className="btn" type="submit">
            Send
          </button>
        </form>
      </main>
    </>
  );
}
