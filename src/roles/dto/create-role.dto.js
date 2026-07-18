import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'The unique role name', example: 'Recruitment Manager' })
  @IsString()
  @IsNotEmpty()
  name;

  @ApiProperty({
    description: 'The parent role UUID for creating hierarchies',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId;
}

export class UpdateRoleDto {
  @ApiProperty({ description: 'The unique role name', example: 'Recruitment Manager', required: false })
  @IsString()
  @IsOptional()
  name;

  @ApiProperty({
    description: 'The parent role UUID for creating hierarchies',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId;
}
