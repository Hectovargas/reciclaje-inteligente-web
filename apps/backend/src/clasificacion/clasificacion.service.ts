import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarEventoDto } from './dto/clasificacion.dto';
import { QrService } from '../qr/qr.service';

const DEMO_ZONE_NAME    = 'Zona Demo';
const DEMO_STATION_NAME = 'Prototipo Recycle_AI';
const DEMO_STATION_TOKEN = 'tk_prototipo_v1_recycle_ai_2026';

const ESP32_HOST = process.env.ESP32_HOST ?? '192.168.43.200';
const ESP32_URL = `http://${ESP32_HOST}/trigger`;

const CATEGORIA_TO_SERVO: Record<string, number> = {
  plastico: 3,
  papel: 2,
  metal: 1,
};

function normalizeCategoria(cat: string): string {
  return cat
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class ClasificacionService {
  private readonly logger = new Logger(ClasificacionService.name);
 
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrService: QrService,
    private readonly httpService: HttpService,
  ) {}

  /** Crea (o recupera) la zona y estación demo. Idempotente: se puede llamar N veces. */
  async ensureDemoStation(): Promise<{ stationId: string; stationName: string; zoneName: string }> {
    // 1. Buscar primero por token — puede que ya exista con otro nombre (Estacion_prototipo_v1, etc.)
    const byToken = await this.prisma.station.findUnique({
      where: { token: DEMO_STATION_TOKEN },
      include: { zone: { select: { name: true } } },
    });

    if (byToken) {
      return { stationId: byToken.id, stationName: byToken.name, zoneName: byToken.zone.name };
    }

    // 2. Si no existe, hacer upsert de zona demo y crear la estación
    const zone = await this.prisma.zone.upsert({
      where:  { name: DEMO_ZONE_NAME },
      update: {},
      create: { name: DEMO_ZONE_NAME, isActive: true },
    });

    const station = await this.prisma.station.create({
      data: {
        name:     DEMO_STATION_NAME,
        location: 'Demo — Recycle_AI prototipo',
        status:   'ACTIVE',
        capacity: 100,
        token:    DEMO_STATION_TOKEN,
        zoneId:   zone.id,
      },
    });

    return { stationId: station.id, stationName: station.name, zoneName: zone.name };
  }


  async registrarEvento(dto: RegistrarEventoDto) {
    const evento = await this.prisma.eventoClasificacion.create({
      data: {
        categoria: dto.categoria,
        confianza: dto.confianza,
        stationId: dto.stationId,
        ...(dto.timestamp && { timestamp: new Date(dto.timestamp) }),
      },
    });
    
    const qr = await this.qrService.generarQR(dto.categoria, dto.stationId, dto.peso);
    
    this.dispararESP32(qr.codigo, dto.categoria).catch((err) =>
      this.logger.warn(`No se pudo activar el ESP32: ${err.message}`),
    );

    return {
      ...evento,
      qr,
    };
  }

private async dispararESP32(qrCodigo: string, categoria: string) {
    const normalized = normalizeCategoria(categoria);
    const servoId = CATEGORIA_TO_SERVO[normalized];
    if (!servoId) {
      this.logger.warn(`Categoria sin servo asignado: ${categoria} (normalized: ${normalized})`);
      return;
    }
  
    try {
      const response = await firstValueFrom(
        this.httpService.post(ESP32_URL, { qrUrl: qrCodigo, servoId }),
      );
      this.logger.log(`ESP32 activado: servo ${servoId} — ${JSON.stringify(response.data)}`);
    } catch (err) {
      const axiosErr = err as AxiosError;
      this.logger.warn(`Fallo al activar ESP32: ${axiosErr.message}`);
      throw axiosErr;
    }
  }
  
  async obtenerEventos(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.eventoClasificacion.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { station: { select: { name: true, zone: { select: { name: true } } } } },
      }),
      this.prisma.eventoClasificacion.count(),
    ]);

    return { data, total, page, limit };
  }
}
