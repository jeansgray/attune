import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ReportSchema } from "@attune/shared";
import { z } from "zod";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/zod.pipe";
import { SafetyService } from "./safety.service";

@Controller("safety")
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private safety: SafetyService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("block/:userId")
  block(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.safety.block(user.userId, userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("report")
  report(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ReportSchema)) body: z.infer<typeof ReportSchema>,
  ) {
    return this.safety.report(user.userId, body.reportedUserId, body.reason);
  }
}
