import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LikeSchema } from "@attune/shared";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/zod.pipe";
import { LikesService } from "./likes.service";

@Controller("likes")
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private likes: LikesService) {}

  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @Post()
  like(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(LikeSchema)) body: unknown,
  ) {
    return this.likes.like(user.userId, body as never);
  }

  @Get("incoming")
  incoming(@CurrentUser() user: AuthUser) {
    return this.likes.incomingPreview(user.userId);
  }
}
