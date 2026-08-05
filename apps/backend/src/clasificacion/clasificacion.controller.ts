import { Controller, Post, Get, Body } from '@nestjs/common';
import { ClasificacionService, RegistrarEventoDto } from './clasificacion.service';

@Controller('clasificacion')
export class ClasificacionController {
  constructor(private readonly clasificacionService: ClasificacionService) {}

  @Post()
  async registrarEvento(@Body() dto: RegistrarEventoDto) {
    return this.clasificacionService.registrarEvento(dto);
  }

  @Get()
  async obtenerEventos() {
    return this.clasificacionService.obtenerEventos();
  }
}
