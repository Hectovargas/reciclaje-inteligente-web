import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarEventoDto } from './dto/clasificacion.dto';
import { QrService } from '../qr/qr.service';

@Injectable()
export class ClasificacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrService: QrService,
  ) {}

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
