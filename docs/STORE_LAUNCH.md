# Attune — App Store & Play launch checklist

## What the code already supports
- Freemium: 5 likes/day free
- Attune Plus: unlimited likes, see who liked you, advanced filters, slight discover priority
- Web billing via Stripe Checkout + Customer Portal + webhooks
- Mobile billing via RevenueCat (Apple/Google) + RevenueCat webhook → API
- Privacy Policy `/privacy` and Terms `/terms`
- EAS config in `apps/mobile/eas.json`

## Accounts you must create (cannot be skipped)
1. **Apple Developer Program** — https://developer.apple.com ($99/year)
2. **App Store Connect** — create app `Attune`, bundle id `app.attune.dating`
3. **Google Play Console** — https://play.google.com/console ($25 once)
4. **Stripe** — https://dashboard.stripe.com (web subscriptions)
5. **RevenueCat** — https://www.revenuecat.com (unify Apple/Google entitlements)
6. **Expo / EAS** — `npx eas login` then `npx eas init` in `apps/mobile`

## Products to create
| Product ID | Price | Platforms |
|------------|-------|-----------|
| `attune_plus_monthly` | $14.99/mo | App Store, Play, Stripe |
| `attune_plus_yearly` | $99.99/yr | App Store, Play, Stripe |

Map Stripe Price IDs into:
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`

In RevenueCat, create entitlement `attune_plus` attached to both products. Webhook URL:
`https://YOUR_API/api/billing/revenuecat`

Stripe webhook URL:
`https://YOUR_API/api/billing/stripe/webhook`
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Build & submit (iOS)
```bash
cd apps/mobile
npx eas init
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production
```

## App Store listing (copy ready to paste)

**Name:** Attune  
**Subtitle:** Friends & dating for ND connection  
**Category:** Lifestyle / Social Networking  
**Age:** 17+ (frequent/intense mature themes — dating)

**Promotional text:**
Make friends or find romance — matched on sensory needs, communication, and social energy.

**Description:**
Attune helps neurodivergent adults find friendship and romance. Create a Needs Profile covering communication, sensory preferences, social battery, and intent (friends, queerplatonic, slow-burn, romance, or exploring). Discover people ranked by real compatibility. Free members get daily likes; Attune Plus unlocks unlimited likes and who liked you.

**Keywords:**
neurodivergent,friendship,dating,autism,adhd,audhd,sensory,compatibility,making friends

**Support URL:** https://YOUR_DOMAIN/  
**Privacy URL:** https://YOUR_DOMAIN/privacy  

## Before review
- [ ] Replace `privacy@attune.app` with a real inbox
- [ ] Host production API + web on HTTPS
- [ ] Turn off `ALLOW_DEV_BILLING` in production
- [ ] Add real app icon / screenshots (6.7" + 6.5" iPhone)
- [ ] Complete App Privacy nutrition labels (photos, messages, purchases)
- [ ] Age rating questionnaire answered accurately
