import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service.js';
import { CandidatesController } from './candidates.controller.js';
import { CandidatesRepository } from './candidates.repository.js';
import { SharingModule } from '../sharing/sharing.module.js';

@Module({
  imports: [SharingModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, CandidatesRepository],
  exports: [CandidatesService, CandidatesRepository],
})
export class CandidatesModule {}
