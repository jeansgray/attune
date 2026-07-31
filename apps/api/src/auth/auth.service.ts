import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { LoginInput, RegisterInput } from "@attune/shared";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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
