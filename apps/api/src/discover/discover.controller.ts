import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { RelationshipIntent } from "@attune/shared";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DiscoverService } from "./discover.service";

@Controller("discover")
@UseGuards(JwtAuthGuard)
export class DiscoverController {
  constructor(private discover: DiscoverService) {}

  @Get()
  feed(@CurrentUser() user: AuthUser, @Query("intent") intent?: string) {
    const intentFilter = intent
      ? (intent.split(",").filter(Boolean) as RelationshipIntent[])
      : undefined;
    return this.discover.feed(user.userId, intentFilter);
  }
}
