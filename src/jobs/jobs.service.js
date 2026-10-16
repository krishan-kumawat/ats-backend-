import { Injectable, NotFoundException, BadRequestException, Dependencies } from '@nestjs/common';
import { JobsRepository } from './jobs.repository.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { OrgWideDefault } from '../entities/org-wide-default.entity.js';
import { SharingService } from '../sharing/sharing.service.js';

const ALLOWED_WORK_MODES = ['On-site', 'Remote', 'Hybrid'];

@Injectable()
@Dependencies(JobsRepository, PermissionsService, getEntityManagerToken(), SharingService)
export class JobsService {
  constructor(jobsRepository, permissionsService, entityManager, sharingService) {
    this.jobsRepository = jobsRepository;
    this.permissionsService = permissionsService;
    this.entityManager = entityManager;
    this.sharingService = sharingService;
  }

  formatJob(job) {
    if (!job) return null;
    return {
      ...job,
      budgetLimit: job.budget,
      workMode: job.workMode,
      salaryMin: job.salaryMin !== null && job.salaryMin !== undefined ? Number(job.salaryMin) : null,
      salaryMax: job.salaryMax !== null && job.salaryMax !== undefined ? Number(job.salaryMax) : null,
    };
  }

  async create(createJobDto, ownerId) {
    const {
      budgetLimit,
      budget,
      workMode,
      salaryMin,
      salaryMax,
      ...rest
    } = createJobDto;

    const finalBudget = budget !== undefined ? budget : budgetLimit;
    const finalWorkMode = workMode || 'On-site';

    if (!ALLOWED_WORK_MODES.includes(finalWorkMode)) {
      throw new BadRequestException(
        `Invalid workMode '${finalWorkMode}'. Allowed values are: ${ALLOWED_WORK_MODES.join(', ')}`
      );
    }

    if (salaryMin !== undefined && salaryMin !== null && Number(salaryMin) < 0) {
      throw new BadRequestException('salaryMin must be a non-negative number');
    }

    if (salaryMax !== undefined && salaryMax !== null && Number(salaryMax) < 0) {
      throw new BadRequestException('salaryMax must be a non-negative number');
    }

    if (
      salaryMin !== undefined &&
      salaryMin !== null &&
      salaryMax !== undefined &&
      salaryMax !== null &&
      Number(salaryMin) > Number(salaryMax)
    ) {
      throw new BadRequestException('salaryMin cannot be greater than salaryMax');
    }

    const job = await this.jobsRepository.create({
      ...rest,
      budget: finalBudget !== undefined && finalBudget !== null ? Number(finalBudget) : null,
      workMode: finalWorkMode,
      salaryMin: salaryMin !== undefined && salaryMin !== null ? Number(salaryMin) : null,
      salaryMax: salaryMax !== undefined && salaryMax !== null ? Number(salaryMax) : null,
      ownerId,
      createdById: ownerId,
      lastModifiedById: ownerId,
      status: 'Draft',
    });
    return this.formatJob(job);
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

    const jobs = await this.jobsRepository.findAll(userId, hasBypass);

    return Promise.all(
      jobs.map(async (job) => {
        const access = await this.sharingService.getRecordAccess(job.id, 'Job', userId);
        return {
          ...this.formatJob(job),
          userRecordAccess: access,
        };
      })
    );
  }

  async findOne(id) {
    const job = await this.jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found`);
    }
    return this.formatJob(job);
  }

  async update(id, updateJobDto, modifierId) {
    const existing = await this.findOne(id);
    const {
      budgetLimit,
      budget,
      workMode,
      salaryMin,
      salaryMax,
      ...rest
    } = updateJobDto;

    const finalBudget = budget !== undefined ? budget : budgetLimit;
    const effectiveMin = salaryMin !== undefined ? salaryMin : existing.salaryMin;
    const effectiveMax = salaryMax !== undefined ? salaryMax : existing.salaryMax;

    if (workMode !== undefined && !ALLOWED_WORK_MODES.includes(workMode)) {
      throw new BadRequestException(
        `Invalid workMode '${workMode}'. Allowed values are: ${ALLOWED_WORK_MODES.join(', ')}`
      );
    }

    if (effectiveMin !== undefined && effectiveMin !== null && Number(effectiveMin) < 0) {
      throw new BadRequestException('salaryMin must be a non-negative number');
    }

    if (effectiveMax !== undefined && effectiveMax !== null && Number(effectiveMax) < 0) {
      throw new BadRequestException('salaryMax must be a non-negative number');
    }

    if (
      effectiveMin !== undefined &&
      effectiveMin !== null &&
      effectiveMax !== undefined &&
      effectiveMax !== null &&
      Number(effectiveMin) > Number(effectiveMax)
    ) {
      throw new BadRequestException('salaryMin cannot be greater than salaryMax');
    }

    const payload = {
      ...rest,
      lastModifiedById: modifierId,
    };
    if (finalBudget !== undefined) {
      payload.budget = finalBudget !== null ? Number(finalBudget) : null;
    }
    if (workMode !== undefined) {
      payload.workMode = workMode;
    }
    if (salaryMin !== undefined) {
      payload.salaryMin = salaryMin !== null ? Number(salaryMin) : null;
    }
    if (salaryMax !== undefined) {
      payload.salaryMax = salaryMax !== null ? Number(salaryMax) : null;
    }

    const job = await this.jobsRepository.update(id, payload);
    return this.formatJob(job);
  }

  async remove(id) {
    await this.findOne(id);
    return this.jobsRepository.softDelete(id);
  }
}
