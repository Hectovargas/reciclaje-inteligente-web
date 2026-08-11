import { Module } from '@nestjs/common';
import { ClasificacionController } from './clasificacion.controller';
import { ClasificacionService } from './clasificacion.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClasificacionController],
  providers: [ClasificacionService],
  exports: [ClasificacionService],
})
export class ClasificacionModule {}
