import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateTabSettingDto {
  @ApiProperty({ example: 'a123e456-b789-c012-d345-6789abcdef01', description: 'The Permission Set UUID' })
  @IsUUID()
  permissionSetId;

  @ApiProperty({ example: 'b123e456-b789-c012-d345-6789abcdef02', description: 'The Schema Object UUID' })
  @IsUUID()
  schemaObjectId;

  @ApiProperty({ example: true, required: false, description: 'Visibility toggle of the tab' })
  @IsBoolean()
  @IsOptional()
  isVisible;

  @ApiProperty({ example: 10, required: false, nullable: true, description: 'Sort precedence override' })
  @IsInt()
  @IsOptional()
  precedenceOrder;
}
