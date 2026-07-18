import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { BcryptService } from '../auth/bcrypt.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, BcryptService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
