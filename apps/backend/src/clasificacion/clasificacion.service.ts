import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarEventoDto } from './dto/clasificacion.dto';
import { QrService } from '../qr/qr.service';

const DEMO_ZONE_NAME    = 'Zona Demo';
const DEMO_STATION_NAME = 'Prototipo Recycle_AI';
const DEMO_STATION_TOKEN = 'tk_prototipo_v1_recycle_ai_2026';

@Injectable()
export class ClasificacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrService: QrService,
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
    
    return {
      ...evento,
      qr,
    };
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
