import { Injectable, ConflictException, NotFoundException, ForbiddenException, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { ProfilesRepository } from './profiles.repository.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { PermissionSet } from '../entities/permission-set.entity.js';
import { ObjectPermission } from '../entities/object-permission.entity.js';
import { SchemaObject } from '../entities/schema-object.entity.js';
import { FieldPermission } from '../entities/field-permission.entity.js';
import { SystemPermission } from '../entities/system-permission.entity.js';
import { SchemaField } from '../entities/schema-field.entity.js';
import { TabSetting } from '../entities/tab-setting.entity.js';

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

  async getSecuritySettings(profileId) {
    const profile = await this.findOne(profileId);
    
    let pset = await this.entityManager.findOne(PermissionSet, {
      where: { profileId },
    });
    if (!pset) {
      pset = this.entityManager.create(PermissionSet, {
        name: `${profile.name} BaseSet`,
        description: `Base permission set for profile ${profile.name}`,
        isCustom: profile.isCustom,
        profileId,
      });
      await this.entityManager.save(PermissionSet, pset);
    }

    const psetId = pset.id;

    // 1. Fetch system permissions
    const systemPermissions = await this.entityManager.find(SystemPermission, {
      where: { permissionSetId: psetId },
    });

    // 2. Fetch object permissions
    const objectPermissions = await this.entityManager.find(ObjectPermission, {
      where: { permissionSetId: psetId },
      relations: { schemaObject: true },
    });

    // 3. Fetch field permissions
    const fieldPermissions = await this.entityManager.find(FieldPermission, {
      where: { permissionSetId: psetId },
      relations: { schemaField: { schemaObject: true } },
    });

    // 3b. Fetch tab settings
    const tabSettings = await this.entityManager.find(TabSetting, {
      where: { permissionSetId: psetId },
    });

    // 4. Fetch all schema objects and schema fields
    const allObjects = await this.entityManager.find(SchemaObject);
    const allFields = await this.entityManager.find(SchemaField, {
      relations: { schemaObject: true },
    });

    // Compile System Permissions
    const systemKeys = ['viewAllData', 'modifyAllData', 'manageUsers', 'manageProfiles', 'manageRoles'];
    const compiledSystem = {};
    for (const key of systemKeys) {
      const sp = systemPermissions.find((p) => p.permissionKey === key);
      compiledSystem[key] = sp ? sp.isEnabled : false;
    }

    // Compile Tab Settings
    const compiledTabs = allObjects.map((so) => {
      const ts = tabSettings.find((t) => t.schemaObjectId === so.id);
      return {
        schemaObjectId: so.id,
        apiName: so.apiName,
        label: so.label,
        isVisible: ts ? ts.isVisible : true,
        precedenceOrder: ts ? ts.precedenceOrder : null,
      };
    });

    // Compile Object Permissions
    const compiledObjects = allObjects.map((so) => {
      const op = objectPermissions.find((p) => p.schemaObjectId === so.id);
      return {
        schemaObjectId: so.id,
        apiName: so.apiName,
        label: so.label,
        allowCreate: op ? op.allowCreate : false,
        allowRead: op ? op.allowRead : false,
        allowEdit: op ? op.allowEdit : false,
        allowDelete: op ? op.allowDelete : false,
        viewAllData: op ? op.viewAllData : false,
        modifyAllData: op ? op.modifyAllData : false,
      };
    });

    // Compile Field Permissions
    const compiledFields = allFields.map((sf) => {
      const fp = fieldPermissions.find((p) => p.schemaFieldId === sf.id);
      return {
        schemaFieldId: sf.id,
        schemaObjectId: sf.schemaObjectId,
        objectApiName: sf.schemaObject?.apiName || null,
        apiName: sf.apiName,
        label: sf.label,
        allowRead: fp ? fp.allowRead : false,
        allowEdit: fp ? fp.allowEdit : false,
      };
    });

    return {
      profileId,
      profileName: profile.name,
      systemPermissions: compiledSystem,
      tabSettings: compiledTabs,
      objectPermissions: compiledObjects,
      fieldPermissions: compiledFields,
    };
  }

  async updateSecuritySettings(profileId, dto, adminUserId) {
    const profile = await this.findOne(profileId);
    if (profile.isCustom === false) {
      throw new ForbiddenException('Cannot modify permissions of standard system profiles');
    }

    let pset = await this.entityManager.findOne(PermissionSet, {
      where: { profileId },
    });
    if (!pset) {
      pset = this.entityManager.create(PermissionSet, {
        name: `${profile.name} BaseSet`,
        description: `Base permission set for profile ${profile.name}`,
        isCustom: profile.isCustom,
        profileId,
      });
      await this.entityManager.save(PermissionSet, pset);
    }

    const psetId = pset.id;

    // 1. Update System Permissions
    if (dto.systemPermissions) {
      for (const [key, isEnabled] of Object.entries(dto.systemPermissions)) {
        let sp = await this.entityManager.findOne(SystemPermission, {
          where: { permissionSetId: psetId, permissionKey: key },
        });
        if (!sp) {
          sp = this.entityManager.create(SystemPermission, {
            permissionSetId: psetId,
            permissionKey: key,
            isEnabled,
            createdById: adminUserId,
            lastModifiedById: adminUserId,
          });
        } else {
          sp.isEnabled = isEnabled;
          sp.lastModifiedById = adminUserId;
        }
        await this.entityManager.save(SystemPermission, sp);
      }
    }

    // 2. Update Object Permissions (OLS)
    if (dto.objectPermissions) {
      for (const opDto of dto.objectPermissions) {
        let op = await this.entityManager.findOne(ObjectPermission, {
          where: { permissionSetId: psetId, schemaObjectId: opDto.schemaObjectId },
        });
        if (!op) {
          op = this.entityManager.create(ObjectPermission, {
            permissionSetId: psetId,
            schemaObjectId: opDto.schemaObjectId,
            allowRead: opDto.allowRead || false,
            allowCreate: opDto.allowCreate || false,
            allowEdit: opDto.allowEdit || false,
            allowDelete: opDto.allowDelete || false,
            viewAllData: opDto.viewAllData || false,
            modifyAllData: opDto.modifyAllData || false,
            createdById: adminUserId,
            lastModifiedById: adminUserId,
          });
        } else {
          op.allowRead = opDto.allowRead !== undefined ? opDto.allowRead : op.allowRead;
          op.allowCreate = opDto.allowCreate !== undefined ? opDto.allowCreate : op.allowCreate;
          op.allowEdit = opDto.allowEdit !== undefined ? opDto.allowEdit : op.allowEdit;
          op.allowDelete = opDto.allowDelete !== undefined ? opDto.allowDelete : op.allowDelete;
          op.viewAllData = opDto.viewAllData !== undefined ? opDto.viewAllData : op.viewAllData;
          op.modifyAllData = opDto.modifyAllData !== undefined ? opDto.modifyAllData : op.modifyAllData;
          op.lastModifiedById = adminUserId;
        }
        await this.entityManager.save(ObjectPermission, op);
      }
    }

    // 3. Update Field Permissions (FLS)
    if (dto.fieldPermissions) {
      for (const fpDto of dto.fieldPermissions) {
        let fp = await this.entityManager.findOne(FieldPermission, {
          where: { permissionSetId: psetId, schemaFieldId: fpDto.schemaFieldId },
        });
        if (!fp) {
          fp = this.entityManager.create(FieldPermission, {
            permissionSetId: psetId,
            schemaFieldId: fpDto.schemaFieldId,
            allowRead: fpDto.allowRead || false,
            allowEdit: fpDto.allowEdit || false,
            createdById: adminUserId,
            lastModifiedById: adminUserId,
          });
        } else {
          fp.allowRead = fpDto.allowRead !== undefined ? fpDto.allowRead : fp.allowRead;
          fp.allowEdit = fpDto.allowEdit !== undefined ? fpDto.allowEdit : fp.allowEdit;
          fp.lastModifiedById = adminUserId;
        }
        await this.entityManager.save(FieldPermission, fp);
      }
    }

    // 4. Update Tab Settings
    if (dto.tabSettings) {
      for (const tsDto of dto.tabSettings) {
        let ts = await this.entityManager.findOne(TabSetting, {
          where: { permissionSetId: psetId, schemaObjectId: tsDto.schemaObjectId },
        });
        if (!ts) {
          ts = this.entityManager.create(TabSetting, {
            permissionSetId: psetId,
            schemaObjectId: tsDto.schemaObjectId,
            isVisible: tsDto.isVisible !== undefined ? tsDto.isVisible : true,
            precedenceOrder: tsDto.precedenceOrder !== undefined ? tsDto.precedenceOrder : null,
          });
        } else {
          ts.isVisible = tsDto.isVisible !== undefined ? tsDto.isVisible : ts.isVisible;
          ts.precedenceOrder = tsDto.precedenceOrder !== undefined ? tsDto.precedenceOrder : ts.precedenceOrder;
        }
        await this.entityManager.save(TabSetting, ts);
      }
    }

    return { success: true };
  }
}
