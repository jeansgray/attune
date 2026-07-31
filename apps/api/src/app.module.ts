import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { ChatModule } from "./chat/chat.module";
import { DiscoverModule } from "./discover/discover.module";
import { LikesModule } from "./likes/likes.module";
import { MatchesModule } from "./matches/matches.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { SafetyModule } from "./safety/safety.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BillingModule,
    ProfilesModule,
    DiscoverModule,
    LikesModule,
    MatchesModule,
    ChatModule,
    SafetyModule,
  ],
})
export class AppModule {}
