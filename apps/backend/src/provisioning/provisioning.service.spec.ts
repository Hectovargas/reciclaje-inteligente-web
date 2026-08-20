import { Test, TestingModule } from '@nestjs/testing';
import { ProvisioningService } from './provisioning.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StationStatus } from '@prisma/client';

describe('ProvisioningService', () => {
  let service: ProvisioningService;
  let prisma: PrismaService;

  const mockStation = {
    id: 'station-123',
    name: 'Estación Campus Central',
    location: 'Edificio A',
    status: StationStatus.PENDING_ACTIVATION,
    capacity: 100,
    token: null,
    macAddress: null,
    provisioningToken: 'ABC123',
    deviceSecret: null,
    zoneId: 'zone-1',
    zone: { id: 'zone-1', name: 'Zona Centro' },
  };

  const mockProvisionToken = {
    id: 'token-rec-1',
    token: 'ABC123',
    stationId: 'station-123',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Valid for 30 minutes
    used: false,
    associatedMac: null,
    station: mockStation,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvisioningService,
        {
          provide: PrismaService,
          useValue: {
            station: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            provisionToken: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProvisioningService>(ProvisioningService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokenForStation', () => {
    it('should generate a 6-character short token and save it with 30 min expiration', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(mockStation as any);
      jest.spyOn(prisma.provisionToken, 'updateMany').mockResolvedValue({ count: 1 });
      jest.spyOn(prisma.provisionToken, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.provisionToken, 'create').mockResolvedValue(mockProvisionToken as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue(mockStation as any);

      const result = await service.generateTokenForStation('station-123', 30);

      expect(result).toHaveProperty('token');
      expect(result.token.length).toBe(6);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(prisma.provisionToken.updateMany).toHaveBeenCalledWith({
        where: { stationId: 'station-123', used: false },
        data: { used: true },
      });
      expect(prisma.provisionToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stationId: 'station-123',
            used: false,
          }),
        }),
      );
    });

    it('should throw NotFoundException if station does not exist', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(null);

      await expect(service.generateTokenForStation('invalid-station')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('provisionDevice (Validation Order: Exists -> Expired -> Used -> Duplicate MAC)', () => {
    it('1. should throw NotFoundException if token does not exist', async () => {
      jest.spyOn(prisma.provisionToken, 'findUnique').mockResolvedValue(null);

      await expect(
        service.provisionDevice({
          token: 'INVALID',
          mac: '24:6F:28:1A:BC:DE',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('2. should throw 410 Gone if token is expired', async () => {
      const expiredTokenRecord = {
        ...mockProvisionToken,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 mins ago
        used: false,
      };

      jest.spyOn(prisma.provisionToken, 'findUnique').mockResolvedValue(expiredTokenRecord as any);

      try {
        await service.provisionDevice({
          token: 'ABC123',
          mac: '24:6F:28:1A:BC:DE',
        });
        fail('Should have thrown 410 Gone');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.GONE);
        expect(err.message).toContain('expirado');
      }
    });

    it('3. should throw BadRequestException if token is already used', async () => {
      const usedTokenRecord = {
        ...mockProvisionToken,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000),
        used: true,
      };

      jest.spyOn(prisma.provisionToken, 'findUnique').mockResolvedValue(usedTokenRecord as any);

      await expect(
        service.provisionDevice({
          token: 'ABC123',
          mac: '24:6F:28:1A:BC:DE',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('4. should throw ConflictException if MAC is already registered to another active station', async () => {
      jest.spyOn(prisma.provisionToken, 'findUnique').mockResolvedValue(mockProvisionToken as any);
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue({
        id: 'different-station-456',
        name: 'Otra Estación',
        status: StationStatus.ACTIVE,
        macAddress: '24:6F:28:1A:BC:DE',
      } as any);

      await expect(
        service.provisionDevice({
          token: 'ABC123',
          mac: '24:6F:28:1A:BC:DE',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('5. should successfully provision device, update station to ACTIVE, and return credentials', async () => {
      jest.spyOn(prisma.provisionToken, 'findUnique').mockResolvedValue(mockProvisionToken as any);
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.provisionToken, 'update').mockResolvedValue({
        ...mockProvisionToken,
        used: true,
        associatedMac: '24:6F:28:1A:BC:DE',
      } as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue({
        ...mockStation,
        status: StationStatus.ACTIVE,
        macAddress: '24:6F:28:1A:BC:DE',
        token: 'tk_test_runtime_key',
        deviceSecret: 'sec_test_secret',
        lastPingAt: new Date(),
      } as any);

      const result = await service.provisionDevice({
        token: 'ABC123',
        mac: '24:6F:28:1A:BC:DE',
      });

      expect(result.status).toBe(StationStatus.ACTIVE);
      expect(result.stationId).toBe('station-123');
      expect(result.macAddress).toBe('24:6F:28:1A:BC:DE');
      expect(result.token).toBe('tk_test_runtime_key');
      expect(result.apiKey).toBe('tk_test_runtime_key');
      expect(result.deviceSecret).toBe('sec_test_secret');
      expect(result.mqtt.topicTelemetry).toBe('cleancity/stations/station-123/telemetria');
      expect(result.message).toContain('exitosamente');

      expect(prisma.provisionToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'token-rec-1' },
          data: { used: true, associatedMac: '24:6F:28:1A:BC:DE' },
        }),
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired unused tokens older than 24 hours', async () => {
      jest.spyOn(prisma.provisionToken, 'deleteMany').mockResolvedValue({ count: 5 });

      const result = await service.cleanupExpiredTokens();
      expect(result.count).toBe(5);
      expect(prisma.provisionToken.deleteMany).toHaveBeenCalled();
    });
  });
});
