import { Module } from "@nestjs/common";
import { PhotosService } from "./photos.service";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, PhotosService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
