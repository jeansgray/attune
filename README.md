# Attune

Friends and dating for neurodivergent adults — matched on **social wants, sensory needs, and communication**, not neurotypical scripts.

Monorepo:

- `apps/api` — NestJS + Prisma + Postgres
- `apps/web` — Next.js marketing + full web app
- `apps/mobile` — Expo (iOS / Android / App Store path via EAS)
- `packages/shared` — enums, Zod schemas, needs model
- `packages/matching` — compatibility scoring engine

## Quick start

```bash
# requires Node 20+, pnpm 9, Docker
pnpm install
pnpm db:up
pnpm --filter @attune/shared build
pnpm --filter @attune/matching build
pnpm --filter @attune/api exec prisma migrate dev --name init
pnpm db:seed

# terminals
pnpm dev:api
pnpm dev:web
pnpm dev:mobile   # Expo
```

Demo login: `you@attune.demo` / `password123`

- Web: http://localhost:3000  
- API: http://localhost:4000/api  

## App Store

Mobile uses Expo + `eas.json`. After Apple Developer / Play Console accounts:

```bash
cd apps/mobile
npx eas login
npx eas init
npx eas build --platform all --profile production
npx eas submit --platform ios
npx eas submit --platform android
```

## Matching model

Optional neurotype tags (identity). Score from:

- Communication style / channels / reply pace
- Sensory sliders (noise, light, touch, crowds, environments)
- Social energy + parallel play
- Connection style + relationship intent
- Shared special interests

## Monetization (Attune Plus)

Freemium: **5 likes/day** on free. Plus unlocks unlimited likes, see who liked you, advanced filters, discover priority.

| Channel | Billing |
|---------|---------|
| Web | Stripe Checkout + Customer Portal |
| iOS / Android | RevenueCat → App Store / Play IAP |

Local Plus without Stripe: `POST /api/billing/dev-grant` (enabled when not production).

Launch docs:
- [docs/PRODUCTION.md](docs/PRODUCTION.md) — Vercel + Railway production deploy
- [docs/STORE_LAUNCH.md](docs/STORE_LAUNCH.md) — App Store / Play checklist
- [docs/INSTAGRAM_MARKETING.md](docs/INSTAGRAM_MARKETING.md) — content calendar + captions + ads

## Safety

Report + block endpoints under `/api/safety`. Community norms: direct communication, consent, no masking pressure.

Legal pages: `/privacy`, `/terms`.
