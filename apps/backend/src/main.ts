import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logging
  app.useLogger(app.get(Logger));

  // Allowed CORS origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:8080',
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  // Security
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.use(helmet());
  app.use(cookieParser());

  // Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Pipes & Filters
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('CleanCity Reciclaje Inteligente API')
    .setDescription('API REST de la plataforma de reciclaje inteligente CleanCity')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend de Reciclaje Inteligente corriendo en el puerto: ${port}`);
}
bootstrap();
