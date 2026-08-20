import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
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
import { ZonesModule } from './zones/zones.module';
import { EstacionesModule } from './estaciones/estaciones.module';
import { IotModule } from './iot/iot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(loggerOptions),
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || process.env.REDIS_URL;
        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            return {
              connection: {
                host: parsed.hostname,
                port: Number(parsed.port) || 6379,
                username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
                password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
                tls: parsed.protocol === 'rediss:' ? {} : undefined,
                maxRetriesPerRequest: null,
              },
            };
          } catch {
            // Fallback if URL parsing fails
          }
        }

        return {
          connection: {
            host:
              configService.get<string>('REDIS_HOST') ||
              configService.get<string>('REDISHOST') ||
              '127.0.0.1',
            port: Number(
              configService.get<number>('REDIS_PORT') ||
              configService.get<number>('REDISPORT') ||
              6379,
            ),
            password:
              configService.get<string>('REDIS_PASSWORD') ||
              configService.get<string>('REDISPASSWORD') ||
              undefined,
            username:
              configService.get<string>('REDIS_USER') ||
              configService.get<string>('REDISUSER') ||
              undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    ClasificacionModule,
    DashboardModule,
    QrModule,
    BlockchainModule,
    ZonesModule,
    EstacionesModule,
    IotModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
