import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  MAX_PROMPTS,
  type NeedsProfile as NeedsInput,
  type UpdateProfileInput,
} from "@attune/shared";
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
    input: {
      promptText: string;
      answer?: string;
      mediaType?: string;
      mediaUrl?: string | null;
      sortOrder: number;
    },
    promptId?: string,
  ) {
    const data = {
      promptText: input.promptText,
      answer: input.answer ?? "",
      mediaType: input.mediaType ?? "text",
      mediaUrl: input.mediaUrl ?? null,
      sortOrder: input.sortOrder,
    };
    if (promptId) {
      const existing = await this.prisma.prompt.findFirst({
        where: { id: promptId, userId },
      });
      if (!existing) throw new NotFoundException("Prompt not found");
      return this.prisma.prompt.update({
        where: { id: promptId },
        data,
      });
    }
    const count = await this.prisma.prompt.count({ where: { userId } });
    if (count >= MAX_PROMPTS) {
      throw new BadRequestException(`You can add up to ${MAX_PROMPTS} prompts`);
    }
    return this.prisma.prompt.create({
      data: { userId, ...data },
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
