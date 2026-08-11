import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { QrService } from './qr.service';
import { Throttle } from '@nestjs/throttler';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generar')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generarQR(@Body('categoria') categoria: string) {
    return this.qrService.generarQR(categoria || 'Plástico');
  }

  @Get('verificar')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async verificarQR(@Query('codigo') codigo: string, @Query('firma') firma: string) {
    return this.qrService.verificarQR(codigo, firma);
  }
}
