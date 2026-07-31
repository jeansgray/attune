import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/zod.pipe";
import { MatchesService } from "./matches.service";

const MessageBody = z.object({ body: z.string().min(1).max(2000) });

@Controller("matches")
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matches: MatchesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.matches.list(user.userId);
  }

  @Get(":id/messages")
  messages(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.matches.getMessages(user.userId, id);
  }

  @Post(":id/messages")
  send(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(MessageBody)) body: { body: string },
  ) {
    return this.matches.sendMessage(user.userId, id, body.body);
  }
}
