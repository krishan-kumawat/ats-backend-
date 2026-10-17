import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionSetDto {
  @ApiProperty({ description: 'The unique name of the permission set', example: 'Export Jobs' })
  @IsString()
  @IsNotEmpty()
  name;

  @ApiProperty({ description: 'Optional description of the permission set', example: 'Grants ability to export jobs to CSV', required: false })
  @IsString()
  @IsOptional()
  description;
}

export class UpdatePermissionSetDto {
  @ApiProperty({ description: 'The unique name of the permission set', example: 'Export Jobs', required: false })
  @IsString()
  @IsOptional()
  name;

  @ApiProperty({ description: 'Optional description of the permission set', example: 'Grants ability to export jobs to CSV', required: false })
  @IsString()
  @IsOptional()
  description;
}
