import { BadRequestException, Injectable } from "@nestjs/common";
import { rankCandidates, type MatchCandidate } from "@attune/matching";
import type { NeedsProfile, RelationshipIntent } from "@attune/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DiscoverService {
  constructor(private prisma: PrismaService) {}

  async feed(viewerId: string, intentFilter?: RelationshipIntent[]) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { needs: true, profile: true },
    });
    if (!viewer?.needs || !viewer.profile) {
      throw new BadRequestException("Complete your needs profile first");
    }

    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
    });
    const blockedIds = new Set(
      blocks.map((b) => (b.blockerId === viewerId ? b.blockedId : b.blockerId)),
    );

    const liked = await this.prisma.like.findMany({
      where: { fromUserId: viewerId },
      select: { toUserId: true },
    });
    const likedIds = new Set(liked.map((l) => l.toUserId));

    const others = await this.prisma.user.findMany({
      where: {
        id: { not: viewerId },
        profile: { onboardingComplete: true },
        needs: { isNot: null },
      },
      include: {
        profile: true,
        needs: true,
        prompts: { orderBy: { sortOrder: "asc" }, take: 3 },
      },
    });

    const viewerCandidate: MatchCandidate = {
      userId: viewerId,
      needs: viewer.needs as unknown as NeedsProfile,
      specialInterests: viewer.profile.specialInterests,
    };

    const candidates: MatchCandidate[] = others
      .filter((u) => !blockedIds.has(u.id) && !likedIds.has(u.id) && u.needs && u.profile)
      .map((u) => ({
        userId: u.id,
        needs: u.needs as unknown as NeedsProfile,
        specialInterests: u.profile!.specialInterests,
      }));

    const ranked = rankCandidates(viewerCandidate, candidates, { intentFilter, minScore: 30 });
    const byId = new Map(others.map((u) => [u.id, u]));

    return ranked.map((row) => {
      const user = byId.get(row.userId)!;
      return {
        userId: row.userId,
        score: row.score,
        profile: user.profile,
        needs: user.needs,
        prompts: user.prompts,
      };
    });
  }
}
