import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            eventoClasificacion: { 
              count: jest.fn().mockResolvedValue(10),
              findMany: jest.fn().mockResolvedValue([]),
              aggregate: jest.fn().mockResolvedValue({ _avg: { confianza: 0.95 } }),
            },
            station: { 
              count: jest.fn().mockResolvedValue(0),
              findMany: jest.fn().mockResolvedValue([]) 
            },
            zone: { findMany: jest.fn().mockResolvedValue([]) },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return aggregated metrics', async () => {
    const metrics = await service.obtenerMetricasAgregadas();
    expect(metrics.kgTotal).toBe(10);
    expect(metrics.kgSaved).toBe(10);
  });
});
