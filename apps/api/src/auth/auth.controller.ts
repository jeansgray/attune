import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LoginSchema, RegisterSchema } from "@attune/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod.pipe";
import { AuthService } from "./auth.service";
import { CurrentUser, type AuthUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

const DeleteAccountSchema = z.object({
  password: z.string().min(1),
  confirm: z.literal("DELETE"),
});

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post("register")
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: unknown) {
    return this.auth.register(body as never);
  }

  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post("login")
  login(@Body(new ZodValidationPipe(LoginSchema)) body: unknown) {
    return this.auth.login(body as never);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Delete("me")
  deleteMe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(DeleteAccountSchema)) body: z.infer<typeof DeleteAccountSchema>,
  ) {
    return this.auth.deleteAccount(user.userId, body.password);
  }
}
