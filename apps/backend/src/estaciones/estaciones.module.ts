import { Module } from '@nestjs/common';
import { EstacionesController } from './estaciones.controller';
import { EstacionesService } from './estaciones.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';

@Module({
  imports: [PrismaModule, ProvisioningModule],
  controllers: [EstacionesController],
  providers: [EstacionesService],
  exports: [EstacionesService],
})
export class EstacionesModule {}
