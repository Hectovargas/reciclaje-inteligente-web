import { Module } from '@nestjs/common';
import { ClasificacionController } from './clasificacion.controller';
import { ClasificacionService } from './clasificacion.service';

@Module({
  controllers: [ClasificacionController],
  providers: [ClasificacionService],
  exports: [ClasificacionService],
})
export class ClasificacionModule {}
