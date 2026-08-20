import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EstacionesService } from './estaciones.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { ActivarEstacionDto } from './dto/activar-estacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, StationStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Estaciones')
@Controller('estaciones')
export class EstacionesController {
  constructor(private readonly estacionesService: EstacionesService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER, Role.OPERATOR)
  @ApiOperation({ summary: 'Listar todas las estaciones de reciclaje' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Filtrar por ID de zona' })
  @ApiQuery({ name: 'status', required: false, enum: StationStatus, description: 'Filtrar por estado operativo' })
  @ApiResponse({ status: 200, description: 'Lista de estaciones retornada exitosamente' })
  async findAll(
    @Query('zoneId') zoneId?: string,
    @Query('status') status?: StationStatus,
  ) {
    return this.estacionesService.findAll({ zoneId, status });
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER, Role.OPERATOR)
  @ApiOperation({ summary: 'Obtener detalle de una estación de reciclaje por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de la estación retornado exitosamente' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.estacionesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva estación de reciclaje' })
  @ApiResponse({ status: 201, description: 'Estación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  @ApiResponse({ status: 409, description: 'Dirección MAC ya en uso' })
  async create(@Body() createStationDto: CreateStationDto) {
    return this.estacionesService.create(createStationDto);
  }

  @Post('activar')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Activación Zero-Touch de estación ESP32 por MAC y provisioning token' })
  @ApiResponse({ status: 200, description: 'Estación activada exitosamente' })
  @ApiResponse({ status: 401, description: 'Token de aprovisionamiento o MAC inválidos' })
  async activar(@Body() activarDto: ActivarEstacionDto) {
    return this.estacionesService.activarEstacion(activarDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una estación de reciclaje' })
  @ApiResponse({ status: 200, description: 'Estación actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Estación o zona no encontrada' })
  @ApiResponse({ status: 409, description: 'Dirección MAC ya en uso' })
  async update(
    @Param('id') id: string,
    @Body() updateStationDto: UpdateStationDto,
  ) {
    return this.estacionesService.update(id, updateStationDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar una estación de reciclaje' })
  @ApiResponse({ status: 200, description: 'Estación eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  async remove(@Param('id') id: string) {
    return this.estacionesService.remove(id);
  }

  @Post(':id/regenerar-token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerar token de aprovisionamiento de 30 minutos para una estación' })
  @ApiResponse({ status: 200, description: 'Token de aprovisionamiento regenerado exitosamente' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  async regenerarToken(@Param('id') id: string) {
    return this.estacionesService.regenerarToken(id);
  }

  @Post(':id/revoke-token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar y regenerar token de acceso y provisioning de una estación' })
  @ApiResponse({ status: 200, description: 'Tokens regenerados exitosamente' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  async revokeToken(@Param('id') id: string) {
    return this.estacionesService.revokeToken(id);
  }
}
