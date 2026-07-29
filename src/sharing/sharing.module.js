import { Module } from '@nestjs/common';
import { SharingService } from './sharing.service.js';
import { SharingController } from './sharing.controller.js';
import { SharingRepository } from './sharing.repository.js';
import { RecordSharingHelper } from './record-sharing.helper.js';
import { SharingEventService } from './sharing-event.service.js';
import { SharingRecalculationWorker } from './sharing-recalculation.worker.js';

@Module({
  controllers: [SharingController],
  providers: [
    SharingService,
    SharingRepository,
    RecordSharingHelper,
    SharingEventService,
    SharingRecalculationWorker,
  ],
  exports: [
    SharingService,
    SharingRepository,
    RecordSharingHelper,
    SharingEventService,
    SharingRecalculationWorker,
  ],
})
export class SharingModule {}
