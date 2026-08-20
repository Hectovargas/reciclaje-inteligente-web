import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvisionDeviceDto } from './dto/provision-device.dto';
import { generateShortProvisionToken, normalizeMacAddress } from './utils/provision-token.util';
import { StationStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a new unique short provisioning token for a station with 30 minutes TTL
   */
  async generateTokenForStation(stationId: string, durationMinutes: number = 30): Promise<{ token: string; expiresAt: Date }> {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      throw new NotFoundException(`Estación con ID ${stationId} no encontrada`);
    }

    // Invalidate previous unused tokens for this station
    await this.prisma.provisionToken.updateMany({
      where: {
        stationId,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Generate unique short token
    let token = generateShortProvisionToken(6);
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.prisma.provisionToken.findUnique({
        where: { token },
      });
      if (!existing) break;
      token = generateShortProvisionToken(6);
      attempts++;
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    await this.prisma.provisionToken.create({
      data: {
        token,
        stationId,
        expiresAt,
        used: false,
      },
    });

    // Mirror to station table for fast lookup & backward compatibility
    await this.prisma.station.update({
      where: { id: stationId },
      data: {
        provisioningToken: token,
      },
    });

    // Do NOT log the plaintext token directly in persistent production logs
    const masked = token.length >= 4 ? `${token.slice(0, 2)}****${token.slice(-1)}` : '****';
    this.logger.log(`Token de aprovisionamiento generado para estación ${stationId} (Token: ${masked})`);

    return { token, expiresAt };
  }

  /**
   * Provisions and activates an ESP32 device
   * Validation Order:
   * 1. Token exists
   * 2. Token expired (410 GONE)
   * 3. Token already used (400 BAD REQUEST)
   * 4. MAC duplicate on another active station (409 CONFLICT)
   */
  async provisionDevice(dto: ProvisionDeviceDto) {
    const rawMac = dto.mac || dto.macAddress || '';
    const cleanToken = dto.token ? dto.token.trim().toUpperCase() : '';
    const formattedMac = normalizeMacAddress(rawMac);

    if (!cleanToken) {
      throw new BadRequestException('El token de aprovisionamiento es obligatorio');
    }
    if (!formattedMac) {
      throw new BadRequestException('La dirección MAC del dispositivo es obligatoria');
    }

    // 1. Validate Token exists
    const tokenRecord = await this.prisma.provisionToken.findUnique({
      where: { token: cleanToken },
      include: { station: true },
    });

    if (!tokenRecord || !tokenRecord.station) {
      throw new NotFoundException('Token de aprovisionamiento no encontrado o inválido');
    }

    // 2. Validate Token expiration (HTTP 410 Gone)
    const now = new Date();
    if (tokenRecord.expiresAt.getTime() <= now.getTime()) {
      throw new HttpException(
        'El token de aprovisionamiento ha expirado. Por favor solicita la regeneración del token desde el panel administrativo.',
        HttpStatus.GONE,
      );
    }

    // 3. Validate Token is not already used
    if (tokenRecord.used) {
      throw new BadRequestException('El token de aprovisionamiento ya fue utilizado');
    }

    // 4. Validate MAC duplicate on another ACTIVE station
    const existingStationWithMac = await this.prisma.station.findUnique({
      where: { macAddress: formattedMac },
    });

    if (existingStationWithMac && existingStationWithMac.id !== tokenRecord.stationId) {
      if (existingStationWithMac.status === StationStatus.ACTIVE) {
        throw new ConflictException(
          `La dirección MAC ${formattedMac} ya está asociada a otra estación activa (${existingStationWithMac.name})`,
        );
      }
    }

    // Generate runtime API key & deviceSecret if not present
    const runtimeToken =
      tokenRecord.station.token || 'tk_' + crypto.randomBytes(16).toString('hex');
    const deviceSecret =
      tokenRecord.station.deviceSecret || 'sec_' + crypto.randomBytes(16).toString('hex');

    // Mark token as used
    await this.prisma.provisionToken.update({
      where: { id: tokenRecord.id },
      data: {
        used: true,
        associatedMac: formattedMac,
      },
    });

    // Update station to ACTIVE and store credentials
    const updatedStation = await this.prisma.station.update({
      where: { id: tokenRecord.stationId },
      data: {
        status: StationStatus.ACTIVE,
        macAddress: formattedMac,
        lastPingAt: now,
        token: runtimeToken,
        deviceSecret: deviceSecret,
      },
      include: {
        zone: true,
      },
    });

    this.logger.log(`Dispositivo MAC ${formattedMac} aprovisionado con éxito en estación ${updatedStation.name} (${updatedStation.id})`);

    return {
      status: StationStatus.ACTIVE,
      stationId: updatedStation.id,
      stationName: updatedStation.name,
      location: updatedStation.location,
      zone: updatedStation.zone ? { id: updatedStation.zone.id, name: updatedStation.zone.name } : null,
      macAddress: updatedStation.macAddress,
      token: runtimeToken,
      apiKey: runtimeToken,
      deviceSecret: deviceSecret,
      mqtt: {
        topicTelemetry: `cleancity/stations/${updatedStation.id}/telemetria`,
        topicEvents: `cleancity/stations/${updatedStation.id}/eventos`,
      },
      telemetryEndpoint: '/api/v1/iot/telemetria',
      message: 'Estación aprovisionada y activada exitosamente',
    };
  }

  /**
   * Cleanup expired unused tokens older than 24 hours
   */
  async cleanupExpiredTokens(): Promise<{ count: number }> {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.provisionToken.deleteMany({
      where: {
        expiresAt: { lt: threshold },
        used: false,
      },
    });
    return { count: result.count };
  }
}
