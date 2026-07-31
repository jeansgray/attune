import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  UpdateProfileSchema,
  UpsertNeedsSchema,
  UpsertPromptSchema,
} from "@attune/shared";
import { memoryStorage } from "multer";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/zod.pipe";
import { PhotosService } from "./photos.service";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(
    private profiles: ProfilesService,
    private photos: PhotosService,
  ) {}

  @Patch("me")
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: unknown,
  ) {
    return this.profiles.updateProfile(user.userId, body as never);
  }

  @Post("me/photos")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.photos.upload(user.userId, file);
  }

  @Delete("me/photos")
  removePhoto(@CurrentUser() user: AuthUser, @Body() body: { url?: string }) {
    if (!body.url) return this.profiles.updateProfile(user.userId, { photoUrls: [] });
    return this.photos.remove(user.userId, body.url);
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
