import { Injectable, NotFoundException, Dependencies } from '@nestjs/common';
import { CandidatesRepository } from './candidates.repository.js';
import { SharingService } from '../sharing/sharing.service.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { OrgWideDefault } from '../entities/org-wide-default.entity.js';
import { GoogleDriveService } from '../google-drive/google-drive.service.js';

@Injectable()
@Dependencies(CandidatesRepository, SharingService, PermissionsService, getEntityManagerToken(), GoogleDriveService)
export class CandidatesService {
  constructor(candidatesRepository, sharingService, permissionsService, entityManager, googleDriveService) {
    this.candidatesRepository = candidatesRepository;
    this.sharingService = sharingService;
    this.permissionsService = permissionsService;
    this.entityManager = entityManager;
    this.googleDriveService = googleDriveService;
  }

  async create(createCandidateDto, ownerId, file) {
    const { jobId, ...candidateData } = createCandidateDto;

    const job = await this.candidatesRepository.findJobById(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID '${jobId}' not found`);
    }

    if (file && file.buffer) {
      const candidateName = `${createCandidateDto.firstName || ''} ${createCandidateDto.lastName || ''}`.trim();
      const uploadResult = await this.googleDriveService.uploadResume({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        candidateName,
      });
      candidateData.resumeUrl = uploadResult.fileId;
    }

    const candidate = await this.candidatesRepository.create({
      ...candidateData,
      ownerId,
      createdById: ownerId,
      lastModifiedById: ownerId,
    });

    await this.linkToJob(candidate.id, jobId, 'Applied', ownerId);

    return this.findOne(candidate.id);
  }

  async findAll(userId) {
    const matrix = await this.permissionsService.getEffectivePermissions(userId);

    const owd = await this.entityManager.findOne(OrgWideDefault, {
      where: { schemaObject: { apiName: 'Candidate' } },
      relations: { schemaObject: true },
    });
    const isPublic = owd?.defaultAccessLevel === 'READ_ONLY' || owd?.defaultAccessLevel === 'READ_WRITE';

    const hasBypass = 
      isPublic ||
      matrix?.system?.modifyAllData === true || 
      matrix?.system?.viewAllData === true || 
      matrix?.objects?.['Candidate']?.modifyAllData === true || 
      matrix?.objects?.['Candidate']?.viewAllData === true;

    const candidates = await this.candidatesRepository.findAll(userId, hasBypass);

    return Promise.all(
      candidates.map(async (cand) => {
        const access = await this.sharingService.getRecordAccess(cand.id, 'Candidate', userId);
        const formatted = this.googleDriveService.formatCandidate(cand);
        return {
          ...formatted,
          userRecordAccess: access,
        };
      })
    );
  }

  async findOne(id) {
    const candidate = await this.candidatesRepository.findById(id);
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID '${id}' not found`);
    }
    return this.googleDriveService.formatCandidate(candidate);
  }

  async update(id, updateCandidateDto, modifierId, file) {
    const existing = await this.findOne(id);

    if (file && file.buffer) {
      const candidateName = `${updateCandidateDto.firstName || existing.firstName || ''} ${updateCandidateDto.lastName || existing.lastName || ''}`.trim();
      const uploadResult = await this.googleDriveService.uploadResume({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        candidateName,
      });
      updateCandidateDto.resumeUrl = uploadResult.fileId;
    }

    await this.candidatesRepository.update(id, {
      ...updateCandidateDto,
      lastModifiedById: modifierId,
    });

    return this.findOne(id);
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

  async updateJobLink(candidateId, jobId, updateDto, modifierId) {
    await this.findOne(candidateId);
    return this.candidatesRepository.updateJobLink(candidateId, jobId, updateDto, modifierId);
  }
}
