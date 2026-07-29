import { Injectable, ConflictException, NotFoundException, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { PermissionSetsRepository } from './permission-sets.repository.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { ObjectPermission } from '../entities/object-permission.entity.js';
import { SchemaObject } from '../entities/schema-object.entity.js';

@Injectable()
@Dependencies(PermissionSetsRepository, PermissionsService, getEntityManagerToken())
export class PermissionSetsService {
  constructor(permissionSetsRepository, permissionsService, entityManager) {
    this.permissionSetsRepository = permissionSetsRepository;
    this.permissionsService = permissionsService;
    this.entityManager = entityManager;
  }

  async create(createPermissionSetDto, creatorId) {
    const existing = await this.permissionSetsRepository.findByName(createPermissionSetDto.name);
    if (existing) {
      throw new ConflictException(`Permission set with name '${createPermissionSetDto.name}' already exists`);
    }
    return this.permissionSetsRepository.create({
      ...createPermissionSetDto,
      createdById: creatorId,
      lastModifiedById: creatorId,
    });
  }

  async findAll() {
    return this.permissionSetsRepository.findAll();
  }

  async findOne(id) {
    const permSet = await this.permissionSetsRepository.findById(id);
    if (!permSet) {
      throw new NotFoundException(`Permission set with ID '${id}' not found`);
    }
    return permSet;
  }

  async update(id, updatePermissionSetDto, modifierId) {
    await this.findOne(id);
    return this.permissionSetsRepository.update(id, {
      ...updatePermissionSetDto,
      lastModifiedById: modifierId,
    });
  }

  async remove(id) {
    await this.findOne(id);
    return this.permissionSetsRepository.softDelete(id);
  }

  async assignPermissions(id, permissionIds) {
    await this.findOne(id);
    const result = await this.permissionSetsRepository.assignPermissions(id, permissionIds);

    // Resolve Job and Candidate Schema Objects
    const jobObj = await this.entityManager.findOne(SchemaObject, { where: { apiName: 'Job' } });
    const candObj = await this.entityManager.findOne(SchemaObject, { where: { apiName: 'Candidate' } });

    if (jobObj && candObj && result.permissionSetPerms) {
      const codes = result.permissionSetPerms.map((pp) => pp.permission?.code).filter(Boolean);

      const jobOLS = {
        allowRead: codes.includes('recruitment:job:read'),
        allowCreate: codes.includes('recruitment:job:create'),
        allowEdit: codes.includes('recruitment:job:write') || codes.includes('recruitment:job:edit'),
        allowDelete: codes.includes('recruitment:job:write') || codes.includes('recruitment:job:delete'),
      };

      const candOLS = {
        allowRead: codes.includes('recruitment:candidate:read'),
        allowCreate: codes.includes('recruitment:candidate:create'),
        allowEdit: codes.includes('recruitment:candidate:write') || codes.includes('recruitment:candidate:edit'),
        allowDelete: codes.includes('recruitment:candidate:write') || codes.includes('recruitment:candidate:delete'),
      };

      // Upsert Job OLS
      const existingJobOp = await this.entityManager.findOne(ObjectPermission, {
        where: { permissionSetId: id, schemaObjectId: jobObj.id },
      });
      await this.entityManager.save(ObjectPermission, {
        id: existingJobOp ? existingJobOp.id : undefined,
        permissionSetId: id,
        schemaObjectId: jobObj.id,
        ...jobOLS,
      });

      // Upsert Candidate OLS
      const existingCandOp = await this.entityManager.findOne(ObjectPermission, {
        where: { permissionSetId: id, schemaObjectId: candObj.id },
      });
      await this.entityManager.save(ObjectPermission, {
        id: existingCandOp ? existingCandOp.id : undefined,
        permissionSetId: id,
        schemaObjectId: candObj.id,
        ...candOLS,
      });
    }

    await this.permissionsService.invalidateCacheForPermissionSet(id);
    return result;
  }
}
