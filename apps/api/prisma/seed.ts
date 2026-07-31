import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import type { NeedsProfile } from "@attune/shared";

const prisma = new PrismaClient();

type SeedUser = {
  email: string;
  displayName: string;
  bio: string;
  birthYear: number;
  gender: string;
  pronouns: string;
  city: string;
  neurotypeTags: string[];
  specialInterests: string[];
  socialBattery: string;
  needs: NeedsProfile;
  prompts: { promptText: string; answer: string }[];
};

const seeds: SeedUser[] = [
  {
    email: "nova@attune.demo",
    displayName: "Nova",
    bio: "AuDHD systems thinker. Prefer deep talks and parallel gaming nights.",
    birthYear: 1994,
    gender: "nonbinary",
    pronouns: "they_them",
    city: "Portland",
    neurotypeTags: ["audhd"],
    specialInterests: ["trains", " astrophotography", "cozy games"].map((s) => s.trim()),
    socialBattery: "medium",
    needs: {
      communicationStyle: "direct_literal",
      preferredChannels: ["text", "voice"],
      replyPace: "moderate",
      processingTimeNeeded: 70,
      noiseSensitivity: 75,
      lightSensitivity: 55,
      touchComfort: 35,
      crowdTolerance: 25,
      preferredEnvironments: ["quiet_cafe", "home_parallel", "online_first"],
      socialBatterySize: 40,
      recoveryNeed: 70,
      parallelPlayPreference: 85,
      interactiveHangoutPreference: 35,
      specialInterestDepth: 90,
      routinePreference: 65,
      spontaneityComfort: 30,
      aloneTogetherComfort: 90,
      intents: ["romance", "slow_burn"],
      dealbreakers: ["loud bars"],
    },
    prompts: [
      {
        promptText: "My special interest rabbit hole lately is…",
        answer: "Mapping obscure rail lines and photographing the moon.",
      },
      {
        promptText: "I feel most connected when we…",
        answer: "Sit in the same room doing our own things, then share one deep thread.",
      },
    ],
  },
  {
    email: "jade@attune.demo",
    displayName: "Jade",
    bio: "Autistic librarian energy. Sensory-friendly dates only.",
    birthYear: 1991,
    gender: "woman",
    pronouns: "she_her",
    city: "Seattle",
    neurotypeTags: ["autism", "hsp"],
    specialInterests: ["botany", "mystery novels", "tea"],
    socialBattery: "low",
    needs: {
      communicationStyle: "direct_literal",
      preferredChannels: ["text"],
      replyPace: "slow",
      processingTimeNeeded: 80,
      noiseSensitivity: 90,
      lightSensitivity: 70,
      touchComfort: 25,
      crowdTolerance: 15,
      preferredEnvironments: ["museum", "park_walk", "quiet_cafe"],
      socialBatterySize: 30,
      recoveryNeed: 85,
      parallelPlayPreference: 70,
      interactiveHangoutPreference: 25,
      specialInterestDepth: 85,
      routinePreference: 80,
      spontaneityComfort: 20,
      aloneTogetherComfort: 80,
      intents: ["romance", "queerplatonic"],
      dealbreakers: [],
    },
    prompts: [
      {
        promptText: "A sensory dealbreaker for me is…",
        answer: "Unexpected strong perfume and fluorescent flicker.",
      },
      {
        promptText: "An ideal low-stimulation date is…",
        answer: "Greenhouse walk + tea, no small talk tax.",
      },
    ],
  },
  {
    email: "rio@attune.demo",
    displayName: "Rio",
    bio: "ADHD maker. Hyperfocus buddy wanted. Texts can be novels.",
    birthYear: 1996,
    gender: "man",
    pronouns: "he_him",
    city: "Austin",
    neurotypeTags: ["adhd"],
    specialInterests: ["3D printing", "synth music", "climbing"],
    socialBattery: "high",
    needs: {
      communicationStyle: "mixed",
      preferredChannels: ["text", "voice", "in_person"],
      replyPace: "fast",
      processingTimeNeeded: 35,
      noiseSensitivity: 40,
      lightSensitivity: 30,
      touchComfort: 60,
      crowdTolerance: 55,
      preferredEnvironments: ["outdoor_nature", "special_interest_meetup", "park_walk"],
      socialBatterySize: 70,
      recoveryNeed: 45,
      parallelPlayPreference: 50,
      interactiveHangoutPreference: 75,
      specialInterestDepth: 75,
      routinePreference: 35,
      spontaneityComfort: 70,
      aloneTogetherComfort: 55,
      intents: ["romance", "friendship", "exploring"],
      dealbreakers: [],
    },
    prompts: [
      {
        promptText: "Direct communication looks like this for me…",
        answer: "Say the need. I'll match your clarity and won't punish honesty.",
      },
    ],
  },
  {
    email: "sam@attune.demo",
    displayName: "Sam",
    bio: "PDA-ish. Autonomy-respecting partnership is non-negotiable.",
    birthYear: 1990,
    gender: "genderqueer",
    pronouns: "they_them",
    city: "Chicago",
    neurotypeTags: ["pda", "autism"],
    specialInterests: ["urban foraging", "pottery", "documentary film"],
    socialBattery: "recharging",
    needs: {
      communicationStyle: "direct_literal",
      preferredChannels: ["text", "in_person"],
      replyPace: "slow",
      processingTimeNeeded: 75,
      noiseSensitivity: 65,
      lightSensitivity: 50,
      touchComfort: 45,
      crowdTolerance: 35,
      preferredEnvironments: ["park_walk", "home_parallel", "outdoor_nature"],
      socialBatterySize: 45,
      recoveryNeed: 70,
      parallelPlayPreference: 80,
      interactiveHangoutPreference: 40,
      specialInterestDepth: 70,
      routinePreference: 40,
      spontaneityComfort: 50,
      aloneTogetherComfort: 85,
      intents: ["queerplatonic", "slow_burn"],
      dealbreakers: ["pressure"],
    },
    prompts: [
      {
        promptText: "I need a partner who understands that…",
        answer: "Demand melts my capacity. Collaborative invites work better than 'shoulds'.",
      },
    ],
  },
  {
    email: "lee@attune.demo",
    displayName: "Lee",
    bio: "Dyslexic designer. Voice notes welcome. Slow-burn romance.",
    birthYear: 1993,
    gender: "woman",
    pronouns: "she_they",
    city: "Minneapolis",
    neurotypeTags: ["dyslexia", "adhd"],
    specialInterests: ["typography", "cats", "board games"],
    socialBattery: "medium",
    needs: {
      communicationStyle: "mixed",
      preferredChannels: ["voice", "text"],
      replyPace: "moderate",
      processingTimeNeeded: 55,
      noiseSensitivity: 50,
      lightSensitivity: 45,
      touchComfort: 55,
      crowdTolerance: 40,
      preferredEnvironments: ["quiet_cafe", "home_parallel", "low_key_dinner"],
      socialBatterySize: 55,
      recoveryNeed: 55,
      parallelPlayPreference: 60,
      interactiveHangoutPreference: 55,
      specialInterestDepth: 65,
      routinePreference: 50,
      spontaneityComfort: 45,
      aloneTogetherComfort: 70,
      intents: ["romance", "slow_burn"],
      dealbreakers: [],
    },
    prompts: [
      {
        promptText: "My social battery recharges by…",
        answer: "Silent co-working, then one intentional conversation.",
      },
    ],
  },
];

// Expand to ~20 profiles with variations
function expandSeeds(): SeedUser[] {
  const extras: SeedUser[] = [];
  const cities = ["Denver", "Boston", "Oakland", "Atlanta", "Phoenix", "Detroit", "Tucson", "Madison"];
  const interests = [
    ["birds", "knitting"],
    ["linux", "ham radio"],
    ["fermentation", "jazz"],
    ["insects", "running"],
    ["anime", "language learning"],
    ["geology", "hiking"],
    ["chess", "cooking"],
    ["embroidery", "podcasts"],
  ];
  for (let i = 0; i < 15; i++) {
    const base = seeds[i % seeds.length]!;
    extras.push({
      ...base,
      email: `demo${i + 1}@attune.demo`,
      displayName: `${base.displayName}${i + 1}`,
      city: cities[i % cities.length]!,
      specialInterests: interests[i % interests.length]!,
      birthYear: 1988 + (i % 12),
      needs: {
        ...base.needs,
        noiseSensitivity: Math.min(100, Math.max(0, base.needs.noiseSensitivity + ((i % 5) - 2) * 8)),
        socialBatterySize: Math.min(100, Math.max(0, base.needs.socialBatterySize + ((i % 7) - 3) * 6)),
        parallelPlayPreference: Math.min(
          100,
          Math.max(0, base.needs.parallelPlayPreference + ((i % 4) - 1) * 10),
        ),
      },
    });
  }
  return [...seeds, ...extras];
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const all = expandSeeds();

  for (const s of all) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash,
        profile: {
          create: {
            displayName: s.displayName,
            bio: s.bio,
            birthYear: s.birthYear,
            gender: s.gender,
            pronouns: s.pronouns,
            city: s.city,
            neurotypeTags: s.neurotypeTags,
            specialInterests: s.specialInterests,
            photoUrls: [
              `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(s.displayName)}`,
            ],
            socialBattery: s.socialBattery,
            onboardingComplete: true,
          },
        },
        needs: { create: s.needs },
        prompts: {
          create: s.prompts.map((p, idx) => ({
            promptText: p.promptText,
            answer: p.answer,
            sortOrder: idx,
          })),
        },
      },
    });
  }

  // Demo account for you
  await prisma.user.upsert({
    where: { email: "you@attune.demo" },
    update: {},
    create: {
      email: "you@attune.demo",
      passwordHash,
      profile: {
        create: {
          displayName: "You",
          bio: "Your demo account — finish or tweak needs anytime.",
          birthYear: 1995,
          gender: "nonbinary",
          pronouns: "they_them",
          city: "Portland",
          neurotypeTags: ["audhd"],
          specialInterests: ["coding", "sci-fi", "cats"],
          photoUrls: ["https://api.dicebear.com/9.x/shapes/svg?seed=You"],
          socialBattery: "medium",
          onboardingComplete: true,
        },
      },
      needs: {
        create: {
          communicationStyle: "direct_literal",
          preferredChannels: ["text", "voice"],
          replyPace: "moderate",
          processingTimeNeeded: 65,
          noiseSensitivity: 70,
          lightSensitivity: 50,
          touchComfort: 40,
          crowdTolerance: 30,
          preferredEnvironments: ["quiet_cafe", "park_walk", "home_parallel"],
          socialBatterySize: 50,
          recoveryNeed: 60,
          parallelPlayPreference: 75,
          interactiveHangoutPreference: 40,
          specialInterestDepth: 80,
          routinePreference: 55,
          spontaneityComfort: 40,
          aloneTogetherComfort: 80,
          intents: ["romance", "slow_burn", "friendship"],
          dealbreakers: [],
        },
      },
      prompts: {
        create: [
          {
            promptText: "I'm looking for someone who…",
            answer: "Says what they mean and respects recovery days.",
            sortOrder: 0,
          },
        ],
      },
    },
  });

  console.log(`Seeded ${all.length + 1} users. Demo login: you@attune.demo / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
