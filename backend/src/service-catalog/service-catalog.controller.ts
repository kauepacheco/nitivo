import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CsrfGuard } from '../identity-access/csrf.guard';
import { OwnerMembershipGuard } from '../identity-access/owner-membership.guard';
import { SessionGuard } from '../identity-access/session.guard';
import { CreateServiceOfferingDto } from './create-service-offering.dto';
import { ServiceCatalogService } from './service-catalog.service';
import {
  PublicCarWashPageDto,
  PublicProfileDto,
  UpdatePublicProfileDto,
} from './public-profile.dto';

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

@ApiTags('Informações públicas da lavação')
@ApiCookieAuth('nitivo_session')
@Controller('api/car-washes/:carWashId/public-profile')
@UseGuards(SessionGuard, OwnerMembershipGuard)
export class PublicProfileController {
  constructor(private readonly serviceCatalog: ServiceCatalogService) {}

  @Get()
  @ApiOkResponse({ type: PublicProfileDto })
  get(@Param('carWashId') carWashId: string) {
    return this.serviceCatalog.getPublicProfile(carWashId);
  }

  @Patch()
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiOkResponse({ type: PublicProfileDto })
  update(
    @Param('carWashId') carWashId: string,
    @Body() input: UpdatePublicProfileDto,
  ) {
    return this.serviceCatalog.updatePublicProfile(carWashId, input);
  }
}

@ApiTags('Página pública')
@Controller('api/public/car-washes')
export class PublicServiceCatalogController {
  constructor(private readonly serviceCatalog: ServiceCatalogService) {}

  @Get(':slug')
  @ApiOkResponse({
    description: 'Informações públicas e serviços ativos',
    type: PublicCarWashPageDto,
  })
  @ApiNotFoundResponse({ description: 'Lavação não encontrada' })
  async getPage(@Param('slug') slug: string): Promise<PublicCarWashPageDto> {
    const page = await this.serviceCatalog.getPublicPage(slug);
    if (!page) throw new NotFoundException('Lavação não encontrada');
    return page;
  }
}
