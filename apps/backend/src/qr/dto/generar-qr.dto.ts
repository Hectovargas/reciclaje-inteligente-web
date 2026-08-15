import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerarQrDto {
  @ApiProperty({
    example: 'Plástico',
    description: 'Categoría o material reciclado: Papel, Plástico, Metal, etc.',
  })
  @IsString()
  @IsNotEmpty()
  categoria!: string;

  @ApiPropertyOptional({
    example: 'station-uuid-1234',
    description: 'ID de la estación física que detectó el residuo',
  })
  @IsOptional()
  @IsString()
  stationId?: string;

  @ApiPropertyOptional({
    example: 0.35,
    description: 'Peso del material en kilogramos',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  peso?: number;
}
