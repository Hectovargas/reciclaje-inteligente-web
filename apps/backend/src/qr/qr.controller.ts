import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StationTokenGuard } from '../auth/guards/station-token.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QrService } from './qr.service';
import { GenerarQrDto } from './dto/generar-qr.dto';
import { ReclamarQrDto } from './dto/reclamar-qr.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('QR')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generar')
  @UseGuards(StationTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Generar token QR firmado criptográficamente desde estación de reciclaje' })
  @ApiResponse({ status: 201, description: 'Token QR generado y firmado con Keccak256/ECDSA' })
  @ApiResponse({ status: 401, description: 'Token de estación no válido o ausente' })
  async generarQR(@Body() dto: GenerarQrDto) {
    return this.qrService.generarQR(dto.categoria || 'Plástico', dto.stationId, dto.peso);
  }

  @Get('verificar')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Verificar validez, firma y estado de no-uso de un código QR' })
  @ApiQuery({ name: 'codigo', required: false, description: 'Código único del QR' })
  @ApiQuery({ name: 'token', required: false, description: 'Alias para código del QR' })
  @ApiQuery({ name: 'firma', required: false, description: 'Firma ECDSA para verificación adicional' })
  @ApiResponse({ status: 200, description: 'Código QR verificado exitosamente' })
  @ApiResponse({ status: 400, description: 'Código expirado o ya usado' })
  @ApiResponse({ status: 404, description: 'Código QR no encontrado' })
  async verificarQR(
    @Query('codigo') codigo?: string,
    @Query('token') token?: string,
    @Query('firma') firma?: string,
  ) {
    const targetCode = codigo || token || '';
    return this.qrService.verificarQR(targetCode, firma);
  }

  @Get('verificar/:token')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Verificar código QR mediante parámetro de ruta' })
  @ApiResponse({ status: 200, description: 'Código QR verificado exitosamente' })
  @ApiResponse({ status: 400, description: 'Código expirado o ya usado' })
  @ApiResponse({ status: 404, description: 'Código QR no encontrado' })
  async verificarQRParam(
    @Param('token') token: string,
    @Query('firma') firma?: string,
  ) {
    return this.qrService.verificarQR(token, firma);
  }

  @Post('reclamar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Reclamar puntos de reciclaje asociados a un código QR (atómico)' })
  @ApiResponse({ status: 200, description: 'Puntos reclamados y evento blockchain encolado exitosamente' })
  @ApiResponse({ status: 401, description: 'Usuario no autenticado' })
  @ApiResponse({ status: 404, description: 'Código QR no encontrado' })
  @ApiResponse({ status: 409, description: 'Código QR ya reclamado previamente (replay mitigation)' })
  async reclamarQR(@Req() req: any, @Body() dto: ReclamarQrDto) {
    const user = req.user;
    return this.qrService.reclamarQR(user, dto);
  }
}
