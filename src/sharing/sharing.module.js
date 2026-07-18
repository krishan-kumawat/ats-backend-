import { Module } from '@nestjs/common';
import { SharingService } from './sharing.service.js';
import { SharingController } from './sharing.controller.js';
import { SharingRepository } from './sharing.repository.js';

@Module({
  controllers: [SharingController],
  providers: [SharingService, SharingRepository],
  exports: [SharingService, SharingRepository],
})
export class SharingModule {}
