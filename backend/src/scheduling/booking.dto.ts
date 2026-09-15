import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description:
      'UUID aleatório da tentativa. Repetir o mesmo corpo/chave em falha de rede; reenvio por até 15 minutos. Nunca é credencial de consulta.',
  })
  @IsUUID('4')
  attemptId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  serviceId!: string;

  @ApiProperty({
    example: '2026-09-12T12:00:00.000Z',
    description: 'Instante UTC retornado pela disponibilidade',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/)
  startsAt!: string;

  @ApiProperty({ example: 'Cliente Fictício' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: '11999990001',
    description: 'Telefone com DDD, somente dígitos; não verificado',
  })
  @Matches(/^[0-9]{10,15}$/)
  phone!: string;

  @ApiProperty({ example: 'ABC1D23' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.toUpperCase().replace(/[-\s]/g, '')
      : value,
  )
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/)
  plate!: string;
}

export class AgendaQueryDto {
  @ApiPropertyOptional({
    description: 'Dia local da lavação. Padrão: hoje.',
    example: '2026-09-12',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

export class UpdateCustomerVehicleDto extends PickType(CreateBookingDto, [
  'name',
  'phone',
  'plate',
] as const) {}

export class BookingReceiptDto {
  @ApiProperty() id!: string;
  @ApiProperty() carWashName!: string;
  @ApiProperty({ example: '5511999990001', nullable: true })
  operationalContactPhone!: string | null;
  @ApiProperty() timezone!: string;
  @ApiProperty() changeNoticeMinutes!: number;
  @ApiProperty() serviceName!: string;
  @ApiProperty() servicePriceInCents!: number;
  @ApiProperty() serviceDurationInMinutes!: number;
  @ApiProperty() startsAt!: string;
  @ApiProperty() endsAt!: string;
  @ApiProperty({ enum: ['CONFIRMED'] }) status!: string;
}
export class AgendaCustomerDto {
  @ApiProperty() name!: string;
  @ApiProperty() phone!: string;
}
export class AgendaVehicleDto {
  @ApiProperty() plate!: string;
}
export class CustomerVehicleDto {
  @ApiProperty({ type: AgendaCustomerDto }) customer!: AgendaCustomerDto;
  @ApiProperty({ type: AgendaVehicleDto }) vehicle!: AgendaVehicleDto;
}
export class AgendaAppointmentDto {
  @ApiProperty() id!: string;
  @ApiProperty() startsAt!: string;
  @ApiProperty() endsAt!: string;
  @ApiProperty() serviceName!: string;
  @ApiProperty() servicePriceInCents!: number;
  @ApiProperty() serviceDurationInMinutes!: number;
  @ApiProperty() status!: string;
  @ApiProperty() origin!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: AgendaCustomerDto, nullable: true })
  customer!: AgendaCustomerDto | null;
  @ApiProperty({ type: AgendaVehicleDto, nullable: true })
  vehicle!: AgendaVehicleDto | null;
  @ApiProperty({ example: { name: 'Box principal' } }) box!: { name: string };
}
export class AgendaDto {
  @ApiProperty() date!: string;
  @ApiProperty() timezone!: string;
  @ApiProperty({ type: [AgendaAppointmentDto] })
  appointments!: AgendaAppointmentDto[];
  @ApiProperty({
    type: [AgendaAppointmentDto],
    description: 'Até 20 reservas confirmadas a partir de agora',
  })
  upcoming!: AgendaAppointmentDto[];
}
