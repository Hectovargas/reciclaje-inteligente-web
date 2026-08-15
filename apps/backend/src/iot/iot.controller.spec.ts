import { Test, TestingModule } from '@nestjs/testing';
import { IotController } from './iot.controller';
import { IotService } from './iot.service';
import { StationStatus } from '@prisma/client';

describe('IotController', () => {
  let controller: IotController;
  let service: IotService;

  const mockActivationResult = {
    status: StationStatus.ACTIVE,
    stationId: 'station-iot-1',
    stationName: 'Estación Central',
    token: 'tk_test123',
    deviceSecret: 'sec_test123',
    message: 'Estación activada exitosamente',
  };

  const mockTelemetryResult = {
    recorded: true,
    telemetriaId: 'tel-1',
    stationId: 'station-iot-1',
    stationStatus: StationStatus.WARNING,
    warning: true,
    levels: { papel: 20, plastico: 85, metal: 10 },
    maxLevel: 85,
    avgLevel: 38.33,
    capacity: 62,
    bateria: 95,
    temperatura: 24.5,
    lastPingAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IotController],
      providers: [
        {
          provide: IotService,
          useValue: {
            activarEstacion: jest.fn().mockResolvedValue(mockActivationResult),
            ping: jest.fn().mockResolvedValue({
              status: StationStatus.ACTIVE,
              stationId: 'station-iot-1',
              ping: 'ok',
              lastPingAt: new Date(),
            }),
            registrarTelemetria: jest.fn().mockResolvedValue(mockTelemetryResult),
          },
        },
      ],
    }).compile();

    controller = module.get<IotController>(IotController);
    service = module.get<IotService>(IotService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('activar should call service.activarEstacion', async () => {
    const dto = {
      macAddress: 'AA:BB:CC:DD:EE:FF',
      provisioningToken: 'prov_test123',
    };

    const result = await controller.activar(dto);
    expect(result).toEqual(mockActivationResult);
    expect(service.activarEstacion).toHaveBeenCalledWith(dto);
  });

  it('ping should call service.ping', async () => {
    const dto = {
      macAddress: 'AA:BB:CC:DD:EE:FF',
      token: 'tk_test123',
    };

    const result = (await controller.ping(dto)) as any;
    expect(result.ping).toBe('ok');
    expect(service.ping).toHaveBeenCalledWith(dto);
  });

  it('registrarTelemetria should call service.registrarTelemetria', async () => {
    const dto = {
      macAddress: 'AA:BB:CC:DD:EE:FF',
      token: 'tk_test123',
      levels: { papel: 20, plastico: 85, metal: 10 },
      bateria: 95,
      temperatura: 24.5,
    };

    const result = await controller.registrarTelemetria(dto);
    expect(result).toEqual(mockTelemetryResult);
    expect(service.registrarTelemetria).toHaveBeenCalledWith(dto);
  });
});
