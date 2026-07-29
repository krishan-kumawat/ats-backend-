import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignJobDto {
  @ApiProperty({
    description: 'The Job UUID to associate this candidate with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  jobId;

  @ApiProperty({
    description: 'Hiring process status',
    example: 'Applied',
    required: false,
  })
  @IsString()
  @IsOptional()
  status;
}
