import { Test, TestingModule } from '@nestjs/testing';
import { EstacionesController } from './estaciones.controller';
import { EstacionesService } from './estaciones.service';
import { StationStatus } from '@prisma/client';

describe('EstacionesController', () => {
  let controller: EstacionesController;
  let service: EstacionesService;

  const mockStation = {
    id: 'station-1',
    name: 'Estación Central',
    location: 'Plaza Principal',
    status: StationStatus.ACTIVE,
    capacity: 100,
    token: 'tk_123456',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    provisioningToken: 'prov_123456',
    lastPingAt: null,
    zoneId: 'zone-1',
    zone: { id: 'zone-1', name: 'Zona Centro', isActive: true },
    today: 0,
    lastTelemetry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstacionesController],
      providers: [
        {
          provide: EstacionesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockStation]),
            findOne: jest.fn().mockResolvedValue(mockStation),
            create: jest.fn().mockResolvedValue(mockStation),
            update: jest.fn().mockResolvedValue(mockStation),
            remove: jest.fn().mockResolvedValue({ id: 'station-1', message: 'deleted' }),
            revokeToken: jest.fn().mockResolvedValue({
              token: 'tk_new',
              provisioningToken: 'prov_new',
              station: mockStation,
            }),
            activarEstacion: jest.fn().mockResolvedValue({
              status: StationStatus.ACTIVE,
              stationId: 'station-1',
              stationName: 'Estación Central',
              token: 'tk_123456',
              deviceSecret: 'sec_123',
              message: 'Estación activada exitosamente',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<EstacionesController>(EstacionesController);
    service = module.get<EstacionesService>(EstacionesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should return stations', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalledWith({ zoneId: undefined, status: undefined });
  });

  it('findOne should return single station', async () => {
    const result = await controller.findOne('station-1');
    expect(result.id).toBe('station-1');
    expect(service.findOne).toHaveBeenCalledWith('station-1');
  });

  it('create should call service.create', async () => {
    const dto = {
      name: 'Estación Central',
      location: 'Plaza Principal',
      zoneId: 'zone-1',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      capacity: 100,
    };
    const result = await controller.create(dto);
    expect(result.id).toBe('station-1');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('activar should call service.activarEstacion', async () => {
    const dto = {
      macAddress: 'AA:BB:CC:DD:EE:FF',
      provisioningToken: 'prov_123456',
    };
    const result = await controller.activar(dto);
    expect(result.status).toBe(StationStatus.ACTIVE);
    expect(service.activarEstacion).toHaveBeenCalledWith(dto);
  });

  it('update should call service.update', async () => {
    const dto = { name: 'Updated Station' };
    const result = await controller.update('station-1', dto);
    expect(result.id).toBe('station-1');
    expect(service.update).toHaveBeenCalledWith('station-1', dto);
  });

  it('remove should call service.remove', async () => {
    const result = await controller.remove('station-1');
    expect(result).toHaveProperty('id', 'station-1');
    expect(service.remove).toHaveBeenCalledWith('station-1');
  });

  it('revokeToken should call service.revokeToken', async () => {
    const result = await controller.revokeToken('station-1');
    expect(result).toHaveProperty('token', 'tk_new');
    expect(service.revokeToken).toHaveBeenCalledWith('station-1');
  });
});
