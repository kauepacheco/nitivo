import { BookingService } from './booking.service';
import {
  PublicBookingController,
  TeamAgendaController,
  TeamMembershipGuard,
  BookingThrottleGuard,
} from './booking.controller';
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
    PublicBookingController,
    TeamAgendaController,
    SchedulingController,
    BoxesController,
    PublicAvailabilityController,
  ],
  providers: [
    SchedulingService,
    BookingService,
    TeamMembershipGuard,
    BookingThrottleGuard,
  ],
})
export class SchedulingModule {}
