import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { LikeSchema } from "@attune/shared";
import type { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";

type LikeInput = z.infer<typeof LikeSchema>;

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async like(fromUserId: string, input: LikeInput) {
    if (fromUserId === input.toUserId) {
      throw new ConflictException("Cannot like yourself");
    }

    const target = await this.prisma.user.findUnique({ where: { id: input.toUserId } });
    if (!target) throw new NotFoundException("User not found");

    const existing = await this.prisma.like.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId, toUserId: input.toUserId },
      },
    });
    if (existing) throw new ConflictException("Already liked");

    const like = await this.prisma.like.create({
      data: {
        fromUserId,
        toUserId: input.toUserId,
        promptId: input.promptId,
        comment: input.comment,
      },
    });

    const reciprocal = await this.prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: input.toUserId,
          toUserId: fromUserId,
        },
      },
    });

    let match = null;
    if (reciprocal) {
      const [userAId, userBId] =
        fromUserId < input.toUserId
          ? [fromUserId, input.toUserId]
          : [input.toUserId, fromUserId];
      match = await this.prisma.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: {},
      });
    }

    return { like, matched: Boolean(match), match };
  }

  async incoming(userId: string) {
    return this.prisma.like.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { include: { profile: true } },
        prompt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
