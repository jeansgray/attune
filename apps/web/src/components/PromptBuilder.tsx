"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_PROMPTS,
  MIN_PROMPTS,
  PROMPT_SUGGESTIONS,
  type PromptMediaType,
} from "@attune/shared";
import { uploadMedia } from "@/lib/api";

export type DraftPrompt = {
  promptText: string;
  answer: string;
  mediaType: PromptMediaType;
  mediaUrl: string | null;
};

type Props = {
  value: DraftPrompt[];
  onChange: (next: DraftPrompt[]) => void;
  onError?: (message: string) => void;
};

function emptyPrompt(): DraftPrompt {
  return {
    promptText: PROMPT_SUGGESTIONS[0],
    answer: "",
    mediaType: "text",
    mediaUrl: null,
  };
}

export function PromptBuilder({ value, onChange, onError }: Props) {
  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      mediaRecorder.current?.stop();
    };
  }, []);

  function update(idx: number, patch: Partial<DraftPrompt>) {
    onChange(value.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function addPrompt() {
    if (value.length >= MAX_PROMPTS) return;
    onChange([...value, emptyPrompt()]);
  }

  function removePrompt(idx: number) {
    if (value.length <= MIN_PROMPTS) return;
    onChange(value.filter((_, i) => i !== idx));
  }

  async function uploadKind(idx: number, kind: "voice" | "video", file: File) {
    setUploadingIdx(idx);
    onError?.("");
    try {
      const res = await uploadMedia(file, kind);
      update(idx, { mediaType: kind, mediaUrl: res.url, answer: value[idx]?.answer ?? "" });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingIdx(null);
    }
  }

  async function onMediaFile(idx: number, kind: "voice" | "video", fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    await uploadKind(idx, kind, file);
  }

  async function startRecording(idx: number) {
    onError?.("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });
        void uploadKind(idx, "voice", file);
        setRecordingIdx(null);
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setRecordingIdx(idx);
    } catch {
      onError?.("Microphone access is needed to record a voice prompt.");
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop();
    mediaRecorder.current = null;
  }

  return (
    <div className="prompt-builder">
      <p className="meta" style={{ marginBottom: "1rem" }}>
        Add {MIN_PROMPTS}–{MAX_PROMPTS} prompts. Answer with text, a voice note, or a short video —
        whatever feels most like you.
      </p>
      {value.map((prompt, idx) => (
        <div className="prompt-editor" key={idx}>
          <div className="prompt-editor-head">
            <strong>Prompt {idx + 1}</strong>
            {value.length > MIN_PROMPTS ? (
              <button type="button" className="btn secondary" onClick={() => removePrompt(idx)}>
                Remove
              </button>
            ) : null}
          </div>

          <div className="field">
            <label>Prompt</label>
            <select
              value={
                (PROMPT_SUGGESTIONS as readonly string[]).includes(prompt.promptText)
                  ? prompt.promptText
                  : "__custom__"
              }
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  update(idx, { promptText: "" });
                } else {
                  update(idx, { promptText: e.target.value });
                }
              }}
            >
              {PROMPT_SUGGESTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="__custom__">Write my own…</option>
            </select>
            {!(PROMPT_SUGGESTIONS as readonly string[]).includes(prompt.promptText) ? (
              <input
                style={{ marginTop: "0.5rem" }}
                value={prompt.promptText}
                maxLength={160}
                placeholder="Your custom prompt…"
                onChange={(e) => update(idx, { promptText: e.target.value })}
              />
            ) : null}
          </div>

          <div className="field">
            <label>Answer style</label>
            <div className="chip-row">
              {(["text", "voice", "video"] as PromptMediaType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${prompt.mediaType === t ? "on" : ""}`}
                  onClick={() =>
                    update(idx, {
                      mediaType: t,
                      mediaUrl: t === "text" ? null : prompt.mediaUrl,
                    })
                  }
                >
                  {t === "text" ? "Text" : t === "voice" ? "Voice" : "Video"}
                </button>
              ))}
            </div>
          </div>

          {prompt.mediaType === "text" ? (
            <div className="field">
              <label>Your answer</label>
              <textarea
                rows={3}
                maxLength={400}
                value={prompt.answer}
                onChange={(e) => update(idx, { answer: e.target.value })}
                placeholder="Say what you mean…"
              />
            </div>
          ) : null}

          {prompt.mediaType === "voice" ? (
            <div className="field">
              <label>Voice note</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                {recordingIdx === idx ? (
                  <button type="button" className="btn" onClick={stopRecording}>
                    Stop recording
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={uploadingIdx === idx}
                    onClick={() => void startRecording(idx)}
                  >
                    Record voice
                  </button>
                )}
                <label className="btn secondary" style={{ cursor: "pointer" }}>
                  Upload audio
                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={(e) => void onMediaFile(idx, "voice", e.target.files)}
                  />
                </label>
              </div>
              {uploadingIdx === idx ? <p className="meta">Uploading…</p> : null}
              {prompt.mediaUrl ? (
                <audio controls src={prompt.mediaUrl} style={{ width: "100%", marginTop: "0.75rem" }} />
              ) : null}
              <textarea
                style={{ marginTop: "0.75rem" }}
                rows={2}
                maxLength={400}
                value={prompt.answer}
                onChange={(e) => update(idx, { answer: e.target.value })}
                placeholder="Optional caption…"
              />
            </div>
          ) : null}

          {prompt.mediaType === "video" ? (
            <div className="field">
              <label>Short video</label>
              <label className="btn secondary" style={{ cursor: "pointer", display: "inline-flex" }}>
                {uploadingIdx === idx ? "Uploading…" : "Upload video"}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  hidden
                  disabled={uploadingIdx === idx}
                  onChange={(e) => void onMediaFile(idx, "video", e.target.files)}
                />
              </label>
              <p className="meta" style={{ marginTop: "0.4rem" }}>
                Keep it short (about 15–30s). MP4/WebM up to 40MB.
              </p>
              {prompt.mediaUrl ? (
                <video
                  controls
                  src={prompt.mediaUrl}
                  style={{
                    width: "100%",
                    maxHeight: 280,
                    marginTop: "0.75rem",
                    borderRadius: 12,
                    background: "#000",
                  }}
                />
              ) : null}
              <textarea
                style={{ marginTop: "0.75rem" }}
                rows={2}
                maxLength={400}
                value={prompt.answer}
                onChange={(e) => update(idx, { answer: e.target.value })}
                placeholder="Optional caption…"
              />
            </div>
          ) : null}
        </div>
      ))}

      {value.length < MAX_PROMPTS ? (
        <button type="button" className="btn secondary" onClick={addPrompt}>
          + Add another prompt
        </button>
      ) : null}
    </div>
  );
}

export function createInitialPrompts(count = 2): DraftPrompt[] {
  return Array.from({ length: count }, (_, i) => ({
    promptText: PROMPT_SUGGESTIONS[i % PROMPT_SUGGESTIONS.length]!,
    answer: "",
    mediaType: "text" as const,
    mediaUrl: null,
  }));
}
