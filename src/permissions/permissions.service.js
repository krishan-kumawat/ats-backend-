import { Injectable, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { PermissionSet } from '../entities/permission-set.entity.js';
import { PermissionSetAssignment } from '../entities/permission-set-assignment.entity.js';
import { ObjectPermission } from '../entities/object-permission.entity.js';
import { FieldPermission } from '../entities/field-permission.entity.js';
import { SystemPermission } from '../entities/system-permission.entity.js';

@Injectable()
@Dependencies(getEntityManagerToken())
export class PermissionsService {
  constructor(entityManager) {
    this.entityManager = entityManager;
  }

  async getEffectivePermissions(userId) {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
    });
    if (!user) return null;

    // Fetch Profile Base Permission Set
    const profilePermSet = await this.entityManager.findOne(PermissionSet, {
      where: { profileId: user.profileId },
    });

    // Fetch User Custom Permission Set Assignments
    const assignments = await this.entityManager.find(PermissionSetAssignment, {
      where: { userId },
    });
    const assignedSetIds = assignments.map((a) => a.permissionSetId);

    const activeSetIds = [];
    if (profilePermSet) activeSetIds.push(profilePermSet.id);
    activeSetIds.push(...assignedSetIds);

    const matrix = {
      objects: {},
      fields: {},
      system: {},
    };

    if (activeSetIds.length > 0) {
      // Query all object permissions linked to active sets
      const objectPermissions = await this.entityManager.find(ObjectPermission, {
        where: { permissionSetId: In(activeSetIds) },
        relations: ['schemaObject'],
      });

      // Query all field permissions linked to active sets
      const fieldPermissions = await this.entityManager.find(FieldPermission, {
        where: { permissionSetId: In(activeSetIds) },
        relations: ['schemaField', 'schemaField.schemaObject'],
      });

      // Query all system permissions linked to active sets
      const systemPermissions = await this.entityManager.find(SystemPermission, {
        where: { permissionSetId: In(activeSetIds) },
      });

      // Merging Object-Level Security (OLS)
      for (const op of objectPermissions) {
        if (!op.schemaObject) continue;
        const apiName = op.schemaObject.apiName;
        if (!matrix.objects[apiName]) {
          matrix.objects[apiName] = {
            allowCreate: false,
            allowRead: false,
            allowEdit: false,
            allowDelete: false,
            viewAllData: false,
            modifyAllData: false,
          };
        }
        const o = matrix.objects[apiName];
        o.allowCreate = o.allowCreate || op.allowCreate;
        o.allowRead = o.allowRead || op.allowRead;
        o.allowEdit = o.allowEdit || op.allowEdit;
        o.allowDelete = o.allowDelete || op.allowDelete;
        o.viewAllData = o.viewAllData || op.viewAllData;
        o.modifyAllData = o.modifyAllData || op.modifyAllData;
      }

      // Merging Field-Level Security (FLS)
      for (const fp of fieldPermissions) {
        if (!fp.schemaField || !fp.schemaField.schemaObject) continue;
        const objApiName = fp.schemaField.schemaObject.apiName;
        const fieldApiName = fp.schemaField.apiName;
        if (!matrix.fields[objApiName]) {
          matrix.fields[objApiName] = {};
        }
        if (!matrix.fields[objApiName][fieldApiName]) {
          matrix.fields[objApiName][fieldApiName] = {
            allowRead: false,
            allowEdit: false,
          };
        }
        const f = matrix.fields[objApiName][fieldApiName];
        f.allowRead = f.allowRead || fp.allowRead;
        f.allowEdit = f.allowEdit || fp.allowEdit;
      }

      // Merging System Permissions
      for (const sp of systemPermissions) {
        matrix.system[sp.permissionKey] = matrix.system[sp.permissionKey] || sp.isEnabled;
      }
    }

    return matrix;
  }

  async invalidateCache(userId) {
    // No-op without Redis cache
  }

  async invalidateCacheForProfile(profileId) {
    // No-op without Redis cache
  }

  async invalidateCacheForPermissionSet(permissionSetId) {
    // No-op without Redis cache
  }
}
