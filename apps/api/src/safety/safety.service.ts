import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SafetyService {
  constructor(private prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    return this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async report(reporterId: string, reportedUserId: string, reason: string) {
    return this.prisma.report.create({
      data: { reporterId, reportedUserId, reason },
    });
  }
}
