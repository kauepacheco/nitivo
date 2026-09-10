import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CsrfGuard } from './csrf.guard';
import { OwnerMembershipGuard } from './owner-membership.guard';
import { SessionGuard } from './session.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, CsrfGuard, OwnerMembershipGuard],
  exports: [AuthService, SessionGuard, CsrfGuard, OwnerMembershipGuard],
})
export class IdentityAccessModule {}
