import { Test, TestingModule } from '@nestjs/testing';
import { ClasificacionService } from './clasificacion.service';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';

describe('ClasificacionService', () => {
  let service: ClasificacionService;
  let prisma: PrismaService;
  let qrService: QrService;

  const mockEvento = {
    id: 'evento-1',
    categoria: 'Plástico',
    confianza: 0.95,
    stationId: 'station-1',
    timestamp: new Date(),
  };

  const mockQr = {
    id: 'qr-1',
    codigo: 'QR-PLASTICO-12345',
    categoria: 'Plástico',
    puntos: 10,
    firma: '0xsignature',
    usado: false,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    qrPayload: '{"c":"QR-PLASTICO-12345"}',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClasificacionService,
        {
          provide: PrismaService,
          useValue: {
            eventoClasificacion: {
              create: jest.fn().mockResolvedValue(mockEvento),
              findMany: jest.fn().mockResolvedValue([mockEvento]),
              count: jest.fn().mockResolvedValue(1),
            },
            $transaction: jest.fn().mockResolvedValue([[mockEvento], 1]),
          },
        },
        {
          provide: QrService,
          useValue: {
            generarQR: jest.fn().mockResolvedValue(mockQr),
          },
        },
      ],
    }).compile();

    service = module.get<ClasificacionService>(ClasificacionService);
    prisma = module.get<PrismaService>(PrismaService);
    qrService = module.get<QrService>(QrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registrarEvento', () => {
    it('should create a classification event and generate a signed QR code', async () => {
      const dto = {
        categoria: 'Plástico',
        confianza: 0.95,
        stationId: 'station-1',
        peso: 0.5,
      };

      const result = await service.registrarEvento(dto);

      expect(result.id).toBe('evento-1');
      expect(result.categoria).toBe('Plástico');
      expect(result.qr).toEqual(mockQr);
      expect(prisma.eventoClasificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoria: 'Plástico',
            confianza: 0.95,
            stationId: 'station-1',
          }),
        }),
      );
      expect(qrService.generarQR).toHaveBeenCalledWith('Plástico', 'station-1', 0.5);
    });
  });

  describe('obtenerEventos', () => {
    it('should return paginated events list', async () => {
      const result = await service.obtenerEventos(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});
