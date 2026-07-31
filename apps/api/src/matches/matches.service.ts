import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { include: { profile: true } },
        userB: { include: { profile: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return matches.map((m) => {
      const other = m.userAId === userId ? m.userB : m.userA;
      return {
        id: m.id,
        createdAt: m.createdAt,
        otherUser: {
          id: other.id,
          profile: other.profile,
        },
        lastMessage: m.messages[0] ?? null,
      };
    });
  }

  async getMessages(userId: string, matchId: string) {
    const match = await this.ensureMember(userId, matchId);
    const messages = await this.prisma.message.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: "asc" },
    });
    return { match, messages };
  }

  async sendMessage(userId: string, matchId: string, body: string) {
    await this.ensureMember(userId, matchId);
    return this.prisma.message.create({
      data: { matchId, senderId: userId, body },
    });
  }

  private async ensureMember(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException();
    }
    return match;
  }
}
