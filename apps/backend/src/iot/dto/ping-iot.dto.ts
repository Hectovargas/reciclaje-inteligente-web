import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PingIotDto {
  @ApiProperty({
    example: 'AA:BB:CC:DD:EE:FF',
    description: 'Dirección MAC del microcontrolador ESP32',
  })
  @IsString()
  @IsNotEmpty()
  macAddress!: string;

  @ApiPropertyOptional({
    example: 'tk_abcdef123456',
    description: 'Token de acceso permanente asignado a la estación',
  })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({
    example: 'prov_1234567890abcdef',
    description: 'Token de aprovisionamiento si la estación aún está pendiente de activación',
  })
  @IsOptional()
  @IsString()
  provisioningToken?: string;
}
