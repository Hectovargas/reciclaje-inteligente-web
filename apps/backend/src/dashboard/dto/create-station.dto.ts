import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateStationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zoneId!: string;
}

export class UpdateStationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'WARNING', 'OFFLINE'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zoneId?: string;
}
