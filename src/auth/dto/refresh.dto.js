import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The current active Refresh Token string' })
  @IsString()
  @IsNotEmpty()
  refreshToken;
}
