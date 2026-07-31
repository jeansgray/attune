import { z } from "zod";
import {
  CommunicationStyles,
  DateEnvironments,
  PreferredChannels,
  RelationshipIntents,
  ReplyPaces,
} from "./enums";

/** All slider fields are 0–100. Higher = more of that trait/need. */
export const NeedsProfileSchema = z.object({
  communicationStyle: z.enum(CommunicationStyles),
  preferredChannels: z.array(z.enum(PreferredChannels)).min(1),
  replyPace: z.enum(ReplyPaces),
  processingTimeNeeded: z.number().min(0).max(100),

  noiseSensitivity: z.number().min(0).max(100),
  lightSensitivity: z.number().min(0).max(100),
  touchComfort: z.number().min(0).max(100),
  crowdTolerance: z.number().min(0).max(100),
  preferredEnvironments: z.array(z.enum(DateEnvironments)).min(1),

  socialBatterySize: z.number().min(0).max(100),
  recoveryNeed: z.number().min(0).max(100),
  parallelPlayPreference: z.number().min(0).max(100),
  interactiveHangoutPreference: z.number().min(0).max(100),

  specialInterestDepth: z.number().min(0).max(100),
  routinePreference: z.number().min(0).max(100),
  spontaneityComfort: z.number().min(0).max(100),
  aloneTogetherComfort: z.number().min(0).max(100),

  intents: z.array(z.enum(RelationshipIntents)).min(1),
  dealbreakers: z.array(z.string().max(120)).max(10).default([]),
});

export type NeedsProfile = z.infer<typeof NeedsProfileSchema>;

export const NEEDS_VECTOR_KEYS = [
  "processingTimeNeeded",
  "noiseSensitivity",
  "lightSensitivity",
  "touchComfort",
  "crowdTolerance",
  "socialBatterySize",
  "recoveryNeed",
  "parallelPlayPreference",
  "interactiveHangoutPreference",
  "specialInterestDepth",
  "routinePreference",
  "spontaneityComfort",
  "aloneTogetherComfort",
] as const;

export type NeedsVectorKey = (typeof NEEDS_VECTOR_KEYS)[number];

export const DEFAULT_NEEDS: NeedsProfile = {
  communicationStyle: "direct_literal",
  preferredChannels: ["text"],
  replyPace: "moderate",
  processingTimeNeeded: 60,
  noiseSensitivity: 70,
  lightSensitivity: 50,
  touchComfort: 40,
  crowdTolerance: 30,
  preferredEnvironments: ["quiet_cafe", "park_walk", "online_first"],
  socialBatterySize: 45,
  recoveryNeed: 65,
  parallelPlayPreference: 70,
  interactiveHangoutPreference: 40,
  specialInterestDepth: 80,
  routinePreference: 60,
  spontaneityComfort: 35,
  aloneTogetherComfort: 75,
  intents: ["friendship", "romance", "slow_burn"],
  dealbreakers: [],
};
