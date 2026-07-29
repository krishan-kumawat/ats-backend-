import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
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
