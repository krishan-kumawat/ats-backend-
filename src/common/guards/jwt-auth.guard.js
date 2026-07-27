import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
@Dependencies(JwtService, Reflector)
export class JwtAuthGuard {
  constructor(jwtService, reflector) {
    this.jwtService = jwtService;
    this.reflector = reflector;
  }

  async canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      // Attach user object to request
      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return true;
  }

  extractTokenFromHeader(request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
