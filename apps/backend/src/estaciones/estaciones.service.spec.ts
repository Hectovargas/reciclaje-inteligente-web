import { Test, TestingModule } from '@nestjs/testing';
import { EstacionesService } from './estaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvisioningService } from '../provisioning/provisioning.service';
import { NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { StationStatus } from '@prisma/client';

describe('EstacionesService', () => {
  let service: EstacionesService;
  let prisma: PrismaService;
  let provisioningService: ProvisioningService;

  const mockZone = {
    id: 'zone-1',
    name: 'Zona Centro',
    isActive: true,
  };

  const mockStation = {
    id: 'station-1',
    name: 'Estación Central',
    location: 'Plaza Principal',
    status: StationStatus.PENDING_ACTIVATION,
    capacity: 100,
    token: 'tk_123456',
    macAddress: null,
    provisioningToken: 'ABC123',
    deviceSecret: null,
    lastPingAt: null,
    zoneId: 'zone-1',
    zone: mockZone,
    events: [],
    telemetrias: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstacionesService,
        {
          provide: PrismaService,
          useValue: {
            station: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            zone: {
              findUnique: jest.fn(),
            },
            telemetria: {
              deleteMany: jest.fn(),
            },
            eventoClasificacion: {
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: ProvisioningService,
          useValue: {
            generateTokenForStation: jest.fn().mockResolvedValue({
              token: 'ABC123',
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EstacionesService>(EstacionesService);
    prisma = module.get<PrismaService>(PrismaService);
    provisioningService = module.get<ProvisioningService>(ProvisioningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of stations with zone info', async () => {
      jest.spyOn(prisma.station, 'findMany').mockResolvedValue([mockStation as any]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Estación Central');
      expect(result[0].zone?.name).toBe('Zona Centro');
    });

    it('should filter by zoneId and status when provided', async () => {
      jest.spyOn(prisma.station, 'findMany').mockResolvedValue([mockStation as any]);

      await service.findAll({ zoneId: 'zone-1', status: StationStatus.ACTIVE });
      expect(prisma.station.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { zoneId: 'zone-1', status: StationStatus.ACTIVE },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return station if found', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(mockStation as any);

      const result = await service.findOne('station-1');
      expect(result.id).toBe('station-1');
      expect(result.name).toBe('Estación Central');
    });

    it('should throw NotFoundException if station does not exist', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create station in PENDING_ACTIVATION and generate 30-min provisioning token', async () => {
      jest.spyOn(prisma.zone, 'findUnique').mockResolvedValue(mockZone as any);
      jest.spyOn(prisma.station, 'create').mockResolvedValue({
        ...mockStation,
        status: StationStatus.PENDING_ACTIVATION,
      } as any);

      const result = await service.create({
        name: 'Nueva Estacion',
        location: 'Parque Norte',
        zoneId: 'zone-1',
        capacity: 120,
      });

      expect(result).toBeDefined();
      expect(provisioningService.generateTokenForStation).toHaveBeenCalledWith('station-1', 30);
      expect(result.provisioningToken).toBe('ABC123');
      expect(result.expiresAt).toBeDefined();
      expect(prisma.station.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StationStatus.PENDING_ACTIVATION,
          }),
        }),
      );
    });

    it('should throw NotFoundException if zone does not exist', async () => {
      jest.spyOn(prisma.zone, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Estacion',
          location: 'Parque',
          zoneId: 'non-existing-zone',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if macAddress is already registered', async () => {
      jest.spyOn(prisma.zone, 'findUnique').mockResolvedValue(mockZone as any);
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(mockStation as any);

      await expect(
        service.create({
          name: 'Estacion Duplicada',
          location: 'Parque',
          zoneId: 'zone-1',
          macAddress: 'AA:BB:CC:DD:EE:FF',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update station successfully', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(mockStation as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue({
        ...mockStation,
        name: 'Estacion Modificada',
      } as any);

      const result = await service.update('station-1', {
        name: 'Estacion Modificada',
      });

      expect(result.name).toBe('Estacion Modificada');
    });

    it('should throw NotFoundException if station does not exist', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new macAddress is already taken', async () => {
      jest.spyOn(prisma.station, 'findUnique')
        .mockResolvedValueOnce(mockStation as any) // existing station check
        .mockResolvedValueOnce({ id: 'other-station' } as any); // new mac check

      await expect(
        service.update('station-1', { macAddress: '99:99:99:99:99:99' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete station and related records', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(mockStation as any);
      jest.spyOn(prisma.telemetria, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.eventoClasificacion, 'deleteMany').mockResolvedValue({ count: 0 });
      jest.spyOn(prisma.station, 'delete').mockResolvedValue(mockStation as any);

      const result = await service.remove('station-1');
      expect(result).toHaveProperty('id', 'station-1');
      expect(prisma.station.delete).toHaveBeenCalledWith({ where: { id: 'station-1' } });
    });

    it('should throw NotFoundException if station to delete does not exist', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('regenerarToken', () => {
    it('should call provisioningService and return new 30-min token', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(mockStation as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue(mockStation as any);

      const result = await service.regenerarToken('station-1');

      expect(provisioningService.generateTokenForStation).toHaveBeenCalledWith('station-1', 30);
      expect(result.token).toBe('ABC123');
      expect(result.provisioningToken).toBe('ABC123');
      expect(result.expiresAt).toBeDefined();
      expect(result.stationId).toBe('station-1');
    });

    it('should throw NotFoundException if station does not exist', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(null);

      await expect(service.regenerarToken('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeToken', () => {
    it('should regenerate runtime token and provision token', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(mockStation as any);
      jest.spyOn(prisma.station, 'update').mockResolvedValue({
        ...mockStation,
        token: 'tk_new_key_123',
      } as any);

      const result = await service.revokeToken('station-1');
      expect(result.token).toBe('tk_new_key_123');
      expect(result.provisioningToken).toBe('ABC123');
      expect(result.message).toContain('revocado');
    });

    it('should throw NotFoundException if station does not exist', async () => {
      jest.spyOn(prisma.station, 'findUnique').mockResolvedValue(null);

      await expect(service.revokeToken('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
