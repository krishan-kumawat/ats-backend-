import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionSetsDto {
  @ApiProperty({
    description: 'List of Permission Set UUIDs to assign to this user',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  permissionSetIds;
}
