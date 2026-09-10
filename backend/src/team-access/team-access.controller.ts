import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CsrfGuard } from '../identity-access/csrf.guard';
import { OwnerMembershipGuard } from '../identity-access/owner-membership.guard';
import { SessionGuard } from '../identity-access/session.guard';
import type { AuthenticatedRequest } from '../identity-access/auth.types';
import {
  AcceptNewEmployeeInvitationDto,
  InviteEmployeeDto,
} from './team-access.dto';
import { TeamAccessService } from './team-access.service';

@ApiTags('Acesso da equipe')
@Controller('api/car-washes/:carWashId/team')
@UseGuards(SessionGuard, OwnerMembershipGuard)
@ApiCookieAuth('nitivo_session')
export class TeamManagementController {
  constructor(private readonly teamAccess: TeamAccessService) {}

  @Get()
  @ApiOkResponse({ description: 'Funcionários e convites pendentes' })
  list(@Param('carWashId') carWashId: string) {
    return this.teamAccess.list(carWashId);
  }

  @Post('invitations')
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiCreatedResponse({ description: 'Convite privado criado' })
  invite(
    @Param('carWashId') carWashId: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: InviteEmployeeDto,
  ) {
    return this.teamAccess.invite(
      carWashId,
      request.authSession!.userId,
      input.email,
    );
  }

  @Delete('members/:membershipId')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiNoContentResponse({ description: 'Vínculo revogado' })
  revoke(
    @Param('carWashId') carWashId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.teamAccess.revoke(carWashId, membershipId);
  }
}

@ApiTags('Acesso da equipe')
@Controller('api/team/invitations')
export class EmployeeInvitationController {
  constructor(private readonly teamAccess: TeamAccessService) {}

  @Get(':token')
  @ApiOkResponse({ description: 'Dados do convite privado' })
  inspect(@Param('token') token: string, @Ip() remoteAddress: string) {
    return this.teamAccess.inspect(token, remoteAddress);
  }

  @Post(':token/accept-new')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Conta e vínculo criados' })
  acceptNew(
    @Param('token') token: string,
    @Body() input: AcceptNewEmployeeInvitationDto,
    @Ip() remoteAddress: string,
  ) {
    return this.teamAccess.acceptNew(token, input.password, remoteAddress);
  }

  @Post(':token/accept-existing')
  @HttpCode(204)
  @UseGuards(SessionGuard, CsrfGuard)
  @ApiCookieAuth('nitivo_session')
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiNoContentResponse({
    description: 'Vínculo aceito pela conta autenticada',
  })
  acceptExisting(
    @Param('token') token: string,
    @Req() request: AuthenticatedRequest,
    @Ip() remoteAddress: string,
  ) {
    return this.teamAccess.acceptExisting(
      token,
      request.authSession!.userId,
      request.authSession!.email,
      remoteAddress,
    );
  }
}
