import { Controller, Get, UseGuards, Post, Put, Body, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsDto, StationDto } from './dto/metrics.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get aggregated metrics for the dashboard' })
  @ApiResponse({ status: 200, type: MetricsDto })
  async getMetrics() {
    return this.dashboardService.obtenerMetricasAgregadas();
  }

  @Get('stations')
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get all stations and their statuses' })
  @ApiResponse({ status: 200, type: [StationDto] })
  async getStations() {
    return this.dashboardService.getStations();
  }

  @Post('stations')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new station' })
  async createStation(@Body() data: any) { // using any for now to avoid dealing with DTO validation import issues if not set up
    return this.dashboardService.createStation(data);
  }

  @Put('stations/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an existing station' })
  async updateStation(@Param('id') id: string, @Body() data: any) {
    return this.dashboardService.updateStation(id, data);
  }
}
