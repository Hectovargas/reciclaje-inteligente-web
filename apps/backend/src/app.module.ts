import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ClasificacionModule } from './clasificacion/clasificacion.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QrModule } from './qr/qr.module';
import { BlockchainModule } from './blockchain/blockchain.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ClasificacionModule,
    DashboardModule,
    QrModule,
    BlockchainModule,
  ],
})
export class AppModule {}
