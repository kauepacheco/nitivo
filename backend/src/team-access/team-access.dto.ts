import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class InviteEmployeeDto {
  @ApiProperty({ example: 'funcionaria@example.test' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class AcceptNewEmployeeInvitationDto {
  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
