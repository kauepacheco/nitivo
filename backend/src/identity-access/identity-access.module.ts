import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CsrfGuard } from './csrf.guard';
import { OwnerMembershipGuard } from './owner-membership.guard';
import { SessionGuard } from './session.guard';
import { AuthenticationThrottleService } from './authentication-throttle.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthenticationThrottleService,
    SessionGuard,
    CsrfGuard,
    OwnerMembershipGuard,
  ],
  exports: [
    AuthService,
    AuthenticationThrottleService,
    SessionGuard,
    CsrfGuard,
    OwnerMembershipGuard,
  ],
})
export class IdentityAccessModule {}
