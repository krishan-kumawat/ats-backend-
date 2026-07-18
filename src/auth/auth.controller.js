import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Dependencies,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CustomValidationPipe } from '../common/pipes/custom-validation.pipe.js';

@ApiTags('Authentication')
@Controller('auth')
@Dependencies(AuthService)
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new CustomValidationPipe(LoginDto))
  login(@Body() loginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new CustomValidationPipe(RefreshTokenDto))
  refresh(@Body() refreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Successful logout.' })
  logout(@Req() request) {
    return this.authService.logout(request.user.sub);
  }
}
