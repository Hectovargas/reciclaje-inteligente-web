import { Module } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { DispositivosController } from './dispositivos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DispositivosController],
  providers: [ProvisioningService],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
