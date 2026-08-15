import { Test, TestingModule } from '@nestjs/testing';
import { ClasificacionController } from './clasificacion.controller';
import { ClasificacionService } from './clasificacion.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClasificacionController', () => {
  let controller: ClasificacionController;
  let service: ClasificacionService;

  const mockEventoResponse = {
    id: 'evento-1',
    categoria: 'Plástico',
    confianza: 0.95,
    stationId: 'station-1',
    timestamp: new Date(),
    qr: {
      codigo: 'QR-PLASTICO-12345',
      puntos: 10,
    },
  };

  const mockPaginated = {
    data: [mockEventoResponse],
    total: 1,
    page: 1,
    limit: 20,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClasificacionController],
      providers: [
        {
          provide: ClasificacionService,
          useValue: {
            registrarEvento: jest.fn().mockResolvedValue(mockEventoResponse),
            obtenerEventos: jest.fn().mockResolvedValue(mockPaginated),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            station: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    controller = module.get<ClasificacionController>(ClasificacionController);
    service = module.get<ClasificacionService>(ClasificacionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('registrarEvento should call service.registrarEvento', async () => {
    const dto = {
      categoria: 'Plástico',
      confianza: 0.95,
      stationId: 'station-1',
      peso: 0.5,
    };

    const result = await controller.registrarEvento(dto);
    expect(result).toEqual(mockEventoResponse);
    expect(service.registrarEvento).toHaveBeenCalledWith(dto);
  });

  it('registrarEventoAlias should call service.registrarEvento', async () => {
    const dto = {
      categoria: 'Papel',
      confianza: 0.9,
      stationId: 'station-1',
    };

    const result = await controller.registrarEventoAlias(dto);
    expect(result).toEqual(mockEventoResponse);
    expect(service.registrarEvento).toHaveBeenCalledWith(dto);
  });

  it('obtenerEventos should call service.obtenerEventos with page and limit', async () => {
    const result = await controller.obtenerEventos(2, 10);
    expect(result).toEqual(mockPaginated);
    expect(service.obtenerEventos).toHaveBeenCalledWith(2, 10);
  });
});
