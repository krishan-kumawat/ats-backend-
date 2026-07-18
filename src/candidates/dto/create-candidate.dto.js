import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCandidateDto {
  @ApiProperty({ description: 'Candidate first name', example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName;

  @ApiProperty({ description: 'Candidate last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName;

  @ApiProperty({ description: 'Candidate email address', example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email;

  @ApiProperty({ description: 'Candidate phone number', example: '+15550199', required: false })
  @IsString()
  @IsOptional()
  phone;
}

export class UpdateCandidateDto {
  @ApiProperty({ description: 'Candidate first name', example: 'Jane', required: false })
  @IsString()
  @IsOptional()
  firstName;

  @ApiProperty({ description: 'Candidate last name', example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName;

  @ApiProperty({ description: 'Candidate email address', example: 'jane.doe@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email;

  @ApiProperty({ description: 'Candidate phone number', example: '+15550199', required: false })
  @IsString()
  @IsOptional()
  phone;
}
