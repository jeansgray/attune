export const MAX_PHOTOS = 7;
export const MAX_PROMPTS = 5;
export const MIN_PHOTOS = 1;
export const MIN_PROMPTS = 1;

export const PromptMediaTypes = ["text", "voice", "video"] as const;
export type PromptMediaType = (typeof PromptMediaTypes)[number];

/** Curated prompt starters — user can pick or write their own. */
export const PROMPT_SUGGESTIONS = [
  "I'm looking for someone who…",
  "My special interest rabbit hole lately is…",
  "I feel most connected when we…",
  "A sensory dealbreaker for me is…",
  "An ideal low-stimulation date is…",
  "Direct communication looks like this for me…",
  "My social battery recharges by…",
  "Green flags I notice early…",
  "A voice note about what a good day looks like…",
  "Something I want you to know before we match…",
] as const;
