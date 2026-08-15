import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IotService } from './iot.service';
import { ActivarEstacionDto } from './dto/activar-estacion.dto';
import { PingIotDto } from './dto/ping-iot.dto';
import { TelemetriaDto } from './dto/telemetria.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('IoT')
@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Post('activar')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Activación Zero-Touch de estación ESP32 por MAC y provisioning token' })
  @ApiResponse({ status: 200, description: 'Estación activada exitosamente' })
  @ApiResponse({ status: 401, description: 'Token de aprovisionamiento o MAC inválidos' })
  async activar(@Body() dto: ActivarEstacionDto) {
    return this.iotService.activarEstacion(dto);
  }

  @Post('ping')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Heartbeat ping periódico desde microcontrolador ESP32' })
  @ApiResponse({ status: 200, description: 'Ping registrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  async ping(@Body() dto: PingIotDto) {
    return this.iotService.ping(dto);
  }

  @Post('telemetria')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Ingesta de telemetría de sensores ultrasónicos de nivel de llenado' })
  @ApiResponse({ status: 200, description: 'Telemetría guardada y estado de estación evaluado' })
  @ApiResponse({ status: 401, description: 'Credenciales de estación no autorizadas' })
  async registrarTelemetria(@Body() dto: TelemetriaDto) {
    return this.iotService.registrarTelemetria(dto);
  }
}
