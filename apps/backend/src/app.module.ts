import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { loggerOptions } from './common/logger/logger.config';
import { PrismaModule } from './prisma/prisma.module';
import { ClasificacionModule } from './clasificacion/clasificacion.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QrModule } from './qr/qr.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(loggerOptions),
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    HealthModule,
    ClasificacionModule,
    DashboardModule,
    QrModule,
    BlockchainModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
