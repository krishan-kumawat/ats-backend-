import { Module } from '@nestjs/common';
import { PermissionSetsService } from './permission-sets.service.js';
import { PermissionSetsController } from './permission-sets.controller.js';
import { PermissionSetsRepository } from './permission-sets.repository.js';
import { PermissionsModule } from '../permissions/permissions.module.js';

@Module({
  imports: [PermissionsModule],
  controllers: [PermissionSetsController],
  providers: [PermissionSetsService, PermissionSetsRepository],
  exports: [PermissionSetsService, PermissionSetsRepository],
})
export class PermissionSetsModule {}
