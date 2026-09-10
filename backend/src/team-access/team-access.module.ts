import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import {
  EmployeeInvitationController,
  TeamManagementController,
} from './team-access.controller';
import { TeamAccessService } from './team-access.service';

@Module({
  imports: [IdentityAccessModule],
  controllers: [TeamManagementController, EmployeeInvitationController],
  providers: [TeamAccessService],
})
export class TeamAccessModule {}
