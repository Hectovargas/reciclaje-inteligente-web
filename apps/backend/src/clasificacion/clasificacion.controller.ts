import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ClasificacionService } from './clasificacion.service';
import { RegistrarEventoDto, PaginatedEventosDto } from './dto/clasificacion.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StationTokenGuard } from '../auth/guards/station-token.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Clasificacion')
@Controller('clasificacion')
export class ClasificacionController {
  constructor(private readonly clasificacionService: ClasificacionService) {}

  @Post()
  @UseGuards(StationTokenGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Registrar evento de clasificación desde estación de IA y emitir QR' })
  @ApiResponse({ status: 201, description: 'Evento registrado y token QR firmado generado' })
  async registrarEvento(@Body() dto: RegistrarEventoDto) {
    return this.clasificacionService.registrarEvento(dto);
  }

  @Post('evento')
  @UseGuards(StationTokenGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Alias para registro de evento de clasificación IoT' })
  @ApiResponse({ status: 201, description: 'Evento registrado y token QR firmado generado' })
  async registrarEventoAlias(@Body() dto: RegistrarEventoDto) {
    return this.clasificacionService.registrarEvento(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER, Role.OPERATOR)
  @ApiOperation({ summary: 'Obtener historial paginado de eventos de clasificación' })
  @ApiResponse({ status: 200, type: PaginatedEventosDto })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async obtenerEventos(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.clasificacionService.obtenerEventos(+page, +limit);
  }
}
