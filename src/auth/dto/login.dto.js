import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Registered email address', example: 'charlie@ats.com' })
  @IsEmail()
  @IsNotEmpty()
  email;

  @ApiProperty({ description: 'Account password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password;
}
