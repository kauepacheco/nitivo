import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export function configureApp(app: INestApplication) {
  const express = app.getHttpAdapter().getInstance() as {
    set(name: string, value: unknown): void;
  };
  // O deploy aprovado possui um único proxy reverso na frente da aplicação.
  express.set('trust proxy', 1);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  const openApi = new DocumentBuilder()
    .setTitle('Nitivo API')
    .setDescription('API do primeiro piloto do Nitivo')
    .setVersion('1.0')
    .addCookieAuth('nitivo_session')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, openApi));
}
