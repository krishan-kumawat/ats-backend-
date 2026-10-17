import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsIn, Min } from 'class-validator';
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
  @IsUUID()
  @IsOptional()
  departmentId;

  @ApiProperty({
    description: 'Budget limit allocated for this job',
    example: 150000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  budgetLimit;

  @ApiProperty({
    description: 'Work mode arrangement',
    enum: ['On-site', 'Remote', 'Hybrid'],
    example: 'On-site',
    default: 'On-site',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['On-site', 'Remote', 'Hybrid'])
  workMode;

  @ApiProperty({
    description: 'Minimum salary (must be >= 0)',
    example: 80000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMin;

  @ApiProperty({
    description: 'Maximum salary (must be >= salaryMin)',
    example: 120000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMax;
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
    description: 'Budget limit allocated for this job',
    example: 150000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  budgetLimit;

  @ApiProperty({ description: 'Job status', example: 'Open', required: false })
  @IsString()
  @IsOptional()
  status;

  @ApiProperty({
    description: 'Work mode arrangement',
    enum: ['On-site', 'Remote', 'Hybrid'],
    example: 'On-site',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['On-site', 'Remote', 'Hybrid'])
  workMode;

  @ApiProperty({
    description: 'Minimum salary (must be >= 0)',
    example: 80000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMin;

  @ApiProperty({
    description: 'Maximum salary (must be >= salaryMin)',
    example: 120000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMax;
}





