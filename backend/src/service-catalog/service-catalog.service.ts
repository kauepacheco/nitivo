import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateServiceOfferingDto } from './create-service-offering.dto';

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
      data: {
        carWashId,
        name: input.name.trim(),
        priceInCents: input.priceInCents,
        durationInMinutes: input.durationInMinutes,
        active: input.active,
      },
      select: serviceOfferingView,
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
