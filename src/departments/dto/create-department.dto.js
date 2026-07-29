import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'The unique name of the department', example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  name;

  @ApiProperty({ description: 'The parent department UUID (optional)', example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  parentId;
}

export class UpdateDepartmentDto {
  @ApiProperty({ description: 'The unique name of the department', example: 'Engineering', required: false })
  @IsString()
  @IsOptional()
  name;

  @ApiProperty({ description: 'The parent department UUID (optional)', example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  parentId;
}
