import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { JobsRepository } from './jobs.repository.js';

import { SharingModule } from '../sharing/sharing.module.js';
import { PermissionsModule } from '../permissions/permissions.module.js';

@Module({
  imports: [SharingModule, PermissionsModule],
  controllers: [JobsController],
  providers: [JobsService, JobsRepository],
  exports: [JobsService, JobsRepository],
})
export class JobsModule {}
