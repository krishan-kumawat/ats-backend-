import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { JobsRepository } from './jobs.repository.js';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobsRepository],
  exports: [JobsService, JobsRepository],
})
export class JobsModule {}
