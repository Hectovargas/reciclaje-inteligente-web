import { Test, TestingModule } from '@nestjs/testing';
import { IotService } from './iot.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { StationStatus } from '@prisma/client';

describe('IotService - Adversarial & Stress Testing', () => {
  let service: IotService;
  let prisma: PrismaService;

  const createMockStation = (overrides = {}) => ({
    id: 'station-adversarial-01',
    name: 'Estación Central Mock',
    location: 'Campus Este',
    status: StationStatus.PENDING_ACTIVATION,
    capacity: 100,
    token: 'tk_valid_station_secret_999',
    macAddress: '10:20:30:40:50:60',
    provisioningToken: 'prov_token_alpha_123',
    deviceSecret: 'sec_original_device_key',
    lastPingAt: null,
    zoneId: 'zone-1',
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IotService,
        {
          provide: PrismaService,
          useValue: {
            station: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            telemetria: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IotService>(IotService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('1. Zero-Touch Activation Adversarial Security', () => {
    it('should reject activation with incorrect or empty provisioning token', async () => {
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(null);

      await expect(
        service.activarEstacion({
          macAddress: '10:20:30:40:50:60',
          provisioningToken: 'fake_or_unregistered_token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject MAC spoofing when station is already bound to a different MAC address', async () => {
      const boundStation = createMockStation({ macAddress: '10:20:30:40:50:60' });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(boundStation);

      // Attacker knows provisioningToken but uses a different MAC
      await expect(
        service.activarEstacion({
          macAddress: 'DE:AD:BE:EF:00:01',
          provisioningToken: 'prov_token_alpha_123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle case insensitivity and extra whitespace in MAC addresses during activation', async () => {
      const unboundStation = createMockStation({ macAddress: null });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(unboundStation);
      (jest.spyOn(prisma.station, 'update') as any).mockImplementation(async (args: any) => ({
        ...unboundStation,
        ...args.data,
      }));

      const res = await service.activarEstacion({
        macAddress: '  aa:bb:cc:dd:ee:ff  ',
        provisioningToken: '  prov_token_alpha_123  ',
      });

      expect(res.status).toBe(StationStatus.ACTIVE);
      expect(prisma.station.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            macAddress: 'AA:BB:CC:DD:EE:FF',
            status: StationStatus.ACTIVE,
          }),
        }),
      );
    });
  });

  describe('2. Extreme / Overflow Telemetry Readings & Automatic Status Transitions', () => {
    it('should transition station status to WARNING when any compartment exceeds 80%', async () => {
      const station = createMockStation({ status: StationStatus.ACTIVE });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(station);

      const mockTelemetria = { id: 'tel-warn-1' };
      const mockUpdatedStation = { ...station, status: StationStatus.WARNING, capacity: 60 };

      (jest.spyOn(prisma, '$transaction') as any).mockResolvedValue([mockTelemetria, mockUpdatedStation]);

      const res = await service.registrarTelemetria({
        macAddress: '10:20:30:40:50:60',
        token: 'tk_valid_station_secret_999',
        levels: {
          papel: 85, // >= 80% triggers WARNING
          plastico: 20,
          metal: 15,
        },
        bateria: 95,
      });

      expect(res.warning).toBe(true);
      expect(res.maxLevel).toBe(85);
      expect(res.stationStatus).toBe(StationStatus.WARNING);
    });

    it('should handle sensor overflow readings (>100%) and clamp capacity safely without crashing', async () => {
      const station = createMockStation({ status: StationStatus.ACTIVE });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(station);

      (jest.spyOn(prisma, '$transaction') as any).mockResolvedValue([
        { id: 'tel-overflow-1' },
        { ...station, status: StationStatus.WARNING, capacity: 0 },
      ]);

      const res = await service.registrarTelemetria({
        macAddress: '10:20:30:40:50:60',
        token: 'tk_valid_station_secret_999',
        levels: {
          papel: 150, // ultrasonic echo glitch > 100%
          plastico: 120,
          metal: 110,
        },
        bateria: 50,
      });

      expect(res.warning).toBe(true);
      expect(res.maxLevel).toBe(150);
      expect(res.capacity).toBe(0); // Clamped to 0 minimum
    });

    it('should handle negative sensor glitch readings gracefully and clamp capacity to 100%', async () => {
      const station = createMockStation({ status: StationStatus.ACTIVE });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(station);

      (jest.spyOn(prisma, '$transaction') as any).mockResolvedValue([
        { id: 'tel-neg-1' },
        { ...station, status: StationStatus.ACTIVE, capacity: 100 },
      ]);

      const res = await service.registrarTelemetria({
        macAddress: '10:20:30:40:50:60',
        token: 'tk_valid_station_secret_999',
        levels: {
          papel: -30,
          plastico: 0,
          metal: -10,
        },
        bateria: 100,
      });

      expect(res.warning).toBe(false);
      expect(res.capacity).toBe(100); // Clamped to 100 max
    });

    it('should default missing compartment levels to 0 without NaN errors', async () => {
      const station = createMockStation({ status: StationStatus.ACTIVE });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(station);

      (jest.spyOn(prisma, '$transaction') as any).mockResolvedValue([
        { id: 'tel-missing-1' },
        { ...station, status: StationStatus.ACTIVE, capacity: 90 },
      ]);

      // Only papel supplied, missing plastico & metal
      const res = await service.registrarTelemetria({
        macAddress: '10:20:30:40:50:60',
        token: 'tk_valid_station_secret_999',
        levels: {
          papel: 30,
        } as any,
      });

      expect(res.levels.papel).toBe(30);
      expect(res.levels.plastico).toBe(0);
      expect(res.levels.metal).toBe(0);
      expect(res.avgLevel).toBe(10); // 30 / 3 = 10
      expect(isNaN(res.avgLevel)).toBe(false);
    });

    it('should de-escalate station from WARNING back to ACTIVE when fill levels normalize', async () => {
      const warningStation = createMockStation({ status: StationStatus.WARNING });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(warningStation);

      (jest.spyOn(prisma, '$transaction') as any).mockResolvedValue([
        { id: 'tel-deescalate-1' },
        { ...warningStation, status: StationStatus.ACTIVE, capacity: 80 },
      ]);

      const res = await service.registrarTelemetria({
        macAddress: '10:20:30:40:50:60',
        token: 'tk_valid_station_secret_999',
        levels: { papel: 20, plastico: 20, metal: 20 },
      });

      expect(res.warning).toBe(false);
      expect(res.stationStatus).toBe(StationStatus.ACTIVE);
    });
  });

  describe('3. Telemetry Authentication & Credential Verification', () => {
    it('should reject telemetry with invalid station token', async () => {
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(null);

      await expect(
        service.registrarTelemetria({
          macAddress: '10:20:30:40:50:60',
          token: 'invalid_station_token',
          levels: { papel: 10, plastico: 10, metal: 10 },
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject telemetry with unregistered MAC', async () => {
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(null);

      await expect(
        service.registrarTelemetria({
          macAddress: '99:99:99:99:99:99',
          token: 'tk_valid_station_secret_999',
          levels: { papel: 10, plastico: 10, metal: 10 },
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('4. Heartbeat / Ping Edge Cases & Recovery', () => {
    it('should recover an OFFLINE station to ACTIVE on receiving a valid ping', async () => {
      const offlineStation = createMockStation({ status: StationStatus.OFFLINE });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(offlineStation);
      (jest.spyOn(prisma.station, 'update') as any).mockImplementation(async (args: any) => ({
        ...offlineStation,
        ...args.data,
      }));

      const res = (await service.ping({
        macAddress: '10:20:30:40:50:60',
        token: 'tk_valid_station_secret_999',
      })) as any;

      expect(res.status).toBe(StationStatus.ACTIVE);
      expect(prisma.station.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StationStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should reject ping with token mismatch for known MAC', async () => {
      const station = createMockStation({ status: StationStatus.ACTIVE, token: 'tk_original' });
      (jest.spyOn(prisma.station, 'findFirst') as any).mockResolvedValue(station);

      await expect(
        service.ping({
          macAddress: '10:20:30:40:50:60',
          token: 'tk_wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
