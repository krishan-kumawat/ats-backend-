import { Injectable, ConflictException, NotFoundException, ForbiddenException, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { ProfilesRepository } from './profiles.repository.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { PermissionSet } from '../entities/permission-set.entity.js';
import { ObjectPermission } from '../entities/object-permission.entity.js';
import { SchemaObject } from '../entities/schema-object.entity.js';

@Injectable()
@Dependencies(ProfilesRepository, PermissionsService, getEntityManagerToken())
export class ProfilesService {
  constructor(profilesRepository, permissionsService, entityManager) {
    this.profilesRepository = profilesRepository;
    this.permissionsService = permissionsService;
    this.entityManager = entityManager;
  }

  async create(createProfileDto, creatorId) {
    const existing = await this.profilesRepository.findByName(createProfileDto.name);
    if (existing) {
      throw new ConflictException(`Profile with name '${createProfileDto.name}' already exists`);
    }
    return this.profilesRepository.create({
      ...createProfileDto,
      createdById: creatorId,
      lastModifiedById: creatorId,
    });
  }

  async findAll() {
    return this.profilesRepository.findAll();
  }

  async findOne(id) {
    const profile = await this.profilesRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Profile with ID '${id}' not found`);
    }
    return profile;
  }

  async update(id, updateProfileDto, modifierId) {
    const profile = await this.findOne(id);
    if (profile.isCustom === false) {
      throw new ForbiddenException('Cannot modify standard system profiles');
    }
    return this.profilesRepository.update(id, {
      ...updateProfileDto,
      lastModifiedById: modifierId,
    });
  }

  async remove(id) {
    const profile = await this.findOne(id);
    if (profile.isCustom === false) {
      throw new ForbiddenException('Cannot delete standard system profiles');
    }
    return this.profilesRepository.softDelete(id);
  }

  async assignPermissions(id, permissionIds) {
    const profile = await this.findOne(id);
    const result = await this.profilesRepository.assignPermissions(id, permissionIds);

    // Resolve or create base permission set for the profile
    let pset = await this.entityManager.findOne(PermissionSet, { where: { profileId: id } });
    if (!pset) {
      pset = this.entityManager.create(PermissionSet, {
        name: `${profile.name} BaseSet`,
        description: `Base permission set for profile ${profile.name}`,
        isCustom: false,
        profileId: id,
      });
      await this.entityManager.save(PermissionSet, pset);
    }

    // Resolve Job and Candidate Schema Objects
    const jobObj = await this.entityManager.findOne(SchemaObject, { where: { apiName: 'Job' } });
    const candObj = await this.entityManager.findOne(SchemaObject, { where: { apiName: 'Candidate' } });

    if (jobObj && candObj && result.profilePermissions) {
      const codes = result.profilePermissions.map((pp) => pp.permission?.code).filter(Boolean);

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
        where: { permissionSetId: pset.id, schemaObjectId: jobObj.id },
      });
      await this.entityManager.save(ObjectPermission, {
        id: existingJobOp ? existingJobOp.id : undefined,
        permissionSetId: pset.id,
        schemaObjectId: jobObj.id,
        ...jobOLS,
      });

      // Upsert Candidate OLS
      const existingCandOp = await this.entityManager.findOne(ObjectPermission, {
        where: { permissionSetId: pset.id, schemaObjectId: candObj.id },
      });
      await this.entityManager.save(ObjectPermission, {
        id: existingCandOp ? existingCandOp.id : undefined,
        permissionSetId: pset.id,
        schemaObjectId: candObj.id,
        ...candOLS,
      });
    }

    await this.permissionsService.invalidateCacheForProfile(id);
    return result;
  }

  async cloneProfile(sourceProfileId, cloneProfileDto, creatorId) {
    const sourceProfile = await this.findOne(sourceProfileId);

    // 1. Create the new profile record
    const newProfile = await this.create({
      name: cloneProfileDto.name,
      description: cloneProfileDto.description || `Cloned from ${sourceProfile.name}`,
      isCustom: true,
    }, creatorId);

    // 2. Fetch the source profile's base permission set
    const sourcePermSet = await this.entityManager.findOne('permission_sets', {
      where: { profileId: sourceProfileId },
    });

    if (sourcePermSet) {
      // 3. Create the new base permission set
      const newPermSet = this.entityManager.create('permission_sets', {
        name: `${newProfile.name} BaseSet`,
        description: `Base permission set for cloned profile ${newProfile.name}`,
        isCustom: true,
        profileId: newProfile.id,
        createdById: creatorId,
        lastModifiedById: creatorId,
      });
      await this.entityManager.save('permission_sets', newPermSet);

      // 4. Duplicate Object Permissions (OLS)
      const objectPermissions = await this.entityManager.find('object_permissions', {
        where: { permissionSetId: sourcePermSet.id },
      });
      for (const op of objectPermissions) {
        const newOp = this.entityManager.create('object_permissions', {
          permissionSetId: newPermSet.id,
          schemaObjectId: op.schemaObjectId,
          allowCreate: op.allowCreate,
          allowRead: op.allowRead,
          allowEdit: op.allowEdit,
          allowDelete: op.allowDelete,
          viewAllData: op.viewAllData,
          modifyAllData: op.modifyAllData,
          createdById: creatorId,
          lastModifiedById: creatorId,
        });
        await this.entityManager.save('object_permissions', newOp);
      }

      // 5. Duplicate Field Permissions (FLS)
      const fieldPermissions = await this.entityManager.find('field_permissions', {
        where: { permissionSetId: sourcePermSet.id },
      });
      for (const fp of fieldPermissions) {
        const newFp = this.entityManager.create('field_permissions', {
          permissionSetId: newPermSet.id,
          schemaFieldId: fp.schemaFieldId,
          allowRead: fp.allowRead,
          allowEdit: fp.allowEdit,
          createdById: creatorId,
          lastModifiedById: creatorId,
        });
        await this.entityManager.save('field_permissions', newFp);
      }

      // 6. Duplicate System Permissions
      const systemPermissions = await this.entityManager.find('system_permissions', {
        where: { permissionSetId: sourcePermSet.id },
      });
      for (const sp of systemPermissions) {
        const newSp = this.entityManager.create('system_permissions', {
          permissionSetId: newPermSet.id,
          permissionKey: sp.permissionKey,
          isEnabled: sp.isEnabled,
          createdById: creatorId,
          lastModifiedById: creatorId,
        });
        await this.entityManager.save('system_permissions', newSp);
      }
    }

    return newProfile;
  }
}
