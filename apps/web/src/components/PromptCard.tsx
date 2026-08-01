"use client";

type Prompt = {
  id?: string;
  promptText: string;
  answer: string;
  mediaType?: string;
  mediaUrl?: string | null;
};

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const mediaType = prompt.mediaType ?? "text";
  return (
    <div className="prompt-block">
      <div className="q">{prompt.promptText}</div>
      {mediaType === "voice" && prompt.mediaUrl ? (
        <audio controls src={prompt.mediaUrl} style={{ width: "100%", marginTop: "0.55rem" }} />
      ) : null}
      {mediaType === "video" && prompt.mediaUrl ? (
        <video
          controls
          src={prompt.mediaUrl}
          style={{
            width: "100%",
            maxHeight: 260,
            marginTop: "0.55rem",
            borderRadius: 12,
            background: "#000",
          }}
        />
      ) : null}
      {prompt.answer ? <div style={{ marginTop: "0.45rem" }}>{prompt.answer}</div> : null}
      {mediaType !== "text" ? (
        <p className="meta" style={{ marginTop: "0.35rem", textTransform: "capitalize" }}>
          {mediaType} prompt
        </p>
      ) : null}
    </div>
  );
}
