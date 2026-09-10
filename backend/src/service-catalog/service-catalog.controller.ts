import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CsrfGuard } from '../identity-access/csrf.guard';
import { OwnerMembershipGuard } from '../identity-access/owner-membership.guard';
import { SessionGuard } from '../identity-access/session.guard';
import { CreateServiceOfferingDto } from './create-service-offering.dto';
import { ServiceCatalogService } from './service-catalog.service';

@ApiTags('Catálogo de serviços')
@ApiCookieAuth('nitivo_session')
@Controller('api/car-washes/:carWashId/services')
@UseGuards(SessionGuard, OwnerMembershipGuard)
export class ServiceCatalogController {
  constructor(private readonly serviceCatalog: ServiceCatalogService) {}

  @Get()
  @ApiOkResponse({ description: 'Serviços da lavação autorizada' })
  list(@Param('carWashId') carWashId: string) {
    return this.serviceCatalog.list(carWashId);
  }

  @Post()
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiCreatedResponse({ description: 'Serviço cadastrado' })
  create(
    @Param('carWashId') carWashId: string,
    @Body() input: CreateServiceOfferingDto,
  ) {
    return this.serviceCatalog.create(carWashId, input);
  }
}
