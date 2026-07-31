import { z } from "zod";
import { Genders, NeurotypeTags, Pronouns, SocialBatteryLevels } from "./enums";
import { NeedsProfileSchema } from "./needs";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(40),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(600).optional(),
  birthYear: z.number().int().min(1940).max(2010).optional(),
  gender: z.enum(Genders).optional(),
  pronouns: z.enum(Pronouns).optional(),
  city: z.string().max(80).optional(),
  neurotypeTags: z.array(z.enum(NeurotypeTags)).max(6).optional(),
  specialInterests: z.array(z.string().max(60)).max(12).optional(),
  photoUrls: z.array(z.string().url()).max(6).optional(),
  socialBattery: z.enum(SocialBatteryLevels).optional(),
  awayNote: z.string().max(160).optional().nullable(),
  onboardingComplete: z.boolean().optional(),
});

export const UpsertNeedsSchema = NeedsProfileSchema;

export const UpsertPromptSchema = z.object({
  promptText: z.string().min(1).max(160),
  answer: z.string().min(1).max(400),
  sortOrder: z.number().int().min(0).max(10).default(0),
});

export const LikeSchema = z.object({
  toUserId: z.string().cuid(),
  promptId: z.string().cuid().optional(),
  comment: z.string().max(280).optional(),
});

export const SendMessageSchema = z.object({
  matchId: z.string().cuid(),
  body: z.string().min(1).max(2000),
});

export const ReportSchema = z.object({
  reportedUserId: z.string().cuid(),
  reason: z.string().min(3).max(400),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
