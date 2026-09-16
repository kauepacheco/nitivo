import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OwnerMembershipGuard } from '../identity-access/owner-membership.guard';
import { SessionGuard } from '../identity-access/session.guard';
import { DashboardDto, DashboardQueryDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Painel do proprietário')
@ApiCookieAuth('nitivo_session')
@Controller('api/car-washes/:carWashId/dashboard')
@UseGuards(SessionGuard, OwnerMembershipGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    type: DashboardDto,
    description:
      'Indicadores pela data prevista e estado atual, com preços históricos',
  })
  get(
    @Param('carWashId') carWashId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboard.get(carWashId, query);
  }
}
