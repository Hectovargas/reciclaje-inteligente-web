import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClasificacionController } from './clasificacion.controller';
import { ClasificacionService } from './clasificacion.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [PrismaModule, QrModule, HttpModule.register({ timeout: 15000 }),],
  controllers: [ClasificacionController],
  providers: [ClasificacionService],
  exports: [ClasificacionService],
})
export class ClasificacionModule {}
