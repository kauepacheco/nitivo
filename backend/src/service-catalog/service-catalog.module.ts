import { Module } from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';
import { ServiceCatalogController } from './service-catalog.controller';
import { IdentityAccessModule } from '../identity-access/identity-access.module';

@Module({
  imports: [IdentityAccessModule],
  providers: [ServiceCatalogService],
  controllers: [ServiceCatalogController],
})
export class ServiceCatalogModule {}
