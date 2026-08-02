# Security policy — Attune

Attune handles dating/friendship profiles, photos, voice/video, messages, and payments. Treat it as a **high-sensitivity consumer app**.

## Reporting a vulnerability

Email **privacy@attune.app** (replace with your real security inbox) with:

- Description and impact
- Steps to reproduce / PoC (no destructive testing on production without permission)
- Whether you need coordinated disclosure timing

We aim to acknowledge within **72 hours**.

Do **not** open public GitHub issues for active exploit details.

---

## Threat model (short)

| Asset | Risk if exposed |
|-------|-----------------|
| Account credentials / JWT | Account takeover, stalking |
| Photos / voice / video | Non-consensual sharing, doxxing |
| Chat messages | Privacy harm |
| Location / city + routines | Safety risk |
| Stripe customer IDs | Billing abuse |
| Reports / blocks | Retaliation if leaked |

Primary threats: credential stuffing, IDOR on profiles/messages, webhook forgery (Stripe/RevenueCat), XSS via profile text, abusive content, insecure media URLs, dependency supply-chain.

---

## Controls already in the product

- Password hashing (bcrypt)
- JWT auth on API routes
- Stripe webhook signature verification
- Zod validation on API inputs
- Block / report endpoints + Discover filtering
- 18+ birth-year gate
- Freemium like limits
- CORS allowlist via `CORS_ORIGIN`
- Media uploads type/size limited; stored on Vercel Blob

Gaps to close before heavy ads / App Store: rate limiting, account deletion self-serve, RevenueCat webhook auth, content moderation pipeline, CSP headers, secrets rotation runbook.

---

## Recommended SAST (static analysis)

Run these on every PR / push to `main`:

| Tool | Why for Attune | How |
|------|----------------|-----|
| **Semgrep** (OSS or Pro) | Best ROI for NestJS/Next.js — finds IDOR patterns, insecure JWT use, SSRF, secrets | GitHub Action `semgrep/semgrep-action` + `p/typescript` + `p/nestjs` packs |
| **CodeQL** (GitHub Advanced Security or free public) | Deep dataflow for JS/TS; complements Semgrep | Enable CodeQL workflow for `javascript-typescript` |
| **ESLint security plugins** | Fast local feedback | `eslint-plugin-security` + `@typescript-eslint` in `apps/web` / `apps/api` |
| **Prisma / SQL review** | We use Prisma (lower injection risk); still review raw queries | Keep zero `$queryRaw` without parameterization |
| **Secret scanning** | Catch keys in commits | GitHub Secret Scanning + push protection; `gitleaks` in CI |
| **`pnpm audit` / OSV-Scanner** | Dependency CVEs | CI job failing on high/critical |

**Senior recommendation:** start with **Semgrep + Gitleaks + pnpm audit** this week; add **CodeQL** when the repo is public or GHAS is enabled.

### Suggested CI jobs (priority order)

1. `gitleaks detect --source . --verbose`
2. `pnpm audit --audit-level=high`
3. `semgrep scan --config p/typescript --config p/nestjs --config p/nextjs --error`
4. `pnpm -r lint` / `tsc --noEmit`
5. CodeQL weekly or on `main`

---

## Recommended DAST (dynamic analysis)

Point these at **staging**, never production with real user media:

| Tool | Use |
|------|-----|
| **OWASP ZAP** baseline / full scan | Auth crawl of web + API; cheap and standard |
| **Burp Suite** (manual) | Authz testing: swap JWT `sub`, try other users’ `/profiles/:id`, `/matches/:id/messages` |
| **Nuclei** | Quick template checks for exposed `.env`, debug endpoints, misconfig |
| **Stripe test webhooks** | Replay / bad signature must 4xx |
| **Mobile** (later) | MobSF on the Expo/EAS binary; ATS / backup flags |

**Minimum DAST checklist before ads:**

1. Unauthenticated access to `/api/**` (except login/register/plans/webhooks)
2. Horizontal privilege: user A cannot read user B’s messages/likes
3. Upload abuse: oversized file, HTML-as-image, path tricks
4. Rate limit login + register + like + report (add middleware)
5. Webhook without `Stripe-Signature` rejected
6. XSS: profile bio/prompt with `<script>` rendered safely (React escapes by default — verify `dangerouslySetInnerHTML` never used)

---

## Secure SDLC habits

- **Secrets:** Railway / Vercel env only; rotate Stripe + JWT after any leak; never commit `.env`
- **Least privilege:** Blob tokens, DB URLs, Stripe restricted keys where possible
- **Logging:** no passwords, tokens, or full message bodies in logs
- **Dependency updates:** Dependabot or Renovate weekly
- **Backups / deletion:** document retention; ship self-serve account deletion (GDPR/CCPA expectation)
- **Moderation:** queue reports; photo/video scanning (e.g. AWS Rekognition / Hive) before heavy growth
- **Age:** keep 18+; store DOB more precisely if you need stronger proof later

---

## Patent vs license (product protection)

This is **not legal advice** — talk to an IP attorney for your jurisdiction.

| Mechanism | Do you need it? | Notes |
|-----------|-----------------|--------|
| **Copyright** | Automatic | Your code, UI, copy, and docs are copyrighted when created. Registering (e.g. US Copyright Office) helps enforcement but isn’t required to own it. |
| **Software patent** | Usually **no** for v1 | Swipe UX and “match on needs” are generally hard/expensive to patent and easy to design around. Patents cost a lot and take years. Revisit only if you invent a **novel, non-obvious technical method** (not just a product idea) and have funding. |
| **Trademark** | **Yes, soon** | Protect the **Attune** name/logo in your markets (USPTO / your country). More important than a patent for a dating brand. |
| **License (OSS)** | Only if you want others to reuse the code | For a commercial dating business, keep the repo **proprietary** (no OSS license, or “All rights reserved”). If you open-source parts later, use something deliberate (e.g. Business Source / dual license) — don’t default to MIT without thinking. |
| **Terms + Privacy** | **Required for ads/stores** | You already have `/terms` and `/privacy` — keep them accurate (payments, media, ND data). |
| **Trade secret** | Practical | Matching weights, moderation rules, growth playbooks — keep private; use NDAs with contractors. |

**Practical stack for Attune:** proprietary codebase + trademark filing + solid Terms/Privacy + security process above. Skip patents unless counsel identifies a specific claim worth filing.

---

## Production hardening backlog (security-relevant)

- [ ] Rate limit auth, likes, messages, reports
- [ ] Self-serve account + media deletion
- [ ] CSP / security headers on Vercel
- [ ] RevenueCat webhook shared secret
- [ ] Turnstile/hCaptcha on register if bot signups appear
- [ ] Automated Semgrep + Gitleaks CI
- [ ] Staging environment for ZAP
- [ ] Incident response one-pager (who rotates keys, who emails users)
