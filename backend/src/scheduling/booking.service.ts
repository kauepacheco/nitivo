import {
  BadRequestException,
  ConflictException,
  HttpException,
  ServiceUnavailableException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { hashSecret } from '../identity-access/hash-secret';
import {
  CreateBookingDto,
  CreateWalkInDto,
  UpdateCustomerVehicleDto,
} from './booking.dto';
import {
  addDays,
  isRealDate,
  localDate,
  localDateTime,
  lockScheduling,
  SchedulingService,
} from './scheduling.service';
import { AvailabilityQueryDto } from './scheduling.dto';

const agendaSelection = {
  id: true,
  startsAt: true,
  endsAt: true,
  serviceName: true,
  servicePriceInCents: true,
  serviceDurationInMinutes: true,
  status: true,
  origin: true,
  createdAt: true,
  createdBy: {
    select: { id: true, user: { select: { email: true } } },
  },
  customer: { select: { name: true, phone: true } },
  vehicle: { select: { plate: true } },
  box: { select: { name: true } },
} satisfies Prisma.AppointmentSelect;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduling: SchedulingService,
  ) {}

  async confirm(slug: string, input: CreateBookingDto) {
    const startsAt = parseStartsAt(input.startsAt);
    return this.prisma
      .$transaction(async (tx) => {
        const tenant = await tx.carWash.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (!tenant) throw new NotFoundException('Lavação não encontrada');
        await lockScheduling(tx, tenant.id);
        const carWash = await tx.carWash.findUniqueOrThrow({
          where: { id: tenant.id },
        });
        const attemptHash = hashSecret(input.attemptId);
        const requestHash = hashSecret(
          JSON.stringify([
            input.serviceId,
            input.startsAt,
            input.name,
            input.phone,
            input.plate,
          ]),
        );
        const previous = await tx.appointment.findUnique({
          where: {
            carWashId_attemptHash: { carWashId: carWash.id, attemptHash },
          },
        });
        if (previous) {
          if (
            previous.requestHash !== requestHash ||
            Date.now() - previous.createdAt.getTime() > 15 * 60_000
          ) {
            throw new ConflictException(
              'Tentativa já utilizada. Confira o comprovante ou contate a lavação',
            );
          }
          return receipt(previous, carWash);
        }
        const { endsAt, service, unavailableMessage } =
          await this.resolveAppointmentSlot(
            tx,
            carWash,
            input,
            startsAt,
            'PUBLIC',
          );
        const appointment = await createAppointment(tx, {
          carWashId: carWash.id,
          service,
          startsAt,
          endsAt,
          customer: input,
          source: { origin: 'PUBLIC', attemptHash, requestHash },
          unavailableMessage,
        });
        return receipt(appointment, carWash);
      })
      .catch((error: unknown) => {
        if (error instanceof HttpException) throw error;
        // Erros do ORM podem conter argumentos pessoais: não encaminhar ao logger HTTP.
        throw new ServiceUnavailableException(
          'Não foi possível confirmar agora. Reenvie a mesma tentativa',
        );
      });
  }

  async agenda(carWashId: string, date?: string) {
    const carWash = await this.prisma.carWash.findUniqueOrThrow({
      where: { id: carWashId },
      select: { timezone: true },
    });
    const day = date ?? localDate(new Date(Date.now()), carWash.timezone);
    if (!isRealDate(day)) throw new BadRequestException('Data inválida');
    const [appointments, upcoming, services] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          carWashId,
          startsAt: {
            gte: localDateTime(day, 0, carWash.timezone),
            lt: localDateTime(addDays(day, 1), 0, carWash.timezone),
          },
        },
        select: agendaSelection,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.appointment.findMany({
        where: {
          carWashId,
          status: 'CONFIRMED',
          startsAt: { gte: new Date(Date.now()) },
        },
        select: agendaSelection,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        take: 20,
      }),
      this.prisma.serviceOffering.findMany({
        where: { carWashId, active: true },
        select: {
          id: true,
          name: true,
          priceInCents: true,
          durationInMinutes: true,
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return {
      date: day,
      timezone: carWash.timezone,
      appointments,
      upcoming,
      services,
    };
  }

  async getWalkInAvailability(carWashId: string, query: AvailabilityQueryDto) {
    const carWash = await this.prisma.carWash.findUniqueOrThrow({
      where: { id: carWashId },
      select: { slug: true },
    });
    return this.scheduling.getWalkInAvailability(carWash.slug, query);
  }

  async createWalkIn(
    carWashId: string,
    createdByUserId: string,
    input: CreateWalkInDto,
  ) {
    const startsAt = parseStartsAt(input.startsAt);
    return this.prisma
      .$transaction(async (tx) => {
        await lockScheduling(tx, carWashId);
        const creator = await tx.membership.findUnique({
          where: {
            userId_carWashId: { userId: createdByUserId, carWashId },
          },
          select: { id: true, status: true },
        });
        if (!creator || creator.status !== 'ACTIVE') {
          throw new NotFoundException('Lavação não encontrada');
        }
        const carWash = await tx.carWash.findUniqueOrThrow({
          where: { id: carWashId },
        });
        const { endsAt, service, unavailableMessage } =
          await this.resolveAppointmentSlot(
            tx,
            carWash,
            input,
            startsAt,
            'TEAM',
          );
        return createAppointment(tx, {
          carWashId,
          service,
          startsAt,
          endsAt,
          customer: input,
          source: { origin: 'TEAM', createdByMembershipId: creator.id },
          unavailableMessage,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof HttpException) throw error;
        throw new ServiceUnavailableException(
          'Não foi possível registrar o encaixe',
        );
      });
  }

  private async resolveAppointmentSlot(
    tx: Prisma.TransactionClient,
    carWash: { id: string; slug: string; timezone: string },
    input: { serviceId: string; startsAt: string },
    startsAt: Date,
    origin: 'PUBLIC' | 'TEAM',
  ) {
    const query = {
      serviceId: input.serviceId,
      date: localDate(startsAt, carWash.timezone),
    };
    const policy =
      origin === 'PUBLIC'
        ? {
            availability: () =>
              this.scheduling.getAvailability(carWash.slug, query, tx),
            unavailableMessage:
              'Horário indisponível. Consulte os horários novamente',
          }
        : {
            availability: () =>
              this.scheduling.getWalkInAvailability(carWash.slug, query, tx),
            unavailableMessage: 'Horário indisponível',
          };
    const availability = await policy.availability();
    const slot = availability.slots.find(
      (candidate) => candidate.startsAt === input.startsAt,
    );
    if (!slot) {
      throw new ConflictException(policy.unavailableMessage);
    }
    const service = await tx.serviceOffering.findUniqueOrThrow({
      where: {
        id_carWashId: { id: input.serviceId, carWashId: carWash.id },
      },
    });
    return {
      endsAt: new Date(slot.endsAt),
      service,
      unavailableMessage: policy.unavailableMessage,
    };
  }

  async updateCustomerVehicle(
    carWashId: string,
    appointmentId: string,
    input: UpdateCustomerVehicleDto,
  ) {
    return this.prisma
      .$transaction(async (tx) => {
        const appointment = await tx.appointment.findFirst({
          where: {
            id: appointmentId,
            carWashId,
            customerId: { not: null },
            vehicleId: { not: null },
          },
          select: { customerId: true, vehicleId: true },
        });
        if (!appointment?.customerId || !appointment.vehicleId)
          throw new NotFoundException('Agendamento não encontrado');
        const customer = await tx.customer.update({
          where: {
            id_carWashId: { id: appointment.customerId, carWashId },
          },
          data: { name: input.name, phone: input.phone },
          select: { name: true, phone: true },
        });
        const vehicle = await tx.vehicle.update({
          where: {
            id_customerId_carWashId: {
              id: appointment.vehicleId,
              customerId: appointment.customerId,
              carWashId,
            },
          },
          data: { plate: input.plate },
          select: { plate: true },
        });
        return { customer, vehicle };
      })
      .catch((error: unknown) => {
        if (error instanceof HttpException) throw error;
        // Não encaminhar argumentos pessoais do ORM ao logger HTTP.
        throw new ServiceUnavailableException(
          'Não foi possível atualizar os dados do atendimento',
        );
      });
  }

  // Limite atômico: inclui sucessos, erros e reenvios, sem persistir endereço IP bruto.
  async consumeAttempt(ip: string) {
    const key = `public-booking:${hashSecret(ip)}`;
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
      const now = new Date();
      const current = await tx.authenticationThrottle.findUnique({
        where: { key },
      });
      const fresh =
        !current ||
        now.getTime() - current.windowStartedAt.getTime() >= 15 * 60_000;
      if (!fresh && current.failedAttempts >= 20)
        throw new HttpException(
          'Muitas tentativas. Tente novamente em 15 minutos',
          429,
        );
      await tx.authenticationThrottle.upsert({
        where: { key },
        create: { key, failedAttempts: 1, windowStartedAt: now },
        update: {
          failedAttempts: fresh ? 1 : current.failedAttempts + 1,
          windowStartedAt: fresh ? now : current.windowStartedAt,
        },
      });
      await tx.authenticationThrottle.deleteMany({
        where: {
          key: { startsWith: 'public-booking:' },
          windowStartedAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) },
        },
      });
    });
  }
}

function parseStartsAt(value: string) {
  const startsAt = new Date(value);
  if (Number.isNaN(startsAt.getTime()) || startsAt.toISOString() !== value) {
    throw new BadRequestException('Horário inválido');
  }
  return startsAt;
}

async function createAppointment(
  tx: Prisma.TransactionClient,
  input: {
    carWashId: string;
    service: {
      id: string;
      name: string;
      priceInCents: number;
      durationInMinutes: number;
    };
    startsAt: Date;
    endsAt: Date;
    customer: { name: string; phone: string; plate: string };
    source:
      | { origin: 'PUBLIC'; attemptHash: string; requestHash: string }
      | { origin: 'TEAM'; createdByMembershipId: string };
    unavailableMessage: string;
  },
) {
  const box = await tx.box.findFirst({
    where: {
      carWashId: input.carWashId,
      active: true,
      appointments: {
        none: {
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          startsAt: { lt: input.endsAt },
          endsAt: { gt: input.startsAt },
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  if (!box) throw new ConflictException(input.unavailableMessage);
  const customer = await tx.customer.create({
    data: {
      carWashId: input.carWashId,
      name: input.customer.name,
      phone: input.customer.phone,
    },
  });
  const vehicle = await tx.vehicle.create({
    data: {
      carWashId: input.carWashId,
      customerId: customer.id,
      plate: input.customer.plate,
    },
  });
  return tx.appointment.create({
    data: {
      carWashId: input.carWashId,
      boxId: box.id,
      serviceOfferingId: input.service.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      serviceName: input.service.name,
      servicePriceInCents: input.service.priceInCents,
      serviceDurationInMinutes: input.service.durationInMinutes,
      createdAt: new Date(Date.now()),
      ...input.source,
    },
    select: agendaSelection,
  });
}

function receipt(
  appointment: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    serviceName: string;
    servicePriceInCents: number;
    serviceDurationInMinutes: number;
    status: string;
  },
  carWash: {
    name: string;
    operationalContactPhone: string | null;
    timezone: string;
    changeNoticeMinutes: number;
  },
) {
  return {
    id: appointment.id,
    carWashName: carWash.name,
    operationalContactPhone: carWash.operationalContactPhone,
    timezone: carWash.timezone,
    changeNoticeMinutes: carWash.changeNoticeMinutes,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    serviceName: appointment.serviceName,
    servicePriceInCents: appointment.servicePriceInCents,
    serviceDurationInMinutes: appointment.serviceDurationInMinutes,
    status: appointment.status,
  };
}
