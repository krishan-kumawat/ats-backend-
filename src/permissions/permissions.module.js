import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service.js';
import { PermissionsController } from './permissions.controller.js';
import { PermissionsRepository } from './permissions.repository.js';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository],
  exports: [PermissionsService, PermissionsRepository],
})
export class PermissionsModule {}
