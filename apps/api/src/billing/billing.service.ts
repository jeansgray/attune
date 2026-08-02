import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FREE_DAILY_LIKES, PLUS_PRODUCTS, type PlusProductKey } from "@attune/shared";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";

export type Entitlement = {
  plan: "free" | "plus";
  isPlus: boolean;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  likesUsedToday: number;
  likesRemainingToday: number | null;
  dailyLikeLimit: number;
  features: {
    unlimitedLikes: boolean;
    seeWhoLikedYou: boolean;
    advancedFilters: boolean;
    priorityDiscover: boolean;
  };
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  private startOfUtcDay(d = new Date()) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  async ensureSubscriptionRow(userId: string) {
    return this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, plan: "free", status: "inactive" },
      update: {},
    });
  }

  async isPlusActive(userId: string) {
    const sub = await this.ensureSubscriptionRow(userId);
    if (sub.plan !== "plus") return false;
    if (!["active", "trialing"].includes(sub.status)) return false;
    if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) return false;
    return true;
  }

  async getEntitlement(userId: string): Promise<Entitlement> {
    const sub = await this.ensureSubscriptionRow(userId);
    const isPlus = await this.isPlusActive(userId);
    const likesUsedToday = await this.prisma.like.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: this.startOfUtcDay() },
      },
    });

    return {
      plan: isPlus ? "plus" : "free",
      isPlus,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      likesUsedToday,
      likesRemainingToday: isPlus ? null : Math.max(0, FREE_DAILY_LIKES - likesUsedToday),
      dailyLikeLimit: FREE_DAILY_LIKES,
      features: {
        unlimitedLikes: isPlus,
        seeWhoLikedYou: isPlus,
        advancedFilters: isPlus,
        priorityDiscover: isPlus,
      },
    };
  }

  async assertCanLike(userId: string) {
    const entitlement = await this.getEntitlement(userId);
    if (entitlement.isPlus) return entitlement;
    if ((entitlement.likesRemainingToday ?? 0) <= 0) {
      throw new ForbiddenException({
        code: "LIKE_LIMIT_REACHED",
        message: `Free accounts get ${FREE_DAILY_LIKES} likes per day. Upgrade to Attune Plus for unlimited likes.`,
        entitlement,
      });
    }
    return entitlement;
  }

  async assertCanSeeWhoLikedYou(userId: string) {
    const entitlement = await this.getEntitlement(userId);
    if (!entitlement.isPlus) {
      throw new ForbiddenException({
        code: "PLUS_REQUIRED",
        message: "See who liked you is an Attune Plus feature.",
        entitlement,
      });
    }
    return entitlement;
  }

  async createCheckoutSession(userId: string, email: string, productKey: PlusProductKey) {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        "Stripe is not configured. Set STRIPE_SECRET_KEY or use POST /billing/dev-grant for local Plus.",
      );
    }

    const priceEnv =
      productKey === "yearly" ? "STRIPE_PRICE_YEARLY" : "STRIPE_PRICE_MONTHLY";
    const priceId = this.config.get<string>(priceEnv);
    if (!priceId) {
      throw new ServiceUnavailableException(`Missing ${priceEnv} in environment`);
    }

    const sub = await this.ensureSubscriptionRow(userId);
    const customerId = await this.ensureStripeCustomer(userId, email, sub.providerCustomerId);

    const webUrl = this.config.get<string>("WEB_URL") ?? "http://localhost:3000";
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${webUrl}/plus?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webUrl}/plus?canceled=1`,
      metadata: {
        attuneUserId: userId,
        productId: PLUS_PRODUCTS[productKey].id,
      },
      subscription_data: {
        metadata: {
          attuneUserId: userId,
          productId: PLUS_PRODUCTS[productKey].id,
        },
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  /** Create or recover a Stripe customer when switching accounts / stale IDs. */
  private async ensureStripeCustomer(
    userId: string,
    email: string,
    existingId?: string | null,
  ) {
    if (!this.stripe) {
      throw new ServiceUnavailableException("Stripe is not configured");
    }

    if (existingId) {
      try {
        const existing = await this.stripe.customers.retrieve(existingId);
        if (!("deleted" in existing && existing.deleted)) {
          return existing.id;
        }
      } catch (err) {
        this.logger.warn(
          `Stale Stripe customer ${existingId} for ${userId}; creating a new one`,
        );
      }
    }

    const customer = await this.stripe.customers.create({
      email,
      metadata: { attuneUserId: userId },
    });
    await this.prisma.subscription.update({
      where: { userId },
      data: { provider: "stripe", providerCustomerId: customer.id },
    });
    return customer.id;
  }

  async createPortalSession(userId: string) {
    if (!this.stripe) {
      throw new ServiceUnavailableException("Stripe is not configured");
    }
    const sub = await this.ensureSubscriptionRow(userId);
    if (!sub.providerCustomerId) {
      throw new ServiceUnavailableException("No Stripe customer on file");
    }
    let customerId = sub.providerCustomerId;
    try {
      const existing = await this.stripe.customers.retrieve(customerId);
      if ("deleted" in existing && existing.deleted) {
        throw new ServiceUnavailableException("Stripe customer was deleted");
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        "Billing customer is out of date. Start checkout once to refresh, then manage billing.",
      );
    }
    const webUrl = this.config.get<string>("WEB_URL") ?? "http://localhost:3000";
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${webUrl}/plus`,
    });
    return { url: session.url };
  }

  /**
   * Confirm a Checkout session after redirect (covers delayed/missing webhooks).
   * Only grants Plus when Stripe reports the session paid/complete for this user.
   */
  async confirmCheckoutSession(userId: string, sessionId: string) {
    if (!this.stripe) {
      throw new ServiceUnavailableException("Stripe is not configured");
    }
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    if (session.metadata?.attuneUserId && session.metadata.attuneUserId !== userId) {
      throw new ForbiddenException("Checkout session does not belong to this user");
    }
    if (session.status !== "complete" || session.payment_status !== "paid") {
      return { confirmed: false, entitlement: await this.getEntitlement(userId) };
    }

    const subscription =
      typeof session.subscription === "string"
        ? await this.stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

    if (!subscription) {
      return { confirmed: false, entitlement: await this.getEntitlement(userId) };
    }

    await this.grantPlus(userId, {
      provider: "stripe",
      providerCustomerId: String(session.customer ?? ""),
      providerSubscriptionId: subscription.id,
      productId: session.metadata?.productId,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    return { confirmed: true, entitlement: await this.getEntitlement(userId) };
  }

  async grantPlus(
    userId: string,
    opts: {
      provider: string;
      providerSubscriptionId?: string;
      providerCustomerId?: string;
      productId?: string;
      currentPeriodEnd?: Date | null;
      status?: string;
      cancelAtPeriodEnd?: boolean;
    },
  ) {
    return this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: "plus",
        status: opts.status ?? "active",
        provider: opts.provider,
        providerSubscriptionId: opts.providerSubscriptionId,
        providerCustomerId: opts.providerCustomerId,
        productId: opts.productId,
        currentPeriodEnd: opts.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: opts.cancelAtPeriodEnd ?? false,
      },
      update: {
        plan: "plus",
        status: opts.status ?? "active",
        provider: opts.provider,
        providerSubscriptionId: opts.providerSubscriptionId,
        providerCustomerId: opts.providerCustomerId,
        productId: opts.productId,
        currentPeriodEnd: opts.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: opts.cancelAtPeriodEnd ?? false,
      },
    });
  }

  async revokePlus(userId: string, status = "canceled") {
    return this.prisma.subscription.update({
      where: { userId },
      data: { plan: "free", status },
    });
  }

  /** Local/dev only — activates Plus without Stripe. */
  async devGrant(userId: string, days = 30) {
    if (this.config.get("NODE_ENV") === "production" && !this.config.get("ALLOW_DEV_BILLING")) {
      throw new ForbiddenException("Dev grant disabled in production");
    }
    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.grantPlus(userId, {
      provider: "dev",
      productId: PLUS_PRODUCTS.monthly.id,
      currentPeriodEnd: end,
      status: "active",
    });
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) {
      throw new ServiceUnavailableException("Stripe is not configured");
    }
    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      throw new ServiceUnavailableException("Missing STRIPE_WEBHOOK_SECRET");
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.attuneUserId;
        if (!userId || !session.subscription) break;
        const subscription = await this.stripe.subscriptions.retrieve(
          String(session.subscription),
        );
        await this.grantPlus(userId, {
          provider: "stripe",
          providerCustomerId: String(session.customer ?? ""),
          providerSubscriptionId: subscription.id,
          productId: session.metadata?.productId,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.attuneUserId ??
          (
            await this.prisma.subscription.findFirst({
              where: { providerSubscriptionId: subscription.id },
            })
          )?.userId;
        if (!userId) {
          this.logger.warn(`No user for Stripe subscription ${subscription.id}`);
          break;
        }
        if (["active", "trialing"].includes(subscription.status)) {
          await this.grantPlus(userId, {
            provider: "stripe",
            providerCustomerId: String(subscription.customer),
            providerSubscriptionId: subscription.id,
            productId: subscription.metadata?.productId,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        } else {
          await this.revokePlus(userId, subscription.status);
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  /**
   * RevenueCat webhook — maps Apple/Google entitlements to Attune Plus.
   * Configure RevenueCat to send subscriber events to POST /api/billing/revenuecat.
   */
  async handleRevenueCatWebhook(body: {
    event?: {
      type?: string;
      app_user_id?: string;
      expiration_at_ms?: number;
      product_id?: string;
      store?: string;
    };
  }) {
    const event = body.event;
    if (!event?.app_user_id) return { received: true };

    const userId = event.app_user_id;
    const activeTypes = new Set([
      "INITIAL_PURCHASE",
      "RENEWAL",
      "UNCANCELLATION",
      "PRODUCT_CHANGE",
      "NON_RENEWING_PURCHASE",
    ]);
    const inactiveTypes = new Set(["EXPIRATION", "CANCELLATION"]);

    if (activeTypes.has(event.type ?? "")) {
      await this.grantPlus(userId, {
        provider: (event.store ?? "apple").toLowerCase(),
        productId: event.product_id,
        currentPeriodEnd: event.expiration_at_ms
          ? new Date(event.expiration_at_ms)
          : null,
        status: "active",
      });
    } else if (inactiveTypes.has(event.type ?? "")) {
      if (event.type === "CANCELLATION" && event.expiration_at_ms) {
        await this.grantPlus(userId, {
          provider: (event.store ?? "apple").toLowerCase(),
          productId: event.product_id,
          currentPeriodEnd: new Date(event.expiration_at_ms),
          status: "active",
          cancelAtPeriodEnd: true,
        });
      } else {
        await this.revokePlus(userId, "canceled");
      }
    }

    return { received: true };
  }
}
