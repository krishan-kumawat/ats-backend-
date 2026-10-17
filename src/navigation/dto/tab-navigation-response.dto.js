import { ApiProperty } from '@nestjs/swagger';

export class TabNavigationResponseDto {
  @ApiProperty({ example: 'Candidate', description: 'The API name of the schema object' })
  apiName;

  @ApiProperty({ example: 'Candidates', description: 'The UI label for the tab' })
  label;

  @ApiProperty({ example: 'users', description: 'The icon name to represent the tab in UI' })
  iconName;

  @ApiProperty({ example: 'OBJECT', description: 'Type of the tab' })
  tabType;

  @ApiProperty({ example: '/candidates', description: 'The routing path on the frontend' })
  route;

  @ApiProperty({ example: 10, description: 'The evaluated sort order of the tab' })
  sortOrder;
}
