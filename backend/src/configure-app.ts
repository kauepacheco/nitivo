import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export function configureApp(app: INestApplication) {
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
