import { Module } from '@nestjs/common';
import { ClasificacionController } from './clasificacion.controller';
import { ClasificacionService } from './clasificacion.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [PrismaModule, QrModule],
  controllers: [ClasificacionController],
  providers: [ClasificacionService],
  exports: [ClasificacionService],
})
export class ClasificacionModule {}
