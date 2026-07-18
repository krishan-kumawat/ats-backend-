import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository.js';
import { BcryptService } from './bcrypt.service.js';

@Injectable()
@Dependencies(UsersRepository, JwtService, BcryptService)
export class AuthService {
  constructor(usersRepository, jwtService, bcryptService) {
    this.usersRepository = usersRepository;
    this.jwtService = jwtService;
    this.bcryptService = bcryptService;
  }

  async login(email, password) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.bcryptService.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersRepository.findById(payload.sub);
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokenMatches = await this.bcryptService.compare(refreshToken, user.refreshTokenHash);
      if (!tokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId) {
    await this.usersRepository.update(userId, {
      refreshTokenHash: null,
    });
    return { success: true };
  }

  async generateTokens(user) {
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      profile: user.profile.name,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const refreshTokenPayload = {
      sub: user.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      }),
    ]);

    const refreshTokenHash = await this.bcryptService.hash(refreshToken);
    await this.usersRepository.update(user.id, {
      refreshTokenHash,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
