import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { FREE_DAILY_LIKES, PLUS_PRODUCTS, type PlusProductKey } from "@attune/shared";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private billing: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Get("entitlement")
  entitlement(@CurrentUser() user: AuthUser) {
    return this.billing.getEntitlement(user.userId);
  }

  @Get("plans")
  plans() {
    return {
      freeDailyLikes: FREE_DAILY_LIKES,
      products: PLUS_PRODUCTS,
      features: [
        "Unlimited likes",
        "See who liked you",
        "Advanced needs filters",
        "Priority placement in discover",
      ],
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("checkout")
  checkout(
    @CurrentUser() user: AuthUser,
    @Body() body: { productKey?: PlusProductKey },
  ) {
    const productKey = body.productKey === "yearly" ? "yearly" : "monthly";
    return this.billing.createCheckoutSession(user.userId, user.email, productKey);
  }

  @UseGuards(JwtAuthGuard)
  @Post("portal")
  portal(@CurrentUser() user: AuthUser) {
    return this.billing.createPortalSession(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("confirm-session")
  confirmSession(
    @CurrentUser() user: AuthUser,
    @Body() body: { sessionId?: string },
  ) {
    if (!body.sessionId) {
      return this.billing.getEntitlement(user.userId).then((entitlement) => ({
        confirmed: false,
        entitlement,
      }));
    }
    return this.billing.confirmCheckoutSession(user.userId, body.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("dev-grant")
  devGrant(@CurrentUser() user: AuthUser, @Query("days") days?: string) {
    return this.billing.devGrant(user.userId, days ? Number(days) : 30);
  }

  @SkipThrottle()
  @Post("stripe/webhook")
  stripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature: string,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.billing.handleStripeWebhook(raw, signature);
  }

  /** Alias — Stripe dashboard quickstart often uses /billing/webhook */
  @SkipThrottle()
  @Post("webhook")
  stripeWebhookAlias(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature: string,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.billing.handleStripeWebhook(raw, signature);
  }

  @Post("revenuecat")
  revenueCat(@Body() body: unknown) {
    return this.billing.handleRevenueCatWebhook(body as never);
  }
}
