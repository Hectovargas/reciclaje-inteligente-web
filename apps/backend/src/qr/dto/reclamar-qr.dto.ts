import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReclamarQrDto {
  @ApiProperty({
    example: 'QR-PLASTICO-1723680000-abcd1234',
    description: 'Código único o token del código QR emitido',
  })
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @ApiPropertyOptional({
    example: '0x1234567890abcdef...',
    description: 'Firma ECDSA (opcional si ya está registrada en el token emitido)',
  })
  @IsOptional()
  @IsString()
  firma?: string;
}
