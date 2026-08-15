import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createZoneDto: CreateZoneDto) {
    const existing = await this.prisma.zone.findUnique({
      where: { name: createZoneDto.name },
    });
    if (existing) {
      throw new ConflictException('Zone name already exists');
    }
    return this.prisma.zone.create({
      data: createZoneDto,
    });
  }

  async findAll(includeInactive: boolean = false) {
    return this.prisma.zone.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        _count: {
          select: { stations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        stations: true
      }
    });
    if (!zone) {
      throw new NotFoundException('Zone not found');
    }
    return zone;
  }

  async update(id: string, updateZoneDto: UpdateZoneDto) {
    // Check if zone exists
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException('Zone not found');
    }

    if (updateZoneDto.isActive === false) {
      // Check if there are active stations
      const activeStationsCount = await this.prisma.station.count({
        where: {
          zoneId: id,
          status: { not: 'OFFLINE' }
        }
      });
      if (activeStationsCount > 0) {
        throw new ConflictException('Cannot deactivate zone with active stations. Please reassign or offline the stations first.');
      }
    }

    if (updateZoneDto.name) {
      const existing = await this.prisma.zone.findFirst({
        where: { name: { equals: updateZoneDto.name, mode: 'insensitive' }, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Zone name already exists');
      }
    }

    return this.prisma.zone.update({
      where: { id },
      data: updateZoneDto,
    });
  }
}
