import { IsString, IsEmail, IsNotEmpty, IsOptional, IsArray, IsUUID, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCandidateDto {
  @ApiProperty({ description: 'Associated Job opening ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  jobId;

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

  @ApiProperty({ description: 'Current location', example: 'Bengaluru, India', required: false })
  @IsString()
  @IsOptional()
  currentLocation;

  @ApiProperty({ description: 'Total experience in years (min 0, step 0.1)', example: 4.5, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalExperience;

  @ApiProperty({ description: 'Current company', example: 'Acme Corp', required: false })
  @IsString()
  @IsOptional()
  currentCompany;

  @ApiProperty({ description: 'Current designation', example: 'Senior Software Engineer', required: false })
  @IsString()
  @IsOptional()
  currentDesignation;

  @ApiProperty({ description: 'LinkedIn profile URL', example: 'https://linkedin.com/in/janedoe', required: false })
  @IsString()
  @IsOptional()
  linkedinUrl;

  @ApiProperty({ description: 'Candidate source', enum: ['LinkedIn', 'Referral', 'Careers Page', 'Job Portal', 'Other'], default: 'LinkedIn', required: false })
  @IsIn(['LinkedIn', 'Referral', 'Careers Page', 'Job Portal', 'Other'])
  @IsOptional()
  source;

  @ApiProperty({ description: 'Candidate status', enum: ['NEW', 'ACTIVE', 'ON_HOLD', 'REJECTED', 'HIRED', 'INACTIVE'], default: 'NEW', required: false })
  @IsIn(['NEW', 'ACTIVE', 'ON_HOLD', 'REJECTED', 'HIRED', 'INACTIVE'])
  @IsOptional()
  candidateStatus;

  @ApiProperty({ description: 'Resume document URL or path', example: 'https://storage.example.com/resumes/resume.pdf', required: false })
  @IsString()
  @IsOptional()
  resumeUrl;

  @ApiProperty({ description: 'Array of candidate skills tags', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills;
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

  @ApiProperty({ description: 'Current location', example: 'Bengaluru, India', required: false })
  @IsString()
  @IsOptional()
  currentLocation;

  @ApiProperty({ description: 'Total experience in years (min 0, step 0.1)', example: 4.5, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalExperience;

  @ApiProperty({ description: 'Current company', example: 'Acme Corp', required: false })
  @IsString()
  @IsOptional()
  currentCompany;

  @ApiProperty({ description: 'Current designation', example: 'Senior Software Engineer', required: false })
  @IsString()
  @IsOptional()
  currentDesignation;

  @ApiProperty({ description: 'LinkedIn profile URL', example: 'https://linkedin.com/in/janedoe', required: false })
  @IsString()
  @IsOptional()
  linkedinUrl;

  @ApiProperty({ description: 'Candidate source', enum: ['LinkedIn', 'Referral', 'Careers Page', 'Job Portal', 'Other'], required: false })
  @IsIn(['LinkedIn', 'Referral', 'Careers Page', 'Job Portal', 'Other'])
  @IsOptional()
  source;

  @ApiProperty({ description: 'Candidate status', enum: ['NEW', 'ACTIVE', 'ON_HOLD', 'REJECTED', 'HIRED', 'INACTIVE'], required: false })
  @IsIn(['NEW', 'ACTIVE', 'ON_HOLD', 'REJECTED', 'HIRED', 'INACTIVE'])
  @IsOptional()
  candidateStatus;

  @ApiProperty({ description: 'Resume document URL or path', example: 'https://storage.example.com/resumes/resume.pdf', required: false })
  @IsString()
  @IsOptional()
  resumeUrl;

  @ApiProperty({ description: 'Array of candidate skills tags', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills;
}
