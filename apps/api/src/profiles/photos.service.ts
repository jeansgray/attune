import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MAX_PHOTOS } from "@attune/shared";
import { put } from "@vercel/blob";
import { PrismaService } from "../prisma/prisma.service";

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VOICE_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/aac",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type MediaKind = "photo" | "voice" | "video";

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async uploadPhoto(userId: string, file?: Express.Multer.File) {
    const url = await this.uploadBlob(userId, "photo", file);
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException("Profile not found");

    const existing = profile.photoUrls.filter((u) => !u.includes("api.dicebear.com"));
    if (existing.length >= MAX_PHOTOS) {
      throw new BadRequestException(`You can upload up to ${MAX_PHOTOS} photos`);
    }

    const photoUrls = [...existing, url].slice(0, MAX_PHOTOS);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { photoUrls },
    });
    return { url, photoUrls: updated.photoUrls };
  }

  async uploadMedia(userId: string, kind: MediaKind, file?: Express.Multer.File) {
    if (kind === "photo") return this.uploadPhoto(userId, file);
    const url = await this.uploadBlob(userId, kind, file);
    return { url, kind };
  }

  async removePhoto(userId: string, url: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException("Profile not found");
    const photoUrls = profile.photoUrls.filter((u) => u !== url);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { photoUrls },
    });
    return { photoUrls: updated.photoUrls };
  }

  private async uploadBlob(userId: string, kind: MediaKind, file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("File is required");
    }

    const token = this.config.get<string>("BLOB_READ_WRITE_TOKEN");
    if (!token) {
      throw new ServiceUnavailableException(
        "Media storage is not configured (BLOB_READ_WRITE_TOKEN)",
      );
    }

    const { allowed, maxBytes, folder, defaultExt } = this.limitsFor(kind);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported ${kind} type: ${file.mimetype}`);
    }
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `${kind} must be ${Math.round(maxBytes / (1024 * 1024))}MB or smaller`,
      );
    }

    const ext = this.extFor(file.mimetype, defaultExt);
    const pathname = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(pathname, file.buffer, {
      access: "public",
      token,
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  private limitsFor(kind: MediaKind) {
    if (kind === "photo") {
      return {
        allowed: PHOTO_TYPES,
        maxBytes: 5 * 1024 * 1024,
        folder: "profiles",
        defaultExt: "jpg",
      };
    }
    if (kind === "voice") {
      return {
        allowed: VOICE_TYPES,
        maxBytes: 8 * 1024 * 1024,
        folder: "voice",
        defaultExt: "webm",
      };
    }
    return {
      allowed: VIDEO_TYPES,
      maxBytes: 40 * 1024 * 1024,
      folder: "video",
      defaultExt: "mp4",
    };
  }

  private extFor(mime: string, fallback: string) {
    const map: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "audio/webm": "webm",
      "audio/mp4": "m4a",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
      "audio/x-m4a": "m4a",
      "audio/aac": "aac",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/quicktime": "mov",
    };
    return map[mime] ?? fallback;
  }
}
