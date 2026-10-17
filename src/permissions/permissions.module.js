import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './permissions.service.js';
import { PermissionsController } from './permissions.controller.js';
import { MetadataController } from './metadata.controller.js';
import { PermissionsRepository } from './permissions.repository.js';

@Global()
@Module({
  controllers: [PermissionsController, MetadataController],
  providers: [PermissionsService, PermissionsRepository],
  exports: [PermissionsService, PermissionsRepository],
})
export class PermissionsModule {}
