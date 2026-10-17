import { Module } from '@nestjs/common';
import { SharingService } from './sharing.service.js';
import { SharingController } from './sharing.controller.js';
import { RecordSharingHelper } from './record-sharing.helper.js';
import { SharingEventService } from './sharing-event.service.js';
import { SharingRecalculationWorker } from './sharing-recalculation.worker.js';
import { PermissionsModule } from '../permissions/permissions.module.js';

@Module({
  imports: [PermissionsModule],
  controllers: [SharingController],
  providers: [
    SharingService,
    RecordSharingHelper,
    SharingEventService,
    SharingRecalculationWorker,
  ],
  exports: [
    SharingService,
    RecordSharingHelper,
    SharingEventService,
    SharingRecalculationWorker,
  ],
})
export class SharingModule {}
