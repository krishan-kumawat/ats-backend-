import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
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
    description: 'The department name (optional)',
    example: 'HR',
    required: false,
  })
  @IsString()
  @IsOptional()
  departmentName;

  @ApiProperty({
    description: 'The hierarchical role name (optional)',
    example: 'Recruiter',
    required: false,
  })
  @IsString()
  @IsOptional()
  roleName;

  @ApiProperty({
    description: 'The baseline profile name (e.g. Admin, Recruiter, Hiring Manager)',
    example: 'Recruiter',
  })
  @IsString()
  @IsNotEmpty()
  profileName;
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
    description: 'Department name',
    example: 'HR',
    required: false,
  })
  @IsString()
  @IsOptional()
  departmentName;

  @ApiProperty({
    description: 'Hierarchical role name',
    example: 'Recruiter',
    required: false,
  })
  @IsString()
  @IsOptional()
  roleName;

  @ApiProperty({
    description: 'Baseline profile name',
    example: 'Recruiter',
    required: false,
  })
  @IsString()
  @IsOptional()
  profileName;
}
