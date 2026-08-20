import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProvisionDeviceDto {
  @ApiProperty({
    example: 'ABC123',
    description: 'Token corto de aprovisionamiento de 6-8 caracteres asignado a la estación',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token de aprovisionamiento es obligatorio' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  token!: string;

  @ApiProperty({
    example: '24:6F:28:1A:BC:DE',
    description: 'Dirección MAC física del microcontrolador ESP32',
  })
  @IsString()
  @IsNotEmpty({ message: 'La dirección MAC del dispositivo es obligatoria' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  mac!: string;

  @ApiPropertyOptional({
    example: '24:6F:28:1A:BC:DE',
    description: 'Alias opcional para compatibilidad con macAddress',
  })
  @IsOptional()
  @IsString()
  macAddress?: string;
}
