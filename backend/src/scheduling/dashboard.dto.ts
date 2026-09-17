import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

class DashboardPeriodDto {
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
  @ApiProperty() timezone!: string;
}

class DashboardCriteriaDto {
  @ApiProperty() date!: string;
  @ApiProperty() status!: string;
  @ApiProperty() value!: string;
}

export class DashboardDto {
  @ApiProperty({ type: DashboardPeriodDto }) period!: DashboardPeriodDto;
  @ApiProperty({ type: DashboardCriteriaDto }) criteria!: DashboardCriteriaDto;
  @ApiProperty() completed!: number;
  @ApiProperty() canceled!: number;
  @ApiProperty() noShow!: number;
  @ApiProperty() completedServicesValueInCents!: number;
}
