import { Test, TestingModule } from '@nestjs/testing';
import { QrService } from './qr.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { BlockchainEventStatus } from '@prisma/client';
import { ethers } from 'ethers';

describe('QrService', () => {
  let service: QrService;
  let prisma: PrismaService;

  const mockQrRecord = {
    id: 'qr-uuid-1',
    codigo: 'QR-PLASTICO-1723680000-abcd',
    categoria: 'Plástico',
    firma: '0xmocksignature1234567890abcdef',
    usado: false,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrService,
        {
          provide: PrismaService,
          useValue: {
            qRToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            blockchainEvent: {
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) =>
              callback({
                qRToken: {
                  findUnique: jest.fn(),
                  update: jest.fn(),
                },
                blockchainEvent: {
                  create: jest.fn(),
                },
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<QrService>(QrService);
    prisma = module.get<PrismaService>(PrismaService);
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calcularPuntos', () => {
    it('should assign correct points per material category', () => {
      expect(service.calcularPuntos('Plástico')).toBe(10);
      expect(service.calcularPuntos('Papel')).toBe(5);
      expect(service.calcularPuntos('Metal')).toBe(15);
      expect(service.calcularPuntos('Vidrio')).toBe(8);
      expect(service.calcularPuntos('Cartón')).toBe(5);
      expect(service.calcularPuntos('Plástico', 2.5)).toBe(25);
    });
  });

  describe('generarQR', () => {
    it('should generate a Keccak256 signed QR with 10 min TTL and OLED payload', async () => {
      jest.spyOn(prisma.qRToken, 'create').mockResolvedValue(mockQrRecord as any);

      const result = await service.generarQR('Plástico', 'station-1', 1);

      expect(result.codigo).toContain('QR-PLASTICO-');
      expect(result.categoria).toBe('Plástico');
      expect(result.puntos).toBe(10);
      expect(result.firma).toBeDefined();
      expect(result.firma.startsWith('0x')).toBe(true);
      expect(result.qrPayload).toBeDefined();

      const parsedPayload = JSON.parse(result.qrPayload);
      expect(parsedPayload.m).toBe('Plástico');
      expect(parsedPayload.p).toBe(10);
      expect(parsedPayload.c).toBe(result.codigo);

      expect(prisma.qRToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoria: 'Plástico',
            usado: false,
          }),
        }),
      );
    });
  });

  describe('verificarQR', () => {
    it('should verify a valid unused non-expired QR code', async () => {
      jest.spyOn(prisma.qRToken, 'findUnique').mockResolvedValue(mockQrRecord as any);

      const result = await service.verificarQR('QR-PLASTICO-1723680000-abcd');

      expect(result.valido).toBe(true);
      expect(result.categoria).toBe('Plástico');
      expect(result.puntos).toBe(10);
      expect(result.usado).toBe(false);
    });

    it('should throw NotFoundException if QR code does not exist', async () => {
      jest.spyOn(prisma.qRToken, 'findUnique').mockResolvedValue(null);

      await expect(service.verificarQR('QR-NONEXISTENT')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if QR code has already been used', async () => {
      jest.spyOn(prisma.qRToken, 'findUnique').mockResolvedValue({
        ...mockQrRecord,
        usado: true,
      } as any);

      await expect(service.verificarQR('QR-PLASTICO-USED')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if QR code is expired', async () => {
      jest.spyOn(prisma.qRToken, 'findUnique').mockResolvedValue({
        ...mockQrRecord,
        expiresAt: new Date(Date.now() - 1000), // in the past
      } as any);

      await expect(service.verificarQR('QR-PLASTICO-EXPIRED')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reclamarQR (Atomic Redemption & Replay Mitigation)', () => {
    it('should atomically claim points, update usado: true and create PENDING blockchain event', async () => {
      const mockTx = {
        qRToken: {
          findUnique: jest.fn().mockResolvedValue(mockQrRecord),
          update: jest.fn().mockResolvedValue({ ...mockQrRecord, usado: true }),
        },
        blockchainEvent: {
          create: jest.fn().mockResolvedValue({
            id: 'b-event-1',
            fromAddress: '0xoperator',
            toAddress: '0xuserwallet',
            amount: 10,
            status: BlockchainEventStatus.PENDING,
          }),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const user = {
        id: 'user-1',
        email: 'user@recicla.com',
        walletAddress: '0x1111111111111111111111111111111111111111',
      };

      const result = await service.reclamarQR(user, {
        codigo: 'QR-PLASTICO-1723680000-abcd',
      });

      expect(result.success).toBe(true);
      expect(result.puntos).toBe(10);
      expect(result.material).toBe('Plástico');
      expect(result.txStatus).toBe('QUEUED');
      expect(result.blockchainEventId).toBe('b-event-1');

      expect(mockTx.qRToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'qr-uuid-1' },
          data: { usado: true },
        }),
      );

      expect(mockTx.blockchainEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            toAddress: '0x1111111111111111111111111111111111111111',
            amount: 10,
            status: BlockchainEventStatus.PENDING,
          }),
        }),
      );
    });

    it('should throw ConflictException on replay attempt (when QR was already claimed)', async () => {
      const mockTx = {
        qRToken: {
          findUnique: jest.fn().mockResolvedValue({ ...mockQrRecord, usado: true }),
          update: jest.fn(),
        },
        blockchainEvent: {
          create: jest.fn(),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const user = { id: 'user-1', walletAddress: '0x1111' };

      await expect(
        service.reclamarQR(user, { codigo: 'QR-PLASTICO-1723680000-abcd' }),
      ).rejects.toThrow(ConflictException);

      expect(mockTx.qRToken.update).not.toHaveBeenCalled();
      expect(mockTx.blockchainEvent.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if claiming an expired QR token', async () => {
      const mockTx = {
        qRToken: {
          findUnique: jest.fn().mockResolvedValue({
            ...mockQrRecord,
            expiresAt: new Date(Date.now() - 5000),
          }),
          update: jest.fn(),
        },
        blockchainEvent: {
          create: jest.fn(),
        },
      };

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(mockTx);
      });

      const user = { id: 'user-1' };

      await expect(
        service.reclamarQR(user, { codigo: 'QR-PLASTICO-EXPIRED' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
