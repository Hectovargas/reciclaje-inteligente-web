import { Test, TestingModule } from '@nestjs/testing';
import { DispositivosController } from './dispositivos.controller';
import { ProvisioningService } from './provisioning.service';
import { StationStatus } from '@prisma/client';

describe('DispositivosController', () => {
  let controller: DispositivosController;
  let service: ProvisioningService;

  const mockResponse = {
    status: StationStatus.ACTIVE,
    stationId: 'station-123',
    stationName: 'Estación Central',
    location: 'Edificio A',
    zone: { id: 'zone-1', name: 'Zona Centro' },
    macAddress: '24:6F:28:1A:BC:DE',
    token: 'tk_test_runtime_key',
    apiKey: 'tk_test_runtime_key',
    deviceSecret: 'sec_test_secret',
    mqtt: {
      topicTelemetry: 'cleancity/stations/station-123/telemetria',
      topicEvents: 'cleancity/stations/station-123/eventos',
    },
    telemetryEndpoint: '/api/v1/iot/telemetria',
    message: 'Estación aprovisionada y activada exitosamente',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispositivosController],
      providers: [
        {
          provide: ProvisioningService,
          useValue: {
            provisionDevice: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<DispositivosController>(DispositivosController);
    service = module.get<ProvisioningService>(ProvisioningService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('provision', () => {
    it('should call provisioningService.provisionDevice and return activated station credentials', async () => {
      const dto = {
        token: 'ABC123',
        mac: '24:6F:28:1A:BC:DE',
      };

      const result = await controller.provision(dto);

      expect(service.provisionDevice).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe(StationStatus.ACTIVE);
      expect(result.apiKey).toBe('tk_test_runtime_key');
    });
  });
});
