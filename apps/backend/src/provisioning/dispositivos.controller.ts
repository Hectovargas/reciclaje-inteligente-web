import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { ProvisionDeviceDto } from './dto/provision-device.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Dispositivos')
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  @Post('provision')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Aprovisionamiento y activación de estación ESP32 por token corto y dirección MAC',
    description:
      'Endpoint llamado por el microcontrolador ESP32 en su primer arranque para asociarse a la estación, capturar su MAC automáticamente y recibir credenciales de telemetría.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estación aprovisionada exitosamente. Retorna API key y configuración.',
  })
  @ApiResponse({
    status: 400,
    description: 'Token de aprovisionamiento ya utilizado o datos inválidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Token de aprovisionamiento no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'La dirección MAC ya está asociada a otra estación activa.',
  })
  @ApiResponse({
    status: 410,
    description: 'El token de aprovisionamiento ha expirado (+30 min sin uso).',
  })
  async provision(@Body() dto: ProvisionDeviceDto) {
    return this.provisioningService.provisionDevice(dto);
  }
}
