import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import {
  BoxesController,
  PublicAvailabilityController,
  SchedulingController,
} from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [IdentityAccessModule],
  controllers: [
    SchedulingController,
    BoxesController,
    PublicAvailabilityController,
  ],
  providers: [SchedulingService],
})
export class SchedulingModule {}
