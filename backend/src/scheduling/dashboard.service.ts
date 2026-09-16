import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DashboardQueryDto } from './dashboard.dto';
import {
  addDays,
  isRealDate,
  localDate,
  localDateTime,
} from './scheduling.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(carWashId: string, query: DashboardQueryDto) {
    const carWash = await this.prisma.carWash.findUniqueOrThrow({
      where: { id: carWashId },
      select: { timezone: true },
    });
    const today = localDate(new Date(Date.now()), carWash.timezone);
    const from = query.from ?? today;
    const to = query.to ?? today;
    if (!isRealDate(from) || !isRealDate(to) || from > to) {
      throw new BadRequestException('Período inválido');
    }
    const period = {
      startsAt: localDateTime(from, 0, carWash.timezone),
      endsBefore: localDateTime(addDays(to, 1), 0, carWash.timezone),
    };
    const where = {
      carWashId,
      startsAt: { gte: period.startsAt, lt: period.endsBefore },
    } as const;
    const [completed, canceled, noShow, completedValue] = await Promise.all([
      this.prisma.appointment.count({
        where: { ...where, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: { ...where, status: 'CANCELED' },
      }),
      this.prisma.appointment.count({
        where: { ...where, status: 'NO_SHOW' },
      }),
      this.prisma.appointment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { servicePriceInCents: true },
      }),
    ]);
    return {
      period: { from, to, timezone: carWash.timezone },
      criteria: {
        date: 'Data prevista do atendimento no fuso da lavação',
        status: 'Estado atual do agendamento',
        value: 'Preços históricos dos serviços concluídos',
      },
      completed,
      canceled,
      noShow,
      completedServicesValueInCents:
        completedValue._sum.servicePriceInCents ?? 0,
    };
  }
}
