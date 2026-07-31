import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { SetupController } from './setup.controller.js';
import { UsersRepository } from './users.repository.js';
import { BcryptService } from '../auth/bcrypt.service.js';
import { PermissionsModule } from '../permissions/permissions.module.js';

@Module({
  imports: [PermissionsModule],
  controllers: [UsersController, SetupController],
  providers: [UsersService, UsersRepository, BcryptService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
