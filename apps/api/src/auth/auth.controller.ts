import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { LoginSchema, RegisterSchema } from "@attune/shared";
import { ZodValidationPipe } from "../common/zod.pipe";
import { AuthService } from "./auth.service";
import { CurrentUser, type AuthUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: unknown) {
    return this.auth.register(body as never);
  }

  @Post("login")
  login(@Body(new ZodValidationPipe(LoginSchema)) body: unknown) {
    return this.auth.login(body as never);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }
}
