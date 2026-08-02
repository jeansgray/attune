import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { LoginInput, RegisterInput } from "@attune/shared";
import { del } from "@vercel/blob";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        profile: {
          create: {
            displayName: input.displayName,
            birthYear: input.birthYear,
            photoUrls: [
              `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(input.displayName)}&backgroundColor=d7ebe4`,
            ],
          },
        },
      },
      include: { profile: true },
    });

    return this.tokenResponse(user.id, user.email, user.profile);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    return this.tokenResponse(user.id, user.email, user.profile);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, needs: true, prompts: { orderBy: { sortOrder: "asc" } } },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  /**
   * Permanently delete the account and related rows (Prisma cascades).
   * Best-effort cleanup of Vercel Blob media owned by this user.
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, prompts: true },
    });
    if (!user) throw new UnauthorizedException();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Password incorrect");

    const urls = [
      ...(user.profile?.photoUrls ?? []),
      ...user.prompts.map((p) => p.mediaUrl).filter((u): u is string => Boolean(u)),
    ].filter((u) => u.includes("blob.vercel-storage.com"));

    const token = this.config.get<string>("BLOB_READ_WRITE_TOKEN");
    if (token && urls.length) {
      await Promise.allSettled(urls.map((url) => del(url, { token })));
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  private tokenResponse(
    userId: string,
    email: string,
    profile: { displayName: string; onboardingComplete: boolean } | null,
  ) {
    const accessToken = this.jwt.sign({ sub: userId, email });
    return {
      accessToken,
      user: {
        id: userId,
        email,
        displayName: profile?.displayName ?? "",
        onboardingComplete: profile?.onboardingComplete ?? false,
      },
    };
  }
}
