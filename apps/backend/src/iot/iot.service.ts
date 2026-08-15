import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivarEstacionDto } from './dto/activar-estacion.dto';
import { PingIotDto } from './dto/ping-iot.dto';
import { TelemetriaDto } from './dto/telemetria.dto';
import { StationStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Activación Zero-Touch de la estación ESP32 al conectar a Internet por primera vez.
   * Vincula la dirección MAC con el provisioningToken y transiciona a ACTIVE.
   */
  async activarEstacion(dto: ActivarEstacionDto) {
    const macFormatted = dto.macAddress.trim().toUpperCase();
    const tokenClean = dto.provisioningToken.trim();

    const station = await this.prisma.station.findFirst({
      where: {
        provisioningToken: tokenClean,
      },
    });

    if (!station) {
      this.logger.warn(`Intento de activación fallido: provisioningToken inválido (${tokenClean})`);
      throw new UnauthorizedException('Token de aprovisionamiento inválido');
    }

    if (station.macAddress && station.macAddress.toUpperCase() !== macFormatted) {
      this.logger.warn(`Intento de activación fallido: MAC ${macFormatted} no coincide con ${station.macAddress}`);
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

    this.logger.log(`Estación ${updated.name} (${updated.id}) activada exitosamente con MAC ${macFormatted}`);

    return {
      status: StationStatus.ACTIVE,
      stationId: updated.id,
      stationName: updated.name,
      token: updated.token,
      deviceSecret: updated.deviceSecret,
      message: 'Estación activada exitosamente',
    };
  }

  /**
   * Heartbeat / Ping periódico desde el microcontrolador ESP32
   */
  async ping(dto: PingIotDto) {
    if (dto.provisioningToken) {
      return this.activarEstacion({
        macAddress: dto.macAddress,
        provisioningToken: dto.provisioningToken,
      });
    }

    const macFormatted = dto.macAddress.trim().toUpperCase();

    const station = await this.prisma.station.findFirst({
      where: {
        OR: [
          { macAddress: macFormatted },
          ...(dto.token ? [{ token: dto.token }] : []),
        ],
      },
    });

    if (!station) {
      throw new NotFoundException('Estación no encontrada para el ping');
    }

    if (dto.token && station.token && station.token !== dto.token) {
      throw new UnauthorizedException('Token de estación no coincide');
    }

    const now = new Date();
    const newStatus =
      station.status === StationStatus.PENDING_ACTIVATION
        ? StationStatus.ACTIVE
        : station.status === StationStatus.OFFLINE
        ? StationStatus.ACTIVE
        : station.status;

    const updated = await this.prisma.station.update({
      where: { id: station.id },
      data: {
        lastPingAt: now,
        status: newStatus,
      },
    });

    return {
      status: updated.status,
      stationId: updated.id,
      ping: 'ok',
      lastPingAt: updated.lastPingAt,
    };
  }

  /**
   * Ingesta periódica de telemetría de sensores ultrasónicos de nivel de llenado.
   * Dispara alertas automáticas (StationStatus.WARNING) si cualquier nivel >= 80%.
   */
  async registrarTelemetria(dto: TelemetriaDto) {
    const macFormatted = dto.macAddress.trim().toUpperCase();
    const tokenClean = dto.token.trim();

    const station = await this.prisma.station.findFirst({
      where: {
        macAddress: macFormatted,
        token: tokenClean,
      },
    });

    if (!station) {
      this.logger.warn(`Telemetría rechazada: credenciales inválidas para MAC ${macFormatted}`);
      throw new UnauthorizedException('Credenciales de estación inválidas (MAC o Token incorrecto)');
    }

    const nivelPapel = dto.levels?.papel ?? dto.nivelPapel ?? 0;
    const nivelPlastico = dto.levels?.plastico ?? dto.nivelPlastico ?? 0;
    const nivelMetal = dto.levels?.metal ?? dto.nivelMetal ?? 0;
    const bateria = dto.bateria ?? 100;
    const temperatura = dto.temperatura ?? null;

    const maxLevel = Math.max(nivelPapel, nivelPlastico, nivelMetal);
    const avgLevel = (nivelPapel + nivelPlastico + nivelMetal) / 3;
    const isWarning = maxLevel >= 80 || avgLevel >= 80;

    let newStatus = station.status;
    if (isWarning) {
      newStatus = StationStatus.WARNING;
    } else if (station.status === StationStatus.WARNING || station.status === StationStatus.PENDING_ACTIVATION || station.status === StationStatus.OFFLINE) {
      newStatus = StationStatus.ACTIVE;
    }

    const newCapacity = Math.max(0, Math.min(100, Math.round(100 - avgLevel)));
    const now = new Date();

    const [telemetria, updatedStation] = await this.prisma.$transaction([
      this.prisma.telemetria.create({
        data: {
          stationId: station.id,
          nivelPapel,
          nivelPlastico,
          nivelMetal,
          bateria,
          temperatura,
          timestamp: now,
        },
      }),
      this.prisma.station.update({
        where: { id: station.id },
        data: {
          status: newStatus,
          capacity: newCapacity,
          lastPingAt: now,
        },
      }),
    ]);

    if (isWarning) {
      this.logger.warn(
        `Alerta de capacidad crítica en estación ${updatedStation.name} (${updatedStation.id}): Nivel máximo ${maxLevel}%. Estado cambiado a WARNING.`,
      );
    }

    return {
      recorded: true,
      telemetriaId: telemetria.id,
      stationId: updatedStation.id,
      stationStatus: updatedStation.status,
      warning: isWarning,
      levels: {
        papel: nivelPapel,
        plastico: nivelPlastico,
        metal: nivelMetal,
      },
      maxLevel,
      avgLevel: Math.round(avgLevel * 100) / 100,
      capacity: updatedStation.capacity,
      bateria,
      temperatura,
      lastPingAt: updatedStation.lastPingAt,
    };
  }
}
