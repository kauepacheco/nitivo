import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ServiceOfferingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Preço inteiro em centavos' })
  priceInCents: number;

  @ApiProperty()
  durationInMinutes: number;

  @ApiProperty()
  active: boolean;
}

export class CreateServiceOfferingDto {
  @ApiProperty({ example: 'Lavagem completa' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 7500, description: 'Preço inteiro em centavos' })
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  priceInCents: number;

  @ApiProperty({ example: 90 })
  @IsInt()
  @Min(1)
  @Max(1440)
  durationInMinutes: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  active: boolean;
}

export class UpdateServiceOfferingDto extends CreateServiceOfferingDto {}
