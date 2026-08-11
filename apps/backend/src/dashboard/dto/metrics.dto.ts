import { ApiProperty } from '@nestjs/swagger';

export class StationDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() location!: string;
  @ApiProperty() status!: string;
  @ApiProperty() capacity!: number;
  @ApiProperty() zoneName!: string;
}

export class MetricsDto {
  @ApiProperty() kgTotal!: number;
  @ApiProperty() kgSaved!: number;
  @ApiProperty() accuracy!: number;
  @ApiProperty() aiConf!: number;
  @ApiProperty() timeBetweenEmptying!: number;
  @ApiProperty() timeBetweenEmptyingPrev!: number;
  @ApiProperty() efficiencyGainPct!: number;
  @ApiProperty() frequency!: string;
  @ApiProperty() minZoneTime!: string;
  @ApiProperty() maxZoneTime!: string;
  @ApiProperty() totalEst!: string;
  @ApiProperty() materialBreakdown!: any;
  @ApiProperty() iaAccuracyBreakdown!: any;
  @ApiProperty() peakData!: any;
  @ApiProperty() feedInit!: any;
  @ApiProperty() zonesData!: any;
}
