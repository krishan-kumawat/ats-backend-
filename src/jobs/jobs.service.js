import { Injectable, NotFoundException, Dependencies } from '@nestjs/common';
import { JobsRepository } from './jobs.repository.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { OrgWideDefault } from '../entities/org-wide-default.entity.js';

@Injectable()
@Dependencies(JobsRepository, PermissionsService, getEntityManagerToken())
export class JobsService {
  constructor(jobsRepository, permissionsService, entityManager) {
    this.jobsRepository = jobsRepository;
    this.permissionsService = permissionsService;
    this.entityManager = entityManager;
  }

  async create(createJobDto, ownerId) {
    return this.jobsRepository.create({
      ...createJobDto,
      ownerId,
      createdById: ownerId,
      lastModifiedById: ownerId,
      status: 'Draft',
    });
  }

  async findAll(userId) {
    const matrix = await this.permissionsService.getEffectivePermissions(userId);

    const owd = await this.entityManager.findOne(OrgWideDefault, {
      where: { schemaObject: { apiName: 'Job' } },
      relations: { schemaObject: true },
    });
    const isPublic = owd?.defaultAccessLevel === 'READ_ONLY' || owd?.defaultAccessLevel === 'READ_WRITE';

    const hasBypass = 
      isPublic ||
      matrix?.system?.modifyAllData === true || 
      matrix?.system?.viewAllData === true || 
      matrix?.objects?.['Job']?.modifyAllData === true || 
      matrix?.objects?.['Job']?.viewAllData === true;

    return this.jobsRepository.findAll(userId, hasBypass);
  }

  async findOne(id) {
    const job = await this.jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found`);
    }
    return job;
  }

  async update(id, updateJobDto, modifierId) {
    await this.findOne(id);
    return this.jobsRepository.update(id, {
      ...updateJobDto,
      lastModifiedById: modifierId,
    });
  }

  async remove(id) {
    await this.findOne(id);
    return this.jobsRepository.softDelete(id);
  }
}
