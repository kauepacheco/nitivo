import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Post,
  Put,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { CsrfGuard } from '../identity-access/csrf.guard';
import { OwnerMembershipGuard } from '../identity-access/owner-membership.guard';
import { SessionGuard } from '../identity-access/session.guard';
import { SchedulingService } from './scheduling.service';
import {
  CreateBoxDto,
  AvailabilityDto,
  BoxDto,
  SchedulingSettingsDto,
  UpdateBoxDto,
  AvailabilityQueryDto,
  UpdateSchedulingSettingsDto,
  UpsertOperationalExceptionDto,
  CreateAvailabilityBlockDto,
  OperationalExceptionDto,
  AvailabilityBlockDto,
} from './scheduling.dto';

@ApiTags('Configuração da agenda')
@ApiCookieAuth('nitivo_session')
@Controller('api/car-washes/:carWashId/scheduling-settings')
@UseGuards(SessionGuard, OwnerMembershipGuard)
export class SchedulingController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get()
  @ApiOkResponse({
    description: 'Configuração da agenda da lavação autorizada',
    type: SchedulingSettingsDto,
  })
  get(@Param('carWashId') carWashId: string) {
    return this.scheduling.getSettings(carWashId);
  }

  @Put()
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiOkResponse({
    description: 'Configuração da agenda atualizada',
    type: SchedulingSettingsDto,
  })
  @ApiConflictResponse({ description: 'Reservas futuras em conflito' })
  update(
    @Param('carWashId') carWashId: string,
    @Body() input: UpdateSchedulingSettingsDto,
  ) {
    return this.scheduling.updateSettings(carWashId, input);
  }

  @Put('exceptions/:date')
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiOkResponse({ type: OperationalExceptionDto })
  @ApiConflictResponse({ description: 'Reservas futuras em conflito' })
  upsertException(
    @Param('carWashId') carWashId: string,
    @Param('date') date: string,
    @Body() input: UpsertOperationalExceptionDto,
  ) {
    return this.scheduling.upsertException(carWashId, date, input);
  }

  @Delete('exceptions/:date')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiNoContentResponse({ description: 'Exceção removida' })
  async deleteException(
    @Param('carWashId') carWashId: string,
    @Param('date') date: string,
  ) {
    await this.scheduling.deleteException(carWashId, date);
  }

  @Post('blocks')
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiCreatedResponse({ type: AvailabilityBlockDto })
  @ApiConflictResponse({ description: 'Reservas futuras em conflito' })
  createBlock(
    @Param('carWashId') carWashId: string,
    @Body() input: CreateAvailabilityBlockDto,
  ) {
    return this.scheduling.createBlock(carWashId, input);
  }

  @Delete('blocks/:blockId')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiNoContentResponse({ description: 'Bloqueio removido' })
  async deleteBlock(
    @Param('carWashId') carWashId: string,
    @Param('blockId') blockId: string,
  ) {
    await this.scheduling.deleteBlock(carWashId, blockId);
  }
}

@ApiTags('Boxes')
@ApiCookieAuth('nitivo_session')
@Controller('api/car-washes/:carWashId/boxes')
@UseGuards(SessionGuard, OwnerMembershipGuard)
export class BoxesController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Post()
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiCreatedResponse({ description: 'Box cadastrado', type: BoxDto })
  create(@Param('carWashId') carWashId: string, @Body() input: CreateBoxDto) {
    return this.scheduling.createBox(carWashId, input);
  }

  @Patch(':boxId')
  @UseGuards(CsrfGuard)
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiOkResponse({ description: 'Situação do box atualizada', type: BoxDto })
  @ApiConflictResponse({ description: 'Reservas futuras em conflito' })
  update(
    @Param('carWashId') carWashId: string,
    @Param('boxId') boxId: string,
    @Body() input: UpdateBoxDto,
  ) {
    return this.scheduling.updateBox(carWashId, boxId, input);
  }
}

@ApiTags('Disponibilidade pública')
@Controller('api/public/car-washes/:slug/availability')
export class PublicAvailabilityController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get()
  @ApiOkResponse({
    description: 'Horários disponíveis para o serviço e data',
    type: AvailabilityDto,
  })
  get(@Param('slug') slug: string, @Query() query: AvailabilityQueryDto) {
    return this.scheduling.getAvailability(slug, query);
  }
}
