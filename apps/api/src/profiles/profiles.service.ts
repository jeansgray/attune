import { Injectable, NotFoundException } from "@nestjs/common";
import type { NeedsProfile as NeedsInput, UpdateProfileInput } from "@attune/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return this.prisma.profile.update({
      where: { userId },
      data: input,
    });
  }

  async upsertNeeds(userId: string, input: NeedsInput) {
    return this.prisma.needsProfile.upsert({
      where: { userId },
      create: { userId, ...input },
      update: { ...input },
    });
  }

  async upsertPrompt(
    userId: string,
    input: { promptText: string; answer: string; sortOrder: number },
    promptId?: string,
  ) {
    if (promptId) {
      return this.prisma.prompt.update({
        where: { id: promptId },
        data: input,
      });
    }
    return this.prisma.prompt.create({
      data: { userId, ...input },
    });
  }

  async deletePrompt(userId: string, promptId: string) {
    const prompt = await this.prisma.prompt.findFirst({ where: { id: promptId, userId } });
    if (!prompt) throw new NotFoundException("Prompt not found");
    await this.prisma.prompt.delete({ where: { id: promptId } });
    return { ok: true };
  }

  async getPublicProfile(viewerId: string, userId: string) {
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: userId },
          { blockerId: userId, blockedId: viewerId },
        ],
      },
    });
    if (blocked) throw new NotFoundException("Profile not found");

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        needs: true,
        prompts: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!user?.profile) throw new NotFoundException("Profile not found");

    return {
      id: user.id,
      profile: user.profile,
      needs: user.needs,
      prompts: user.prompts,
    };
  }
}
