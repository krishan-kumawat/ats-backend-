import { Injectable, NotFoundException, Dependencies } from '@nestjs/common';
import { CandidatesRepository } from './candidates.repository.js';
import { SharingService } from '../sharing/sharing.service.js';

@Injectable()
@Dependencies(CandidatesRepository, SharingService)
export class CandidatesService {
  constructor(candidatesRepository, sharingService) {
    this.candidatesRepository = candidatesRepository;
    this.sharingService = sharingService;
  }

  async create(createCandidateDto, ownerId) {
    return this.candidatesRepository.create({
      ...createCandidateDto,
      ownerId,
      createdById: ownerId,
      lastModifiedById: ownerId,
    });
  }

  async findAll(userId, userProfile) {
    return this.candidatesRepository.findAll(userId, userProfile);
  }

  async findOne(id) {
    const candidate = await this.candidatesRepository.findById(id);
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID '${id}' not found`);
    }
    return candidate;
  }

  async update(id, updateCandidateDto, modifierId) {
    await this.findOne(id);
    return this.candidatesRepository.update(id, {
      ...updateCandidateDto,
      lastModifiedById: modifierId,
    });
  }

  async remove(id) {
    await this.findOne(id);
    return this.candidatesRepository.softDelete(id);
  }

  async linkToJob(candidateId, jobId, status, modifierId) {
    await this.findOne(candidateId);
    
    // Link candidate to job in DB with modifier tracking
    const link = await this.candidatesRepository.linkToJob(candidateId, jobId, status, modifierId);

    // Run sharing cascade calculation synchronously
    await this.sharingService.handleCandidateJobLinked(candidateId, jobId);

    return link;
  }
}
