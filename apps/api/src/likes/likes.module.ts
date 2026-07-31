import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module";
import { LikesController } from "./likes.controller";
import { LikesService } from "./likes.service";

@Module({
  imports: [BillingModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
