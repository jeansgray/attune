import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  UpdateProfileSchema,
  UpsertNeedsSchema,
  UpsertPromptSchema,
} from "@attune/shared";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/zod.pipe";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private profiles: ProfilesService) {}

  @Patch("me")
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: unknown,
  ) {
    return this.profiles.updateProfile(user.userId, body as never);
  }

  @Post("me/needs")
  upsertNeeds(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpsertNeedsSchema)) body: unknown,
  ) {
    return this.profiles.upsertNeeds(user.userId, body as never);
  }

  @Post("me/prompts")
  createPrompt(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpsertPromptSchema)) body: unknown,
  ) {
    return this.profiles.upsertPrompt(user.userId, body as never);
  }

  @Patch("me/prompts/:id")
  updatePrompt(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpsertPromptSchema)) body: unknown,
  ) {
    return this.profiles.upsertPrompt(user.userId, body as never, id);
  }

  @Delete("me/prompts/:id")
  deletePrompt(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.profiles.deletePrompt(user.userId, id);
  }

  @Get(":userId")
  getPublic(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.profiles.getPublicProfile(user.userId, userId);
  }
}
