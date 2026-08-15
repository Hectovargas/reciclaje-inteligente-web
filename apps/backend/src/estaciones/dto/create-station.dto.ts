import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateStationDto {
  @ApiProperty({ example: 'Estación Central', description: 'Nombre descriptivo de la estación' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Plaza Principal, Sector A', description: 'Ubicación física de la estación' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: 'uuid-of-zone', description: 'ID de la zona geográfica asignada' })
  @IsString()
  @IsNotEmpty()
  zoneId!: string;

  @ApiPropertyOptional({ example: 'AA:BB:CC:DD:EE:FF', description: 'Dirección MAC del microcontrolador ESP32' })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiPropertyOptional({ example: 100, description: 'Capacidad total de la estación', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
