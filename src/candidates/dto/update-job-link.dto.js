import { IsString, IsNumber, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateJobLinkDto {
  @ApiProperty({ description: 'Application status/stage', example: 'Screening', required: false })
  @IsString()
  @IsOptional()
  status;

  @ApiProperty({ description: 'Expected salary from candidate', example: 120000, required: false })
  @IsNumber()
  @IsOptional()
  expectedSalary;

  @ApiProperty({ description: 'Proposed salary for offer', example: 130000, required: false })
  @IsNumber()
  @IsOptional()
  proposedSalary;

  @ApiProperty({ description: 'Proposed equity percentage', example: 0.1, required: false })
  @IsNumber()
  @IsOptional()
  proposedEquity;

  @ApiProperty({ description: 'Candidate referral/tag source', example: 'LinkedIn Referral', required: false })
  @IsString()
  @IsOptional()
  sourceTag;

  @ApiProperty({ description: 'Technical scorecard score (1-5)', example: 4, required: false })
  @IsInt()
  @IsOptional()
  technicalScore;

  @ApiProperty({ description: 'System design scorecard score (1-5)', example: 4, required: false })
  @IsInt()
  @IsOptional()
  systemScore;

  @ApiProperty({ description: 'Culture fit scorecard score (1-5)', example: 5, required: false })
  @IsInt()
  @IsOptional()
  cultureScore;

  @ApiProperty({ description: 'Technical and professional pros description', required: false })
  @IsString()
  @IsOptional()
  pros;

  @ApiProperty({ description: 'Areas of concern or cons description', required: false })
  @IsString()
  @IsOptional()
  cons;

  @ApiProperty({ description: 'Final recommendation level', example: 'HIRE', required: false })
  @IsString()
  @IsOptional()
  recommendation;

  @ApiProperty({ description: 'Founder offer approval status', example: 'PENDING', required: false })
  @IsString()
  @IsOptional()
  approvalStatus;

  @ApiProperty({ description: 'Founder approval/rejection feedback notes', required: false })
  @IsString()
  @IsOptional()
  approvalFeedback;
}
