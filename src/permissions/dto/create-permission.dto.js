import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ description: 'The domain or module area', example: 'Recruitment' })
  @IsString()
  @IsNotEmpty()
  module;

  @ApiProperty({ description: 'The entity resource name', example: 'Job' })
  @IsString()
  @IsNotEmpty()
  resource;

  @ApiProperty({ description: 'The action permitted', example: 'View' })
  @IsString()
  @IsNotEmpty()
  action;

  @ApiProperty({ description: 'Unique dot/colon-separated permission identifier', example: 'recruitment:job:view' })
  @IsString()
  @IsNotEmpty()
  code;
}
