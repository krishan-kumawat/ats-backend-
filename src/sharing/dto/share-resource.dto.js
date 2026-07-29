import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareResourceDto {
  @ApiProperty({ description: 'Type of resource being shared', example: 'Job' })
  @IsString()
  @IsNotEmpty()
  resourceType;

  @ApiProperty({
    description: 'Target resource UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  resourceId;

  @ApiProperty({
    description: 'The target User UUID getting access',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sharedToId;

  @ApiProperty({ description: 'Access level', example: 'READ' })
  @IsString()
  @IsNotEmpty()
  accessLevel; // 'READ' or 'EDIT'

  @ApiProperty({
    description: 'If true, access cascades down to child objects (e.g. Candidates associated with the Job)',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  cascadeToChildren;
}

export class UnshareResourceDto {
  @ApiProperty({ description: 'Type of resource', example: 'Job' })
  @IsString()
  @IsNotEmpty()
  resourceType;

  @ApiProperty({
    description: 'Target resource UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  resourceId;

  @ApiProperty({
    description: 'The User UUID having access revoked',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sharedToId;
}
