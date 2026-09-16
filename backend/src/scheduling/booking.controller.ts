import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Header,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import type { AuthenticatedRequest } from '../identity-access/auth.types';
import { CsrfGuard } from '../identity-access/csrf.guard';
import { SessionGuard } from '../identity-access/session.guard';
import {
  AgendaDto,
  AgendaAppointmentDto,
  AgendaQueryDto,
  BookingReceiptDto,
  ChangeAppointmentStatusDto,
  CustomerVehicleDto,
  CreateBookingDto,
  CreateWalkInDto,
  UpdateCustomerVehicleDto,
} from './booking.dto';
import { BookingService } from './booking.service';
import { AvailabilityDto, AvailabilityQueryDto } from './scheduling.dto';

@Injectable()
export class BookingThrottleGuard implements CanActivate {
  constructor(private readonly bookings: BookingService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    await this.bookings.consumeAttempt(
      request.ip ?? request.socket.remoteAddress ?? 'unknown',
    );
    return true;
  }
}

@Injectable()
export class TeamMembershipGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      !request.authSession?.memberships.some(
        (membership) =>
          membership.carWashId === request.params.carWashId &&
          (membership.role === 'OWNER' || membership.role === 'EMPLOYEE'),
      )
    ) {
      throw new NotFoundException('Lavação não encontrada');
    }
    return true;
  }
}

@ApiTags('Reserva pública')
@Controller('api/public/car-washes/:slug/appointments')
export class PublicBookingController {
  constructor(private readonly bookings: BookingService) {}
  @Post()
  @UseGuards(BookingThrottleGuard)
  @Header('Cache-Control', 'no-store')
  @ApiCreatedResponse({
    type: BookingReceiptDto,
    description:
      'Reserva confirmada ou reenvio idêntico em até 15 minutos. Sem consulta pública posterior.',
  })
  @ApiConflictResponse({
    description:
      'Horário indisponível ou tentativa já utilizada com outro corpo/expirada',
  })
  @ApiResponse({
    status: 429,
    description: 'Até 20 tentativas por IP a cada 15 minutos',
  })
  confirm(@Param('slug') slug: string, @Body() input: CreateBookingDto) {
    return this.bookings.confirm(slug, input);
  }
}

@ApiTags('Agenda da equipe')
@ApiCookieAuth('nitivo_session')
@Controller('api/car-washes/:carWashId/appointments')
@UseGuards(SessionGuard, TeamMembershipGuard)
export class TeamAgendaController {
  constructor(private readonly bookings: BookingService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: AgendaDto })
  get(@Param('carWashId') carWashId: string, @Query() query: AgendaQueryDto) {
    return this.bookings.agenda(carWashId, query.date);
  }

  @Get('walk-in-availability')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    type: AvailabilityDto,
    description: 'Horários para encaixe, sem antecedência do autoagendamento',
  })
  getWalkInAvailability(
    @Param('carWashId') carWashId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.bookings.getWalkInAvailability(carWashId, query);
  }

  @Post('walk-ins')
  @UseGuards(CsrfGuard)
  @Header('Cache-Control', 'no-store')
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiCreatedResponse({
    type: AgendaAppointmentDto,
    description: 'Encaixe confirmado com origem e autoria da equipe',
  })
  @ApiConflictResponse({ description: 'Horário indisponível' })
  createWalkIn(
    @Param('carWashId') carWashId: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateWalkInDto,
  ) {
    return this.bookings.createWalkIn(
      carWashId,
      request.authSession!.userId,
      input,
    );
  }

  @Patch(':appointmentId/customer-vehicle')
  @UseGuards(CsrfGuard)
  @Header('Cache-Control', 'no-store')
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiOkResponse({
    type: CustomerVehicleDto,
    description: 'Dados operacionais de cliente e veículo corrigidos',
  })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado' })
  updateCustomerVehicle(
    @Param('carWashId') carWashId: string,
    @Param('appointmentId') appointmentId: string,
    @Body() input: UpdateCustomerVehicleDto,
  ) {
    return this.bookings.updateCustomerVehicle(carWashId, appointmentId, input);
  }

  @Patch(':appointmentId/status')
  @UseGuards(CsrfGuard)
  @Header('Cache-Control', 'no-store')
  @ApiHeader({ name: 'x-csrf-token', required: true })
  @ApiOkResponse({
    type: AgendaAppointmentDto,
    description:
      'Estado do atendimento atualizado com autoria, momento e metadados do cancelamento quando aplicável',
  })
  @ApiConflictResponse({ description: 'Transição de estado inválida' })
  @ApiNotFoundResponse({ description: 'Agendamento não encontrado' })
  changeStatus(
    @Param('carWashId') carWashId: string,
    @Param('appointmentId') appointmentId: string,
    @Req() request: AuthenticatedRequest,
    @Body() input: ChangeAppointmentStatusDto,
  ) {
    return this.bookings.changeStatus(
      carWashId,
      appointmentId,
      request.authSession!.userId,
      input,
    );
  }
}
