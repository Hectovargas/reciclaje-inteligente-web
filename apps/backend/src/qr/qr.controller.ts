import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generar')
  async generarQR(@Body('categoria') categoria: string) {
    return this.qrService.generarQR(categoria || 'Plástico');
  }

  @Get('verificar')
  async verificarQR(@Query('codigo') codigo: string, @Query('firma') firma: string) {
    return this.qrService.verificarQR(codigo, firma);
  }
}
