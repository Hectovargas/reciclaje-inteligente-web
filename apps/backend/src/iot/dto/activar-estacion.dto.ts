import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivarEstacionDto {
  @ApiProperty({
    example: 'AA:BB:CC:DD:EE:FF',
    description: 'Dirección MAC del microcontrolador ESP32',
  })
  @IsString()
  @IsNotEmpty()
  macAddress!: string;

  @ApiProperty({
    example: 'prov_1234567890abcdef',
    description: 'Token de aprovisionamiento temporal generado de fábrica',
  })
  @IsString()
  @IsNotEmpty()
  provisioningToken!: string;
}
