import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@recicla.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
