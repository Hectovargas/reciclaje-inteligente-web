import { PartialType } from '@nestjs/swagger';
import { CreateZoneDto } from './create-zone.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateZoneDto extends PartialType(CreateZoneDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
