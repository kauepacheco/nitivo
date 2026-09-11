import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateBoxDto,
  UpdateBoxDto,
  AvailabilityQueryDto,
  UpdateSchedulingSettingsDto,
} from './scheduling.dto';

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(carWashId: string) {
    const settings = await this.prisma.carWash.findUniqueOrThrow({
      where: { id: carWashId },
      select: {
        timezone: true,
        minimumBookingNoticeMinutes: true,
        bookingHorizonDays: true,
        changeNoticeMinutes: true,
        slotIntervalMinutes: true,
        weeklyHours: {
          orderBy: { weekday: 'asc' },
          select: {
            weekday: true,
            opensAtMinute: true,
            closesAtMinute: true,
          },
        },
        boxes: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, active: true },
        },
      },
    });
    return {
      ...settings,
      weeklyHours: settings.weeklyHours.map((hours) => ({
        weekday: hours.weekday,
        opensAt: formatMinuteOfDay(hours.opensAtMinute),
        closesAt: formatMinuteOfDay(hours.closesAtMinute),
      })),
    };
  }

  createBox(carWashId: string, input: CreateBoxDto) {
    return this.prisma.box.create({
      data: { carWashId, name: input.name.trim() },
      select: { id: true, name: true, active: true },
    });
  }

  async updateSettings(carWashId: string, input: UpdateSchedulingSettingsDto) {
    for (const hours of input.weeklyHours) {
      if (parseMinuteOfDay(hours.opensAt) >= parseMinuteOfDay(hours.closesAt)) {
        throw new BadRequestException(
          'O horário de fechamento deve ser após a abertura',
        );
      }
    }
    await this.prisma.$transaction(async (transaction) => {
      await lockScheduling(transaction, carWashId);
      const carWash = await transaction.carWash.findUniqueOrThrow({
        where: { id: carWashId },
        select: { timezone: true },
      });
      const futureAppointments = await transaction.appointment.findMany({
        where: {
          carWashId,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          startsAt: { gte: new Date(Date.now()) },
        },
        select: { id: true, startsAt: true, endsAt: true },
      });
      const conflictingAppointments = futureAppointments.filter(
        (appointment) =>
          !appointmentFitsWeeklyHours(
            appointment,
            input.weeklyHours,
            carWash.timezone,
          ),
      );
      if (conflictingAppointments.length > 0) {
        throw schedulingConflict(conflictingAppointments);
      }
      await transaction.carWash.update({
        where: { id: carWashId },
        data: {
          minimumBookingNoticeMinutes: input.minimumBookingNoticeMinutes,
          bookingHorizonDays: input.bookingHorizonDays,
          changeNoticeMinutes: input.changeNoticeMinutes,
          slotIntervalMinutes: input.slotIntervalMinutes,
        },
      });
      await transaction.weeklyOpeningHour.deleteMany({ where: { carWashId } });
      if (input.weeklyHours.length > 0) {
        await transaction.weeklyOpeningHour.createMany({
          data: input.weeklyHours.map((hours) => ({
            carWashId,
            weekday: hours.weekday,
            opensAtMinute: parseMinuteOfDay(hours.opensAt),
            closesAtMinute: parseMinuteOfDay(hours.closesAt),
          })),
        });
      }
    });
    return this.getSettings(carWashId);
  }

  async updateBox(carWashId: string, boxId: string, input: UpdateBoxDto) {
    return this.prisma.$transaction(async (transaction) => {
      await lockScheduling(transaction, carWashId);
      const box = await transaction.box.findUnique({
        where: { id_carWashId: { id: boxId, carWashId } },
        select: { id: true, name: true, active: true },
      });
      if (!box) throw new NotFoundException('Box não encontrado');
      if (box.active && !input.active) {
        const conflicts = await transaction.appointment.findMany({
          where: {
            carWashId,
            boxId,
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
            startsAt: { gte: new Date(Date.now()) },
          },
          select: { id: true, startsAt: true, endsAt: true },
        });
        if (conflicts.length > 0) throw schedulingConflict(conflicts);
      }
      return transaction.box.update({
        where: { id_carWashId: { id: boxId, carWashId } },
        data: { active: input.active },
        select: { id: true, name: true, active: true },
      });
    });
  }

  async getAvailability(
    slug: string,
    query: AvailabilityQueryDto,
    database: Prisma.TransactionClient = this.prisma,
  ) {
    const carWash = await database.carWash.findUnique({
      where: { slug },
      select: {
        id: true,
        timezone: true,
        minimumBookingNoticeMinutes: true,
        bookingHorizonDays: true,
        slotIntervalMinutes: true,
        boxes: {
          where: { active: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        },
        weeklyHours: {
          where: { weekday: weekday(query.date) },
          select: { opensAtMinute: true, closesAtMinute: true },
        },
        services: {
          where: { id: query.serviceId, active: true },
          select: { id: true, durationInMinutes: true },
        },
      },
    });
    if (!carWash || carWash.services.length === 0) {
      throw new NotFoundException('Lavação ou serviço não encontrado');
    }

    const today = localDate(new Date(Date.now()), carWash.timezone);
    if (
      !isRealDate(query.date) ||
      query.date < today ||
      query.date > addDays(today, carWash.bookingHorizonDays)
    ) {
      throw new BadRequestException('Data fora do período disponível');
    }
    const response = {
      date: query.date,
      timezone: carWash.timezone,
      slots: [] as Array<{ startsAt: string; endsAt: string }>,
    };
    const hours = carWash.weeklyHours[0];
    if (!hours || carWash.boxes.length === 0) return response;

    const service = carWash.services[0];
    const opening = localDateTime(
      query.date,
      hours.opensAtMinute,
      carWash.timezone,
    );
    const closing = localDateTime(
      query.date,
      hours.closesAtMinute,
      carWash.timezone,
    );
    const occupied = await database.appointment.findMany({
      where: {
        carWashId: carWash.id,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        startsAt: { lt: closing },
        endsAt: { gt: opening },
      },
      select: { boxId: true, startsAt: true, endsAt: true },
    });
    const earliest = new Date(
      Date.now() + carWash.minimumBookingNoticeMinutes * 60_000,
    );
    for (
      let minute = hours.opensAtMinute;
      minute + service.durationInMinutes <= hours.closesAtMinute;
      minute += carWash.slotIntervalMinutes
    ) {
      const startsAt = localDateTime(query.date, minute, carWash.timezone);
      if (startsAt < earliest) continue;
      const endsAt = localDateTime(
        query.date,
        minute + service.durationInMinutes,
        carWash.timezone,
      );
      const occupiedBoxIds = new Set(
        occupied
          .filter(
            (appointment) =>
              appointment.startsAt < endsAt && appointment.endsAt > startsAt,
          )
          .map((appointment) => appointment.boxId),
      );
      if (carWash.boxes.some((box) => !occupiedBoxIds.has(box.id))) {
        response.slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        });
      }
    }
    return response;
  }
}

function parseMinuteOfDay(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function formatMinuteOfDay(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function weekday(date: string) {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

export function localDate(value: Date, timezone: string) {
  const parts = dateParts(value, timezone);
  return `${parts.year}-${twoDigits(parts.month)}-${twoDigits(parts.day)}`;
}

export function localDateTime(
  date: string,
  minuteOfDay: number,
  timezone: string,
) {
  const base = new Date(`${date}T00:00:00.000Z`);
  base.setUTCMinutes(minuteOfDay);
  const desired = {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
    hour: base.getUTCHours(),
    minute: base.getUTCMinutes(),
  };
  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let instant = desiredAsUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = dateParts(new Date(instant), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    instant += desiredAsUtc - actualAsUtc;
  }
  return new Date(instant);
}

function dateParts(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
  };
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function isRealDate(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function appointmentFitsWeeklyHours(
  appointment: { startsAt: Date; endsAt: Date },
  weeklyHours: Array<{ weekday: number; opensAt: string; closesAt: string }>,
  timezone: string,
) {
  const start = dateParts(appointment.startsAt, timezone);
  const end = dateParts(appointment.endsAt, timezone);
  const startDate = `${start.year}-${twoDigits(start.month)}-${twoDigits(start.day)}`;
  const endDate = `${end.year}-${twoDigits(end.month)}-${twoDigits(end.day)}`;
  const hours = weeklyHours.find(
    (candidate) => candidate.weekday === weekday(startDate),
  );
  if (!hours) return false;
  const startMinute = start.hour * 60 + start.minute;
  const closesAtMinute = parseMinuteOfDay(hours.closesAt);
  const endsAtNextMidnight =
    closesAtMinute === 1440 &&
    endDate === addDays(startDate, 1) &&
    end.hour === 0 &&
    end.minute === 0;
  if (startDate !== endDate && !endsAtNextMidnight) return false;
  const endMinute = endsAtNextMidnight ? 1440 : end.hour * 60 + end.minute;
  return (
    startMinute >= parseMinuteOfDay(hours.opensAt) &&
    endMinute <= closesAtMinute
  );
}

function schedulingConflict(
  appointments: Array<{ id: string; startsAt: Date; endsAt: Date }>,
) {
  return new ConflictException({
    statusCode: 409,
    message: 'A mudança conflita com reservas futuras',
    conflicts: appointments.map((appointment) => ({
      appointmentId: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
    })),
  });
}

// A mesma trava serializa confirmação e alterações que podem retirar disponibilidade.
export async function lockScheduling(
  transaction: Prisma.TransactionClient,
  carWashId: string,
) {
  await transaction.$queryRaw`SELECT "id" FROM "CarWash" WHERE "id" = ${carWashId} FOR UPDATE`;
}
