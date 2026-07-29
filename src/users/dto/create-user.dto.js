import { IsString, IsEmail, IsNotEmpty, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'The unique login email address', example: 'charlie@ats.com' })
  @IsEmail()
  @IsNotEmpty()
  email;

  @ApiProperty({ description: 'Password, minimum 6 characters', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password;

  @ApiProperty({ description: 'First name of the user', example: 'Charlie' })
  @IsString()
  @IsNotEmpty()
  firstName;

  @ApiProperty({ description: 'Last name of the user', example: 'Brown' })
  @IsString()
  @IsNotEmpty()
  lastName;

  @ApiProperty({
    description: 'The department UUID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  departmentId;

  @ApiProperty({
    description: 'The hierarchical role UUID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  roleId;

  @ApiProperty({
    description: 'The baseline profile UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  profileId;
}

export class UpdateUserDto {
  @ApiProperty({ description: 'Email address', example: 'charlie@ats.com', required: false })
  @IsEmail()
  @IsOptional()
  email;

  @ApiProperty({ description: 'Password', example: 'password123', required: false })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password;

  @ApiProperty({ description: 'First name', example: 'Charlie', required: false })
  @IsString()
  @IsOptional()
  firstName;

  @ApiProperty({ description: 'Last name', example: 'Brown', required: false })
  @IsString()
  @IsOptional()
  lastName;

  @ApiProperty({
    description: 'Department UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  departmentId;

  @ApiProperty({
    description: 'Hierarchical role UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  roleId;

  @ApiProperty({
    description: 'Baseline profile UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  profileId;
}
