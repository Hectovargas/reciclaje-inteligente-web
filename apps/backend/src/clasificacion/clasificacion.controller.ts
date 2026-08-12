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
@ApiBearerAuth()
@Controller('clasificacion')
export class ClasificacionController {
  constructor(private readonly clasificacionService: ClasificacionService) {}

  @Post()
  @UseGuards(StationTokenGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a classification event from the AI station' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async registrarEvento(@Body() dto: RegistrarEventoDto) {
    return this.clasificacionService.registrarEvento(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get paginated classification events' })
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
