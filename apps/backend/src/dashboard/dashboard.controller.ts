import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metricas')
  async obtenerMetricas() {
    return this.dashboardService.obtenerMetricasAgregadas();
  }
}
