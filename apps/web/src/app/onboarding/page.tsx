"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_NEEDS,
  DateEnvironments,
  INTENT_LABELS,
  MIN_PHOTOS,
  MIN_PROMPTS,
  NEUROTYPE_LABELS,
  NeurotypeTags,
  PreferredChannels,
  RelationshipIntents,
  type NeedsProfile,
  type NeurotypeTag,
} from "@attune/shared";
import { SiteNav } from "@/components/AppNav";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PromptBuilder, createInitialPrompts, type DraftPrompt } from "@/components/PromptBuilder";
import { api, getToken } from "@/lib/api";

type SliderKey = keyof Pick<
  NeedsProfile,
  | "processingTimeNeeded"
  | "noiseSensitivity"
  | "lightSensitivity"
  | "touchComfort"
  | "crowdTolerance"
  | "socialBatterySize"
  | "recoveryNeed"
  | "parallelPlayPreference"
  | "interactiveHangoutPreference"
  | "specialInterestDepth"
  | "routinePreference"
  | "spontaneityComfort"
  | "aloneTogetherComfort"
>;

const SLIDERS: { key: SliderKey; label: string }[] = [
  { key: "processingTimeNeeded", label: "Processing time needed" },
  { key: "noiseSensitivity", label: "Noise sensitivity" },
  { key: "lightSensitivity", label: "Light sensitivity" },
  { key: "touchComfort", label: "Touch / proximity comfort" },
  { key: "crowdTolerance", label: "Crowd tolerance" },
  { key: "socialBatterySize", label: "Social battery size" },
  { key: "recoveryNeed", label: "Recovery need after socializing" },
  { key: "parallelPlayPreference", label: "Parallel play preference" },
  { key: "interactiveHangoutPreference", label: "Interactive hangout preference" },
  { key: "specialInterestDepth", label: "Special interest depth" },
  { key: "routinePreference", label: "Routine preference" },
  { key: "spontaneityComfort", label: "Spontaneity comfort" },
  { key: "aloneTogetherComfort", label: "Alone-together comfort" },
];

const STEPS = ["Photos & basics", "Prompts", "Connection style", "Sensory needs"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function promptReady(p: DraftPrompt) {
  if (!p.promptText.trim()) return false;
  if (p.mediaType === "text") return p.answer.trim().length > 0;
  return Boolean(p.mediaUrl);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [tags, setTags] = useState<NeurotypeTag[]>(["audhd"]);
  const [interests, setInterests] = useState("coding, sci-fi, cats");
  const [needs, setNeeds] = useState<NeedsProfile>(DEFAULT_NEEDS);
  const [bio, setBio] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<DraftPrompt[]>(() => createInitialPrompts(2));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  const interestList = useMemo(
    () =>
      interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    [interests],
  );

  function validateStep(current: number) {
    if (current === 0 && photoUrls.length < MIN_PHOTOS) {
      return "Add at least one profile photo before continuing.";
    }
    if (current === 1) {
      const ready = prompts.filter(promptReady);
      if (ready.length < MIN_PROMPTS) {
        return "Finish at least one prompt (text, voice, or video).";
      }
      for (const p of prompts) {
        if (!promptReady(p) && (p.answer.trim() || p.mediaUrl || p.promptText.trim())) {
          // allow incomplete extra drafts only if empty-ish — require all listed to be ready
        }
      }
      if (prompts.some((p) => !promptReady(p))) {
        return "Complete each prompt you added, or remove unused ones.";
      }
    }
    if (current === 2) {
      if (needs.preferredChannels.length < 1 || needs.preferredEnvironments.length < 1) {
        return "Pick at least one channel and date environment.";
      }
    }
    return "";
  }

  async function finish(e: FormEvent) {
    e.preventDefault();
    const err = validateStep(3) || validateStep(1) || validateStep(0);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await api("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          bio,
          neurotypeTags: tags,
          specialInterests: interestList,
          onboardingComplete: true,
        }),
      });
      await api("/profiles/me/needs", {
        method: "POST",
        body: JSON.stringify(needs),
      });
      for (const [idx, p] of prompts.filter(promptReady).entries()) {
        await api("/profiles/me/prompts", {
          method: "POST",
          body: JSON.stringify({
            promptText: p.promptText,
            answer: p.answer,
            mediaType: p.mediaType,
            mediaUrl: p.mediaUrl,
            sortOrder: idx,
          }),
        });
      }
      router.push("/discover");
    } catch (saveErr) {
      setError(saveErr instanceof Error ? saveErr.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SiteNav authed />
      <main className="container">
        <form className="panel wide" onSubmit={finish}>
          <h1 style={{ marginTop: 0 }}>Build your Attune profile</h1>
          <p className="meta">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
          {error ? <p className="error">{error}</p> : null}

          {step === 0 && (
            <>
              <div className="field">
                <label>Photos</label>
                <PhotoGrid
                  photoUrls={photoUrls}
                  onChange={setPhotoUrls}
                  onError={(m) => setError(m)}
                />
              </div>
              <div className="field">
                <label>Neurotype tags (optional)</label>
                <div className="chip-row">
                  {NeurotypeTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`chip ${tags.includes(tag) ? "on" : ""}`}
                      onClick={() => setTags((t) => toggle(t, tag))}
                    >
                      {NEUROTYPE_LABELS[tag]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="bio">Short bio</label>
                <textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="How you like to connect…"
                />
              </div>
              <div className="field">
                <label htmlFor="interests">Special interests (comma-separated)</label>
                <input
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <PromptBuilder value={prompts} onChange={setPrompts} onError={(m) => setError(m)} />
          )}

          {step === 2 && (
            <>
              <div className="field">
                <label>Communication style</label>
                <select
                  value={needs.communicationStyle}
                  onChange={(e) =>
                    setNeeds((n) => ({
                      ...n,
                      communicationStyle: e.target.value as NeedsProfile["communicationStyle"],
                    }))
                  }
                >
                  <option value="direct_literal">Direct / literal</option>
                  <option value="mixed">Mixed</option>
                  <option value="nuanced">Nuanced / implied OK</option>
                </select>
              </div>
              <div className="field">
                <label>Preferred channels</label>
                <div className="chip-row">
                  {PreferredChannels.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`chip ${needs.preferredChannels.includes(c) ? "on" : ""}`}
                      onClick={() =>
                        setNeeds((n) => ({
                          ...n,
                          preferredChannels: toggle(n.preferredChannels, c),
                        }))
                      }
                    >
                      {c.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Reply pace</label>
                <select
                  value={needs.replyPace}
                  onChange={(e) =>
                    setNeeds((n) => ({
                      ...n,
                      replyPace: e.target.value as NeedsProfile["replyPace"],
                    }))
                  }
                >
                  <option value="slow">Slow — processing time is normal</option>
                  <option value="moderate">Moderate</option>
                  <option value="fast">Fast / rapid-fire OK</option>
                </select>
              </div>
              <div className="field">
                <label>Date environments</label>
                <div className="chip-row">
                  {DateEnvironments.map((env) => (
                    <button
                      key={env}
                      type="button"
                      className={`chip ${needs.preferredEnvironments.includes(env) ? "on" : ""}`}
                      onClick={() =>
                        setNeeds((n) => ({
                          ...n,
                          preferredEnvironments: toggle(n.preferredEnvironments, env),
                        }))
                      }
                    >
                      {env.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Looking for (friends, romance, or both)</label>
                <div className="chip-row">
                  {RelationshipIntents.map((intent) => (
                    <button
                      key={intent}
                      type="button"
                      className={`chip ${needs.intents.includes(intent) ? "on" : ""}`}
                      onClick={() =>
                        setNeeds((n) => ({
                          ...n,
                          intents: toggle(n.intents, intent),
                        }))
                      }
                    >
                      {INTENT_LABELS[intent]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {SLIDERS.map((s) => (
                <div className="slider-row" key={s.key}>
                  <label>
                    {s.label}: {needs[s.key]}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={needs[s.key]}
                    onChange={(e) =>
                      setNeeds((n) => ({ ...n, [s.key]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
            </>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            {step > 0 ? (
              <button className="btn secondary" type="button" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  const message = validateStep(step);
                  if (message) {
                    setError(message);
                    return;
                  }
                  setError("");
                  setStep((s) => s + 1);
                }}
              >
                Next
              </button>
            ) : (
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save & discover"}
              </button>
            )}
          </div>
        </form>
      </main>
    </>
  );
}
