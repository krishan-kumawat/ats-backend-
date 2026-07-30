import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class UpdateOwdDto {
  @ApiProperty({ example: 'a123e456-b789-c012-d345-6789abcdef01', description: 'The Schema Object UUID' })
  @IsUUID()
  schemaObjectId;

  @ApiProperty({ example: 'PRIVATE', enum: ['PRIVATE', 'READ_ONLY', 'READ_WRITE'], description: 'The OWD Access Level' })
  @IsEnum(['PRIVATE', 'READ_ONLY', 'READ_WRITE'])
  defaultAccessLevel;

  @ApiProperty({ example: true, required: false, description: 'Grant access using hierarchy rollup' })
  @IsBoolean()
  @IsOptional()
  grantAccessUsingHierarchies;
}
