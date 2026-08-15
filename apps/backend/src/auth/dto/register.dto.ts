import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@recicla.com', description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password (minimum 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Juan Perez', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
