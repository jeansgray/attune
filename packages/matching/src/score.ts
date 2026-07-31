import {
  NEEDS_VECTOR_KEYS,
  type NeedsProfile,
  type RelationshipIntent,
} from "@attune/shared";

export type MatchCandidate = {
  userId: string;
  needs: NeedsProfile;
  specialInterests: string[];
};

export type MatchScoreBreakdown = {
  total: number;
  vectorSimilarity: number;
  communicationBonus: number;
  channelBonus: number;
  intentBonus: number;
  interestBonus: number;
  environmentBonus: number;
  dealbreakerBlocked: boolean;
};

const WEIGHTS = {
  vector: 0.55,
  communication: 0.1,
  channel: 0.08,
  intent: 0.12,
  interest: 0.1,
  environment: 0.05,
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function jaccard(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Compatibility on 0–100 sliders: closer values score higher. */
function vectorSimilarity(a: NeedsProfile, b: NeedsProfile) {
  let sum = 0;
  for (const key of NEEDS_VECTOR_KEYS) {
    const diff = Math.abs(a[key] - b[key]) / 100;
    sum += 1 - diff;
  }
  return sum / NEEDS_VECTOR_KEYS.length;
}

function communicationBonus(a: NeedsProfile, b: NeedsProfile) {
  if (a.communicationStyle === b.communicationStyle) return 1;
  if (
    (a.communicationStyle === "direct_literal" && b.communicationStyle === "mixed") ||
    (b.communicationStyle === "direct_literal" && a.communicationStyle === "mixed")
  ) {
    return 0.7;
  }
  return 0.35;
}

function channelBonus(a: NeedsProfile, b: NeedsProfile) {
  return jaccard(a.preferredChannels, b.preferredChannels);
}

function intentBonus(a: NeedsProfile, b: NeedsProfile) {
  return jaccard(a.intents, b.intents);
}

function environmentBonus(a: NeedsProfile, b: NeedsProfile) {
  return jaccard(a.preferredEnvironments, b.preferredEnvironments);
}

function interestBonus(a: string[], b: string[]) {
  return jaccard(a, b);
}

function hasDealbreakerConflict(a: NeedsProfile, b: NeedsProfile) {
  const aBreakers = a.dealbreakers.map((d) => d.toLowerCase());
  const bBreakers = b.dealbreakers.map((d) => d.toLowerCase());
  const aBlob = `${a.intents.join(" ")} ${a.communicationStyle}`.toLowerCase();
  const bBlob = `${b.intents.join(" ")} ${b.communicationStyle}`.toLowerCase();

  for (const d of aBreakers) {
    if (d && bBlob.includes(d)) return true;
  }
  for (const d of bBreakers) {
    if (d && aBlob.includes(d)) return true;
  }
  return false;
}

export function scorePair(
  viewer: MatchCandidate,
  candidate: MatchCandidate,
): MatchScoreBreakdown {
  if (hasDealbreakerConflict(viewer.needs, candidate.needs)) {
    return {
      total: 0,
      vectorSimilarity: 0,
      communicationBonus: 0,
      channelBonus: 0,
      intentBonus: 0,
      interestBonus: 0,
      environmentBonus: 0,
      dealbreakerBlocked: true,
    };
  }

  const vector = vectorSimilarity(viewer.needs, candidate.needs);
  const communication = communicationBonus(viewer.needs, candidate.needs);
  const channel = channelBonus(viewer.needs, candidate.needs);
  const intent = intentBonus(viewer.needs, candidate.needs);
  const interest = interestBonus(viewer.specialInterests, candidate.specialInterests);
  const environment = environmentBonus(viewer.needs, candidate.needs);

  const total = clamp01(
    vector * WEIGHTS.vector +
      communication * WEIGHTS.communication +
      channel * WEIGHTS.channel +
      intent * WEIGHTS.intent +
      interest * WEIGHTS.interest +
      environment * WEIGHTS.environment,
  );

  return {
    total: Math.round(total * 100),
    vectorSimilarity: Math.round(vector * 100),
    communicationBonus: Math.round(communication * 100),
    channelBonus: Math.round(channel * 100),
    intentBonus: Math.round(intent * 100),
    interestBonus: Math.round(interest * 100),
    environmentBonus: Math.round(environment * 100),
    dealbreakerBlocked: false,
  };
}

export function rankCandidates(
  viewer: MatchCandidate,
  candidates: MatchCandidate[],
  opts?: { minScore?: number; intentFilter?: RelationshipIntent[] },
) {
  const minScore = opts?.minScore ?? 35;
  const intentFilter = opts?.intentFilter;

  return candidates
    .map((candidate) => ({
      userId: candidate.userId,
      score: scorePair(viewer, candidate),
      needs: candidate.needs,
      specialInterests: candidate.specialInterests,
    }))
    .filter((row) => {
      if (row.score.dealbreakerBlocked) return false;
      if (row.score.total < minScore) return false;
      if (intentFilter?.length) {
        const overlap = row.needs.intents.some((i) => intentFilter.includes(i));
        if (!overlap) return false;
      }
      return true;
    })
    .sort((a, b) => b.score.total - a.score.total);
}
