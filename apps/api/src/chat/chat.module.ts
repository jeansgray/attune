import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MatchesModule } from "../matches/matches.module";
import { ChatGateway } from "./chat.gateway";

@Module({
  imports: [AuthModule, MatchesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
