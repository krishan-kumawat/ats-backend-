import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateJobDto {
  @ApiProperty({ description: 'The title of the job opening', example: 'Senior NestJS Developer' })
  @IsString()
  @IsNotEmpty()
  title;


  @ApiProperty({
    description: 'Detailed description of the responsibilities and requirements',
    example: 'We are looking for a backend architect...',
    required: false,
  })
  @IsString()
  @IsOptional()
  description;


  @ApiProperty({
    description: 'Associated department UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @ApiProperty({
    description: 'Budget allocated for this job',
    example: 150000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  budget;


  @IsUUID()
  @IsOptional()
  departmentId;
}


export class UpdateJobDto {
  @ApiProperty({ description: 'The title of the job opening', example: 'Senior NestJS Developer', required: false })
  @IsString()
  @IsOptional()
  title;


  @ApiProperty({
    description: 'Detailed description of the responsibilities and requirements',
    example: 'We are looking for a backend architect...',
    required: false,
  })
  @IsString()
  @IsOptional()
  description;


  @ApiProperty({
    description: 'Associated department UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  departmentId;


  @ApiProperty({
    description: 'Budget allocated for this job',
    example: 150000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  budget;


  @ApiProperty({ description: 'Job status', example: 'Open', required: false })
  @IsString()
  @IsOptional()
  status;
}



