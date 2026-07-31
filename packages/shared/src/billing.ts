export const FREE_DAILY_LIKES = 5;

export const PLUS_FEATURES = [
  "Unlimited likes",
  "See who liked you",
  "Advanced needs filters",
  "Priority placement in discover",
] as const;

export const Plans = ["free", "plus"] as const;
export type Plan = (typeof Plans)[number];

export const BillingProviders = ["stripe", "apple", "google", "dev"] as const;
export type BillingProvider = (typeof BillingProviders)[number];

/** Display prices — App Store / Play / Stripe products must match these IDs. */
export const PLUS_PRODUCTS = {
  monthly: {
    id: "attune_plus_monthly",
    label: "Monthly",
    priceLabel: "$14.99/mo",
    interval: "month" as const,
  },
  yearly: {
    id: "attune_plus_yearly",
    label: "Yearly",
    priceLabel: "$99.99/yr",
    interval: "year" as const,
    savingsLabel: "Save ~44%",
  },
} as const;

export type PlusProductKey = keyof typeof PLUS_PRODUCTS;
