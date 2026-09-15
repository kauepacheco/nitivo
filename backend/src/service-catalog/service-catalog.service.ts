import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { lockScheduling } from '../scheduling/scheduling.service';
import {
  CreateServiceOfferingDto,
  UpdateServiceOfferingDto,
} from './service-offering.dto';
import { UpdatePublicProfileDto } from './public-profile.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  list(carWashId: string) {
    return this.prisma.serviceOffering.findMany({
      where: { carWashId },
      orderBy: { createdAt: 'asc' },
      select: serviceOfferingView,
    });
  }

  create(carWashId: string, input: CreateServiceOfferingDto) {
    return this.prisma.serviceOffering.create({
      data: { carWashId, ...serviceOfferingData(input) },
      select: serviceOfferingView,
    });
  }

  update(
    carWashId: string,
    serviceId: string,
    input: UpdateServiceOfferingDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await lockScheduling(transaction, carWashId);
      const current = await transaction.serviceOffering.findUnique({
        where: { id_carWashId: { id: serviceId, carWashId } },
        select: { id: true },
      });
      if (!current) throw new NotFoundException('Serviço não encontrado');
      return transaction.serviceOffering.update({
        where: { id_carWashId: { id: serviceId, carWashId } },
        data: serviceOfferingData(input),
        select: serviceOfferingView,
      });
    });
  }

  async getPublicPage(slug: string) {
    const carWash = await this.prisma.carWash.findUnique({
      where: { slug },
      select: {
        name: true,
        operationalContactPhone: true,
        services: {
          where: { active: true },
          orderBy: { createdAt: 'asc' },
          select: publicServiceOfferingView,
        },
      },
    });
    if (!carWash) return null;
    return carWash;
  }

  updatePublicProfile(carWashId: string, input: UpdatePublicProfileDto) {
    return this.prisma.carWash.update({
      where: { id: carWashId },
      data: { operationalContactPhone: input.operationalContactPhone },
      select: { operationalContactPhone: true },
    });
  }

  getPublicProfile(carWashId: string) {
    return this.prisma.carWash.findUniqueOrThrow({
      where: { id: carWashId },
      select: { operationalContactPhone: true },
    });
  }
}

const serviceOfferingView = {
  id: true,
  name: true,
  priceInCents: true,
  durationInMinutes: true,
  active: true,
} as const;

const publicServiceOfferingView = {
  id: true,
  name: true,
  priceInCents: true,
  durationInMinutes: true,
} as const;

function serviceOfferingData(input: CreateServiceOfferingDto) {
  return {
    name: input.name.trim(),
    priceInCents: input.priceInCents,
    durationInMinutes: input.durationInMinutes,
    active: input.active,
  };
}
