import { Test, TestingModule } from '@nestjs/testing';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QrController', () => {
  let controller: QrController;
  let service: QrService;

  const mockQrGenerated = {
    id: 'qr-1',
    codigo: 'QR-PLASTICO-1723680000',
    categoria: 'Plástico',
    material: 'Plástico',
    puntos: 10,
    firma: '0xsignature',
    usado: false,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    qrPayload: '{"c":"QR-PLASTICO-1723680000","m":"Plástico","p":10}',
  };

  const mockVerification = {
    codigo: 'QR-PLASTICO-1723680000',
    valido: true,
    valid: true,
    material: 'Plástico',
    categoria: 'Plástico',
    puntos: 10,
    usado: false,
    expiresAt: new Date(Date.now() + 600000),
    mensaje: 'Firma verificada exitosamente',
  };

  const mockClaimResult = {
    success: true,
    puntos: 10,
    material: 'Plástico',
    categoria: 'Plástico',
    txStatus: 'QUEUED',
    blockchainEventId: 'b-event-1',
    message: 'Puntos reclamados exitosamente',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrController],
      providers: [
        {
          provide: QrService,
          useValue: {
            generarQR: jest.fn().mockResolvedValue(mockQrGenerated),
            verificarQR: jest.fn().mockResolvedValue(mockVerification),
            reclamarQR: jest.fn().mockResolvedValue(mockClaimResult),
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

    controller = module.get<QrController>(QrController);
    service = module.get<QrService>(QrService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('generarQR should call service.generarQR', async () => {
    const dto = { categoria: 'Plástico', stationId: 'st-1', peso: 1 };
    const result = await controller.generarQR(dto);
    expect(result).toEqual(mockQrGenerated);
    expect(service.generarQR).toHaveBeenCalledWith('Plástico', 'st-1', 1);
  });

  it('verificarQR with query params should call service.verificarQR', async () => {
    const result = await controller.verificarQR('QR-PLASTICO-1723680000', undefined, '0xsignature');
    expect(result).toEqual(mockVerification);
    expect(service.verificarQR).toHaveBeenCalledWith('QR-PLASTICO-1723680000', '0xsignature');
  });

  it('verificarQRParam with path param should call service.verificarQR', async () => {
    const result = await controller.verificarQRParam('QR-PLASTICO-1723680000', '0xsignature');
    expect(result).toEqual(mockVerification);
    expect(service.verificarQR).toHaveBeenCalledWith('QR-PLASTICO-1723680000', '0xsignature');
  });

  it('reclamarQR should call service.reclamarQR with req.user and dto', async () => {
    const req = {
      user: { id: 'user-1', email: 'user@recicla.com', walletAddress: '0x1111' },
    };
    const dto = { codigo: 'QR-PLASTICO-1723680000' };

    const result = await controller.reclamarQR(req, dto);
    expect(result).toEqual(mockClaimResult);
    expect(service.reclamarQR).toHaveBeenCalledWith(req.user, dto);
  });
});
