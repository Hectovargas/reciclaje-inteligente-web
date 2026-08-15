import { Test, TestingModule } from '@nestjs/testing';
import { IotService } from './iot.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { StationStatus } from '@prisma/client';

describe('IotService', () => {
  let service: IotService;
  let prisma: PrismaService;

  const mockStation = {
    id: 'station-iot-1',
    name: 'Estación Reciclaje Norte',
    location: 'Campus Central',
    status: StationStatus.PENDING_ACTIVATION,
    capacity: 100,
    token: 'tk_live_123456',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    provisioningToken: 'prov_secret_789',
    deviceSecret: null,
    lastPingAt: null,
    zoneId: 'zone-1',
  };

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('activarEstacion (Zero-Touch Provisioning)', () => {
    it('should activate a pending station with matching MAC and provisioningToken', async () => {
      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(mockStation as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue({
        ...mockStation,
        status: StationStatus.ACTIVE,
        deviceSecret: 'sec_generated123',
        lastPingAt: new Date(),
      } as any);

      const result = await service.activarEstacion({
        macAddress: 'AA:BB:CC:DD:EE:FF',
        provisioningToken: 'prov_secret_789',
      });

      expect(result.status).toBe(StationStatus.ACTIVE);
      expect(result.stationId).toBe('station-iot-1');
      expect(result.message).toContain('exitosamente');
      expect(prisma.station.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'station-iot-1' },
          data: expect.objectContaining({
            status: StationStatus.ACTIVE,
            macAddress: 'AA:BB:CC:DD:EE:FF',
          }),
        }),
      );
    });

    it('should throw UnauthorizedException if provisioningToken is invalid', async () => {
      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(null);

      await expect(
        service.activarEstacion({
          macAddress: 'AA:BB:CC:DD:EE:FF',
          provisioningToken: 'invalid_token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if MAC address does not match registered station MAC', async () => {
      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(mockStation as any);

      await expect(
        service.activarEstacion({
          macAddress: '11:22:33:44:55:66',
          provisioningToken: 'prov_secret_789',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should activate station and assign MAC if station did not have a MAC previously', async () => {
      const stationWithoutMac = { ...mockStation, macAddress: null };
      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(stationWithoutMac as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue({
        ...stationWithoutMac,
        macAddress: 'AA:BB:CC:11:22:33',
        status: StationStatus.ACTIVE,
      } as any);

      const result = await service.activarEstacion({
        macAddress: 'aa:bb:cc:11:22:33',
        provisioningToken: 'prov_secret_789',
      });

      expect(result.status).toBe(StationStatus.ACTIVE);
      expect(prisma.station.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            macAddress: 'AA:BB:CC:11:22:33',
            status: StationStatus.ACTIVE,
          }),
        }),
      );
    });
  });

  describe('ping (Heartbeat)', () => {
    it('should delegate to activarEstacion if provisioningToken is supplied', async () => {
      const activateSpy = jest.spyOn(service, 'activarEstacion').mockResolvedValue({
        status: StationStatus.ACTIVE,
        stationId: 'station-iot-1',
        stationName: 'Estacion',
        token: 'tk_123',
        deviceSecret: 'sec_123',
        message: 'Estación activada exitosamente',
      });

      const result = await service.ping({
        macAddress: 'AA:BB:CC:DD:EE:FF',
        provisioningToken: 'prov_secret_789',
      });

      expect(activateSpy).toHaveBeenCalled();
      expect(result.status).toBe(StationStatus.ACTIVE);
    });

    it('should update lastPingAt and return ping ok for active station', async () => {
      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue({
        ...mockStation,
        status: StationStatus.ACTIVE,
      } as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue({
        ...mockStation,
        status: StationStatus.ACTIVE,
        lastPingAt: new Date(),
      } as any);

      const result = (await service.ping({
        macAddress: 'AA:BB:CC:DD:EE:FF',
        token: 'tk_live_123456',
      })) as any;

      expect(result.ping).toBe('ok');
      expect(result.stationId).toBe('station-iot-1');
      expect(result.lastPingAt).toBeDefined();
    });

    it('should throw NotFoundException if station does not exist on ping', async () => {
      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(null);

      await expect(
        service.ping({
          macAddress: '99:99:99:99:99:99',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarTelemetria (Ultrasonic Fill Levels & Auto-Warning)', () => {
    it('should record telemetry and trigger WARNING status when level >= 80%', async () => {
      const activeStation = {
        ...mockStation,
        status: StationStatus.ACTIVE,
      };

      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(activeStation as any);

      const mockTelemetria = {
        id: 'telemetria-1',
        stationId: 'station-iot-1',
        nivelPapel: 40,
        nivelPlastico: 85,
        nivelMetal: 15,
        bateria: 92,
        temperatura: 25.4,
        timestamp: new Date(),
      };

      const mockUpdatedStation = {
        ...activeStation,
        status: StationStatus.WARNING,
        capacity: 53,
        lastPingAt: new Date(),
      };

      jest.spyOn(prisma, '$transaction').mockResolvedValue([mockTelemetria, mockUpdatedStation] as any);

      const result = await service.registrarTelemetria({
        macAddress: 'AA:BB:CC:DD:EE:FF',
        token: 'tk_live_123456',
        levels: {
          papel: 40,
          plastico: 85,
          metal: 15,
        },
        bateria: 92,
        temperatura: 25.4,
      });

      expect(result.recorded).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.stationStatus).toBe(StationStatus.WARNING);
      expect(result.maxLevel).toBe(85);
      expect(result.telemetriaId).toBe('telemetria-1');
    });

    it('should restore ACTIVE status when levels drop below 80% and station was WARNING', async () => {
      const warningStation = {
        ...mockStation,
        status: StationStatus.WARNING,
      };

      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(warningStation as any);

      const mockTelemetria = {
        id: 'telemetria-2',
        stationId: 'station-iot-1',
        nivelPapel: 20,
        nivelPlastico: 30,
        nivelMetal: 10,
        bateria: 90,
        temperatura: 23.0,
        timestamp: new Date(),
      };

      const mockUpdatedStation = {
        ...warningStation,
        status: StationStatus.ACTIVE,
        capacity: 80,
        lastPingAt: new Date(),
      };

      jest.spyOn(prisma, '$transaction').mockResolvedValue([mockTelemetria, mockUpdatedStation] as any);

      const result = await service.registrarTelemetria({
        macAddress: 'AA:BB:CC:DD:EE:FF',
        token: 'tk_live_123456',
        nivelPapel: 20,
        nivelPlastico: 30,
        nivelMetal: 10,
        bateria: 90,
        temperatura: 23.0,
      });

      expect(result.recorded).toBe(true);
      expect(result.warning).toBe(false);
      expect(result.stationStatus).toBe(StationStatus.ACTIVE);
    });

    it('should throw UnauthorizedException if MAC or token do not match', async () => {
      jest.spyOn(prisma.station, 'findFirst').mockResolvedValue(null);

      await expect(
        service.registrarTelemetria({
          macAddress: 'AA:BB:CC:DD:EE:FF',
          token: 'wrong_token',
          levels: { papel: 10, plastico: 10, metal: 10 },
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
