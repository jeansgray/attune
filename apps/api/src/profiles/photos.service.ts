import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { put } from "@vercel/blob";
import { PrismaService } from "../prisma/prisma.service";

const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async upload(userId: string, file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Photo file is required");
    }
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException("Only JPEG, PNG, WebP, or GIF photos are allowed");
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("Photo must be 5MB or smaller");
    }

    const token = this.config.get<string>("BLOB_READ_WRITE_TOKEN");
    if (!token) {
      throw new ServiceUnavailableException(
        "Photo storage is not configured (BLOB_READ_WRITE_TOKEN)",
      );
    }

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException("Profile not found");

    const existing = profile.photoUrls.filter((url) => !url.includes("api.dicebear.com"));
    if (existing.length >= MAX_PHOTOS) {
      throw new BadRequestException(`You can upload up to ${MAX_PHOTOS} photos`);
    }

    const ext =
      file.mimetype === "image/png"
        ? "png"
        : file.mimetype === "image/webp"
          ? "webp"
          : file.mimetype === "image/gif"
            ? "gif"
            : "jpg";
    const pathname = `profiles/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(pathname, file.buffer, {
      access: "public",
      token,
      contentType: file.mimetype,
      addRandomSuffix: false,
    });

    const photoUrls = [...existing, blob.url].slice(0, MAX_PHOTOS);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { photoUrls },
    });

    return { url: blob.url, photoUrls: updated.photoUrls };
  }

  async remove(userId: string, url: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException("Profile not found");
    const photoUrls = profile.photoUrls.filter((u) => u !== url);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { photoUrls },
    });
    return { photoUrls: updated.photoUrls };
  }
}
