export const NeurotypeTags = [
  "autism",
  "adhd",
  "audhd",
  "dyslexia",
  "dyspraxia",
  "hsp",
  "pda",
  "tourettes",
  "other",
  "prefer_not_to_say",
  "nd_affirming_ally",
] as const;
export type NeurotypeTag = (typeof NeurotypeTags)[number];

export const CommunicationStyles = ["direct_literal", "mixed", "nuanced"] as const;
export type CommunicationStyle = (typeof CommunicationStyles)[number];

export const PreferredChannels = ["text", "voice", "video", "in_person"] as const;
export type PreferredChannel = (typeof PreferredChannels)[number];

export const ReplyPaces = ["slow", "moderate", "fast"] as const;
export type ReplyPace = (typeof ReplyPaces)[number];

export const DateEnvironments = [
  "quiet_cafe",
  "park_walk",
  "museum",
  "home_parallel",
  "special_interest_meetup",
  "low_key_dinner",
  "outdoor_nature",
  "online_first",
] as const;
export type DateEnvironment = (typeof DateEnvironments)[number];

export const RelationshipIntents = [
  "romance",
  "friendship",
  "queerplatonic",
  "slow_burn",
  "exploring",
] as const;
export type RelationshipIntent = (typeof RelationshipIntents)[number];

export const SocialBatteryLevels = ["low", "medium", "high", "recharging"] as const;
export type SocialBatteryLevel = (typeof SocialBatteryLevels)[number];

export const Genders = [
  "woman",
  "man",
  "nonbinary",
  "genderqueer",
  "agender",
  "other",
  "prefer_not_to_say",
] as const;
export type Gender = (typeof Genders)[number];

export const Pronouns = [
  "she_her",
  "he_him",
  "they_them",
  "she_they",
  "he_they",
  "any",
  "ask_me",
] as const;
export type Pronoun = (typeof Pronouns)[number];

export const NEUROTYPE_LABELS: Record<NeurotypeTag, string> = {
  autism: "Autistic",
  adhd: "ADHD",
  audhd: "AuDHD",
  dyslexia: "Dyslexia",
  dyspraxia: "Dyspraxia",
  hsp: "Highly Sensitive (HSP)",
  pda: "PDA profile",
  tourettes: "Tourette's",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
  nd_affirming_ally: "ND-affirming ally",
};

export const INTENT_LABELS: Record<RelationshipIntent, string> = {
  romance: "Romance",
  friendship: "Friendship",
  queerplatonic: "Queerplatonic",
  slow_burn: "Slow burn",
  exploring: "Exploring",
};

export const PROMPT_BANK = [
  "My special interest rabbit hole lately is…",
  "A sensory dealbreaker for me is…",
  "I feel most connected when we…",
  "My social battery recharges by…",
  "Direct communication looks like this for me…",
  "An ideal low-stimulation date is…",
  "Parallel play means… to me",
  "I need a partner who understands that…",
  "Masking drain shows up for me as…",
  "I'm looking for someone who…",
] as const;
