import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module";
import { DiscoverController } from "./discover.controller";
import { DiscoverService } from "./discover.service";

@Module({
  imports: [BillingModule],
  controllers: [DiscoverController],
  providers: [DiscoverService],
})
export class DiscoverModule {}
