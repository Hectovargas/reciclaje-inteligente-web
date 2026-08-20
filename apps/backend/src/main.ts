// CleanCity API - Deployment Version 1.0.1 (0.0.0.0 Production Binding)
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
  const baseAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:8080',
  ];

  if (process.env.FRONTEND_URL) {
    const customOrigins = process.env.FRONTEND_URL.split(',').map((url) => url.trim());
    baseAllowedOrigins.push(...customOrigins);
  }

  // Security & CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cookie',
      'X-Station-Token',
    ],
    exposedHeaders: ['Set-Cookie'],
  });
  app.use(helmet({ crossOriginResourcePolicy: false }));
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

  // Root health probe for Railway / cloud load balancers
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.status(200).json({ status: 'ok', service: 'CleanCity API', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend de Reciclaje Inteligente corriendo en http://0.0.0.0:${port}`);
}
bootstrap();
