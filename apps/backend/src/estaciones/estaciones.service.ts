import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvisioningService } from '../provisioning/provisioning.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { StationStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class EstacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioningService: ProvisioningService,
  ) {}

  async findAll(filter?: { zoneId?: string; status?: StationStatus }) {
    const where: any = {};
    if (filter?.zoneId) where.zoneId = filter.zoneId;
    if (filter?.status) where.status = filter.status;

    const stations = await this.prisma.station.findMany({
      where,
      include: {
        zone: true,
        events: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
        telemetrias: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stations.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      status: s.status,
      capacity: s.capacity,
      token: s.token,
      macAddress: s.macAddress,
      provisioningToken: s.provisioningToken,
      lastPingAt: s.lastPingAt,
      zoneId: s.zoneId,
      zone: s.zone ? { id: s.zone.id, name: s.zone.name, isActive: s.zone.isActive } : null,
      today: s.events?.length || 0,
      lastTelemetry: s.telemetrias?.[0] || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async findOne(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: {
        zone: true,
        events: {
          take: 20,
          orderBy: { timestamp: 'desc' },
        },
        telemetrias: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`Estación con ID ${id} no encontrada`);
    }

    return {
      id: station.id,
      name: station.name,
      location: station.location,
      status: station.status,
      capacity: station.capacity,
      token: station.token,
      macAddress: station.macAddress,
      provisioningToken: station.provisioningToken,
      lastPingAt: station.lastPingAt,
      zoneId: station.zoneId,
      zone: station.zone ? { id: station.zone.id, name: station.zone.name, isActive: station.zone.isActive } : null,
      today: station.events?.length || 0,
      events: station.events,
      telemetrias: station.telemetrias,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
    };
  }

  async create(dto: CreateStationDto) {
    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException(`Zona con ID ${dto.zoneId} no encontrada`);
    }

    if (dto.macAddress) {
      const existingMac = await this.prisma.station.findUnique({
        where: { macAddress: dto.macAddress },
      });
      if (existingMac) {
        throw new ConflictException(`La dirección MAC ${dto.macAddress} ya está registrada`);
      }
    }

    const token = 'tk_' + crypto.randomBytes(16).toString('hex');
    const deviceSecret = 'sec_' + crypto.randomBytes(16).toString('hex');
    const initialStatus = StationStatus.PENDING_ACTIVATION;

    const station = await this.prisma.station.create({
      data: {
        name: dto.name,
        location: dto.location,
        zoneId: dto.zoneId,
        capacity: dto.capacity ?? 100,
        macAddress: dto.macAddress || null,
        status: initialStatus,
        token,
        deviceSecret,
      },
      include: {
        zone: true,
      },
    });

    // Generate 30-min short provision token
    const provResult = await this.provisioningService.generateTokenForStation(station.id, 30);

    return {
      id: station.id,
      name: station.name,
      location: station.location,
      status: station.status,
      capacity: station.capacity,
      token: station.token,
      macAddress: station.macAddress,
      provisioningToken: provResult.token,
      expiresAt: provResult.expiresAt,
      zoneId: station.zoneId,
      zone: station.zone ? { id: station.zone.id, name: station.zone.name, isActive: station.zone.isActive } : null,
      today: 0,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
    };
  }

  async update(id: string, dto: UpdateStationDto) {
    const existing = await this.prisma.station.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Estación con ID ${id} no encontrada`);
    }

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: dto.zoneId },
      });
      if (!zone) {
        throw new NotFoundException(`Zona con ID ${dto.zoneId} no encontrada`);
      }
    }

    if (dto.macAddress && dto.macAddress !== existing.macAddress) {
      const existingMac = await this.prisma.station.findUnique({
        where: { macAddress: dto.macAddress },
      });
      if (existingMac) {
        throw new ConflictException(`La dirección MAC ${dto.macAddress} ya está en uso`);
      }
    }

    const updated = await this.prisma.station.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.zoneId !== undefined && { zoneId: dto.zoneId }),
        ...(dto.macAddress !== undefined && { macAddress: dto.macAddress }),
      },
      include: {
        zone: true,
        events: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      location: updated.location,
      status: updated.status,
      capacity: updated.capacity,
      token: updated.token,
      macAddress: updated.macAddress,
      provisioningToken: updated.provisioningToken,
      lastPingAt: updated.lastPingAt,
      zoneId: updated.zoneId,
      zone: updated.zone ? { id: updated.zone.id, name: updated.zone.name, isActive: updated.zone.isActive } : null,
      today: updated.events?.length || 0,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.station.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Estación con ID ${id} no encontrada`);
    }

    await this.prisma.telemetria.deleteMany({ where: { stationId: id } });
    await this.prisma.eventoClasificacion.deleteMany({ where: { stationId: id } });
    await this.prisma.station.delete({ where: { id } });

    return {
      message: `Estación ${existing.name} (${id}) eliminada exitosamente`,
      id,
    };
  }

  async regenerarToken(id: string) {
    const existing = await this.prisma.station.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Estación con ID ${id} no encontrada`);
    }

    const provResult = await this.provisioningService.generateTokenForStation(id, 30);

    // If station was not yet active, ensure it stays in PENDING_ACTIVATION
    if (existing.status !== StationStatus.ACTIVE) {
      await this.prisma.station.update({
        where: { id },
        data: { status: StationStatus.PENDING_ACTIVATION },
      });
    }

    return {
      message: 'Token de aprovisionamiento regenerado exitosamente (válido por 30 minutos)',
      token: provResult.token,
      provisioningToken: provResult.token,
      expiresAt: provResult.expiresAt,
      stationId: id,
    };
  }

  async revokeToken(id: string) {
    const existing = await this.prisma.station.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Estación con ID ${id} no encontrada`);
    }

    const newToken = 'tk_' + crypto.randomBytes(16).toString('hex');
    const provResult = await this.provisioningService.generateTokenForStation(id, 30);

    const updated = await this.prisma.station.update({
      where: { id },
      data: {
        token: newToken,
      },
      include: { zone: true },
    });

    return {
      message: 'Token de acceso revocado y regenerado exitosamente',
      token: updated.token,
      provisioningToken: provResult.token,
      expiresAt: provResult.expiresAt,
      station: {
        id: updated.id,
        name: updated.name,
        token: updated.token,
        provisioningToken: provResult.token,
        status: updated.status,
      },
    };
  }

  async activarEstacion(dto: { macAddress: string; provisioningToken: string }) {
    const macFormatted = dto.macAddress.trim().toUpperCase();
    const tokenClean = dto.provisioningToken.trim();

    const station = await this.prisma.station.findFirst({
      where: {
        provisioningToken: tokenClean,
      },
    });

    if (!station) {
      throw new UnauthorizedException('Token de aprovisionamiento inválido');
    }

    if (station.macAddress && station.macAddress.toUpperCase() !== macFormatted) {
      throw new UnauthorizedException('La dirección MAC no coincide con la registrada para esta estación');
    }

    const deviceSecret = station.deviceSecret || 'sec_' + crypto.randomBytes(16).toString('hex');
    const now = new Date();

    const updated = await this.prisma.station.update({
      where: { id: station.id },
      data: {
        macAddress: macFormatted,
        status: StationStatus.ACTIVE,
        lastPingAt: now,
        deviceSecret,
      },
    });

    return {
      status: StationStatus.ACTIVE,
      stationId: updated.id,
      stationName: updated.name,
      token: updated.token,
      deviceSecret: updated.deviceSecret,
      message: 'Estación activada exitosamente',
    };
  }
}
