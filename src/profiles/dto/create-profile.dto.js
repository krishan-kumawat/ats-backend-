import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({ description: 'The unique name of the profile', example: 'Recruiter' })
  @IsString()
  @IsNotEmpty()
  name;

  @ApiProperty({ description: 'Optional description of what this profile represents', example: 'Standard recruiting actions', required: false })
  @IsString()
  @IsOptional()
  description;

  @ApiProperty({ description: 'Optional source profile UUID to clone permissions from', example: '13e3a51e-d293-41a4-a33a-e3b58fdf91e0', required: false })
  @IsUUID()
  @IsOptional()
  sourceProfileId;

  @ApiProperty({ description: 'Optional source profile name to clone permissions from', example: 'ATS Recruiter', required: false })
  @IsString()
  @IsOptional()
  sourceProfileName;
}

export class UpdateProfileDto {
  @ApiProperty({ description: 'The unique name of the profile', example: 'Recruiter', required: false })
  @IsString()
  @IsOptional()
  name;

  @ApiProperty({ description: 'Optional description of what this profile represents', example: 'Standard recruiting actions', required: false })
  @IsString()
  @IsOptional()
  description;
}
