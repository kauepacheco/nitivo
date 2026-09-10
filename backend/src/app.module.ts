import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { IdentityAccessModule } from './identity-access/identity-access.module';
import { ServiceCatalogModule } from './service-catalog/service-catalog.module';
import { TeamAccessModule } from './team-access/team-access.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/api/{*path}', '/health', '/docs/{*path}'],
    }),
    DatabaseModule,
    IdentityAccessModule,
    ServiceCatalogModule,
    TeamAccessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
