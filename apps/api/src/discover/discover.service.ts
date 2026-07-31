import { BadRequestException, Injectable } from "@nestjs/common";
import { rankCandidates, type MatchCandidate } from "@attune/matching";
import type { NeedsProfile, RelationshipIntent } from "@attune/shared";
import { BillingService } from "../billing/billing.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DiscoverService {
  constructor(
    private prisma: PrismaService,
    private billing: BillingService,
  ) {}

  async feed(viewerId: string, intentFilter?: RelationshipIntent[]) {
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      include: { needs: true, profile: true },
    });
    if (!viewer?.needs || !viewer.profile) {
      throw new BadRequestException("Complete your needs profile first");
    }

    const viewerEntitlement = await this.billing.getEntitlement(viewerId);

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
        subscription: true,
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

    const withPriority = ranked
      .map((row) => {
        const user = byId.get(row.userId)!;
        const candidatePlus =
          user.subscription?.plan === "plus" &&
          ["active", "trialing"].includes(user.subscription.status);
        const boostedTotal = Math.min(
          100,
          row.score.total + (candidatePlus ? 3 : 0),
        );
        return {
          userId: row.userId,
          score: { ...row.score, total: boostedTotal },
          profile: user.profile,
          needs: viewerEntitlement.features.advancedFilters ? user.needs : null,
          prompts: user.prompts,
          priority: candidatePlus,
        };
      })
      .sort((a, b) => b.score.total - a.score.total);

    return {
      entitlement: viewerEntitlement,
      results: withPriority,
    };
  }
}
