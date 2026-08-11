import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
