import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { StationStatus } from '@prisma/client';

export class UpdateStationDto {
  @ApiPropertyOptional({ example: 'Estación Central Renovada', description: 'Nombre descriptivo de la estación' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Plaza Principal, Sector B', description: 'Ubicación física de la estación' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: StationStatus, example: StationStatus.ACTIVE, description: 'Estado operativo de la estación' })
  @IsOptional()
  @IsEnum(StationStatus)
  status?: StationStatus;

  @ApiPropertyOptional({ example: 150, description: 'Capacidad total de la estación' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'uuid-of-new-zone', description: 'ID de la nueva zona asignada' })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional({ example: 'AA:BB:CC:DD:EE:01', description: 'Dirección MAC del dispositivo ESP32' })
  @IsOptional()
  @IsString()
  macAddress?: string;
}
