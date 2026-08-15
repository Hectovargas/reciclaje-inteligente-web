import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FillLevelsDto {
  @ApiProperty({
    example: 45.5,
    description: 'Nivel de llenado compartimento papel en porcentaje (0-100%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  papel!: number;

  @ApiProperty({
    example: 82.0,
    description: 'Nivel de llenado compartimento plástico en porcentaje (0-100%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  plastico!: number;

  @ApiProperty({
    example: 20.0,
    description: 'Nivel de llenado compartimento metal en porcentaje (0-100%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  metal!: number;
}

export class TelemetriaDto {
  @ApiProperty({
    example: 'AA:BB:CC:DD:EE:FF',
    description: 'Dirección MAC del microcontrolador ESP32',
  })
  @IsString()
  @IsNotEmpty()
  macAddress!: string;

  @ApiProperty({
    example: 'tk_abcdef123456',
    description: 'Token de autenticación de la estación',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiPropertyOptional({
    type: FillLevelsDto,
    description: 'Niveles de llenado por compartimento (papel, plástico, metal)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FillLevelsDto)
  levels?: FillLevelsDto;

  @ApiPropertyOptional({
    example: 45.5,
    description: 'Nivel directo compartimento papel en porcentaje',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  nivelPapel?: number;

  @ApiPropertyOptional({
    example: 82.0,
    description: 'Nivel directo compartimento plástico en porcentaje',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  nivelPlastico?: number;

  @ApiPropertyOptional({
    example: 20.0,
    description: 'Nivel directo compartimento metal en porcentaje',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  nivelMetal?: number;

  @ApiPropertyOptional({
    example: 95.0,
    description: 'Nivel de batería restante (0-100%)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bateria?: number;

  @ApiPropertyOptional({
    example: 24.5,
    description: 'Temperatura ambiental (°C)',
  })
  @IsOptional()
  @IsNumber()
  temperatura?: number;
}
