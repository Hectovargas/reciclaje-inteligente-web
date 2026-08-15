import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarEventoDto {
  @ApiProperty({ example: 'Plástico', description: 'Material category: Papel, Plástico, Metal' })
  @IsString()
  @IsNotEmpty()
  categoria!: string;

  @ApiProperty({ example: 0.98, description: 'AI confidence score between 0 and 1' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confianza!: number;

  @ApiProperty({ example: 'station-uuid', description: 'Station ID where the event occurred' })
  @IsString()
  @IsNotEmpty()
  stationId!: string;

  @ApiPropertyOptional({ example: 0.25, description: 'Peso del material en kilogramos' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  peso?: number;

  @ApiPropertyOptional({ example: '2026-08-10T12:00:00Z' })
  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class EventoResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() categoria!: string;
  @ApiProperty() confianza!: number;
  @ApiProperty() stationId!: string;
  @ApiProperty() timestamp!: Date;
}

export class PaginatedEventosDto {
  @ApiProperty({ type: [EventoResponseDto] }) data!: EventoResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}
