import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsBoolean,
  IsArray,
  IsInt,
  IsString,
  IsIn,
  IsOptional,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateBoxDto {
  @ApiProperty({ example: 'Box principal' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

export class UpdateBoxDto {
  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}

export class WeeklyHoursDto {
  @ApiProperty({ minimum: 0, maximum: 6, description: '0 é domingo' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: '08:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  opensAt!: string;

  @ApiProperty({ example: '18:00' })
  @Matches(/^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/)
  closesAt!: string;
}

export class UpdateSchedulingSettingsDto {
  @ApiProperty({ default: 60 })
  @IsInt()
  @Min(0)
  @Max(10080)
  minimumBookingNoticeMinutes!: number;

  @ApiProperty({ default: 30 })
  @IsInt()
  @Min(1)
  @Max(365)
  bookingHorizonDays!: number;

  @ApiProperty({ default: 120 })
  @IsInt()
  @Min(0)
  @Max(10080)
  changeNoticeMinutes!: number;

  @ApiProperty({ default: 30 })
  @IsInt()
  @Min(5)
  @Max(1440)
  slotIntervalMinutes!: number;

  @ApiProperty({ type: [WeeklyHoursDto] })
  @IsArray()
  @ArrayMaxSize(7)
  @ArrayUnique((hours: WeeklyHoursDto) => hours.weekday)
  @ValidateNested({ each: true })
  @Type(() => WeeklyHoursDto)
  weeklyHours!: WeeklyHoursDto[];
}

export class AvailabilityQueryDto {
  @ApiProperty({ example: 'cm123' })
  @IsString()
  @MinLength(1)
  serviceId!: string;

  @ApiProperty({ example: '2026-09-11' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}

export class BoxDto {
  @ApiProperty({ example: 'cm123' })
  id!: string;

  @ApiProperty({ example: 'Box principal' })
  name!: string;

  @ApiProperty()
  active!: boolean;
}

export class SchedulingSettingsDto extends UpdateSchedulingSettingsDto {
  @ApiProperty({ example: 'America/Sao_Paulo' })
  timezone!: string;

  @ApiProperty({ type: [BoxDto] })
  boxes!: BoxDto[];

  @ApiProperty({ type: () => [OperationalExceptionDto] })
  exceptions!: OperationalExceptionDto[];

  @ApiProperty({ type: () => [AvailabilityBlockDto] })
  blocks!: AvailabilityBlockDto[];
}

export class AvailabilitySlotDto {
  @ApiProperty({ example: '2026-09-11T11:00:00.000Z' })
  startsAt!: string;

  @ApiProperty({ example: '2026-09-11T12:00:00.000Z' })
  endsAt!: string;
}

export class AvailabilityDto {
  @ApiProperty({ example: '2026-09-11' })
  date!: string;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  timezone!: string;

  @ApiProperty({ type: [AvailabilitySlotDto] })
  slots!: AvailabilitySlotDto[];
}

export class UpsertOperationalExceptionDto {
  @ApiProperty({ enum: ['CLOSED', 'SPECIAL_HOURS'] })
  @IsIn(['CLOSED', 'SPECIAL_HOURS'])
  kind!: 'CLOSED' | 'SPECIAL_HOURS';

  @ApiProperty({ required: false, nullable: true, example: '10:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  opensAt?: string;

  @ApiProperty({ required: false, nullable: true, example: '16:00' })
  @IsOptional()
  @Matches(/^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/)
  closesAt?: string;
}

export class CreateAvailabilityBlockDto {
  @ApiProperty({
    required: false,
    description: 'Ausente bloqueia toda a operação',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  boxId?: string;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/)
  startsAt!: string;

  @ApiProperty({ example: '2026-09-18T14:00:00.000Z' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/)
  endsAt!: string;
}

export class OperationalExceptionDto {
  @ApiProperty() date!: string;
  @ApiProperty({ enum: ['CLOSED', 'SPECIAL_HOURS'] })
  kind!: 'CLOSED' | 'SPECIAL_HOURS';
  @ApiProperty({ nullable: true }) opensAt!: string | null;
  @ApiProperty({ nullable: true }) closesAt!: string | null;
}

export class AvailabilityBlockDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true }) boxId!: string | null;
  @ApiProperty() startsAt!: string;
  @ApiProperty() endsAt!: string;
}
