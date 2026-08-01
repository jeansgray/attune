import { z } from "zod";
import { isAtLeastAge, maxBirthYearForMinAge, MIN_AGE, MIN_BIRTH_YEAR } from "./age";
import { Genders, NeurotypeTags, Pronouns, SocialBatteryLevels } from "./enums";
import { NeedsProfileSchema } from "./needs";
import { MAX_PHOTOS, MAX_PROMPTS, PromptMediaTypes } from "./profile-media";

const birthYearSchema = z
  .number()
  .int()
  .min(MIN_BIRTH_YEAR)
  .refine((year) => isAtLeastAge(year), {
    message: `You must be at least ${MIN_AGE} years old to use Attune`,
  });

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(40),
  birthYear: birthYearSchema,
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(600).optional(),
  birthYear: birthYearSchema.optional(),
  gender: z.enum(Genders).optional(),
  pronouns: z.enum(Pronouns).optional(),
  city: z.string().max(80).optional(),
  neurotypeTags: z.array(z.enum(NeurotypeTags)).max(6).optional(),
  specialInterests: z.array(z.string().max(60)).max(12).optional(),
  photoUrls: z.array(z.string().url()).max(MAX_PHOTOS).optional(),
  socialBattery: z.enum(SocialBatteryLevels).optional(),
  awayNote: z.string().max(160).optional().nullable(),
  onboardingComplete: z.boolean().optional(),
});

export const UpsertNeedsSchema = NeedsProfileSchema;

export const UpsertPromptSchema = z
  .object({
    promptText: z.string().min(1).max(160),
    answer: z.string().max(400).optional().default(""),
    mediaType: z.enum(PromptMediaTypes).default("text"),
    mediaUrl: z.string().url().optional().nullable(),
    sortOrder: z.number().int().min(0).max(MAX_PROMPTS).default(0),
  })
  .superRefine((val, ctx) => {
    if (val.mediaType === "text" && (!val.answer || val.answer.trim().length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Write an answer, or switch to voice/video",
        path: ["answer"],
      });
    }
    if ((val.mediaType === "voice" || val.mediaType === "video") && !val.mediaUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Add a ${val.mediaType} clip for this prompt`,
        path: ["mediaUrl"],
      });
    }
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
export type UpsertPromptInput = z.infer<typeof UpsertPromptSchema>;

/** UI helper — latest selectable birth year for 18+. */
export function latestAllowedBirthYear() {
  return maxBirthYearForMinAge();
}
