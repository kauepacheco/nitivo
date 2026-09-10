import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class UpdatePublicProfileDto {
  @ApiProperty({
    example: '5511999990001',
    description:
      'Telefone operacional contendo somente números; DDI 55 é incluído para números brasileiros com DDD',
  })
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsString()
  @Matches(/^[0-9]{10,15}$/, {
    message: 'operationalContactPhone deve ter entre 10 e 15 números',
  })
  operationalContactPhone: string;
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export class PublicProfileDto {
  @ApiProperty({ example: '5511999990001', nullable: true })
  operationalContactPhone: string | null;
}

export class PublicServiceOfferingDto {
  @ApiProperty({ example: 'cm123' })
  id: string;

  @ApiProperty({ example: 'Lavagem completa' })
  name: string;

  @ApiProperty({ example: 7500, description: 'Preço inteiro em centavos' })
  priceInCents: number;

  @ApiProperty({ example: 90 })
  durationInMinutes: number;
}

export class PublicCarWashPageDto {
  @ApiProperty({ example: 'Lavação Horizonte' })
  name: string;

  @ApiProperty({ example: '5511999990001', nullable: true })
  operationalContactPhone: string | null;

  @ApiProperty({ type: [PublicServiceOfferingDto] })
  services: PublicServiceOfferingDto[];
}
