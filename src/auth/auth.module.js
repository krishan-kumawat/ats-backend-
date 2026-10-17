import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { BcryptService } from './bcrypt.service.js';
import { UsersModule } from '../users/users.module.js';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, BcryptService],
  exports: [AuthService, BcryptService, JwtModule],
})
export class AuthModule {}
