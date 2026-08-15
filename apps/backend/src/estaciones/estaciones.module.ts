import { Module } from '@nestjs/common';
import { EstacionesController } from './estaciones.controller';
import { EstacionesService } from './estaciones.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EstacionesController],
  providers: [EstacionesService],
  exports: [EstacionesService],
})
export class EstacionesModule {}
