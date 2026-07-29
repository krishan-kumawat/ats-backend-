import { Injectable, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { RedisService } from '../redis/redis.service.js';
import { User } from '../entities/user.entity.js';
import { PermissionSet } from '../entities/permission-set.entity.js';
import { PermissionSetAssignment } from '../entities/permission-set-assignment.entity.js';
import { ObjectPermission } from '../entities/object-permission.entity.js';
import { FieldPermission } from '../entities/field-permission.entity.js';
import { SystemPermission } from '../entities/system-permission.entity.js';

@Injectable()
@Dependencies(getEntityManagerToken(), RedisService)
export class PermissionsService {
  constructor(entityManager, redisService) {
    this.entityManager = entityManager;
    this.redisService = redisService;
  }

  async getEffectivePermissions(userId) {
    const cacheKey = `user:permissions:${userId}`;
    
    // 1. Try reading from Redis cache
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('[PermissionsService] Redis read failed:', err);
    }

    // 2. Cache miss: Query DB and calculate BOOL_OR union permissions
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

    // 3. Save computed matrix to Redis cache (24 hours TTL)
    try {
      await this.redisService.set(cacheKey, JSON.stringify(matrix), 86400);
    } catch (err) {
      console.error('[PermissionsService] Redis write failed:', err);
    }

    return matrix;
  }

  async invalidateCache(userId) {
    const cacheKey = `user:permissions:${userId}`;
    try {
      await this.redisService.del(cacheKey);
    } catch (err) {
      console.error('[PermissionsService] Redis del failed:', err);
    }
  }

  async invalidateCacheForProfile(profileId) {
    try {
      const users = await this.entityManager.find(User, { where: { profileId } });
      for (const u of users) {
        await this.invalidateCache(u.id);
      }
    } catch (err) {
      console.error('[PermissionsService] Profile bulk invalidation failed:', err);
    }
  }

  async invalidateCacheForPermissionSet(permissionSetId) {
    try {
      const ps = await this.entityManager.findOne(PermissionSet, { where: { id: permissionSetId } });
      if (ps && ps.profileId) {
        await this.invalidateCacheForProfile(ps.profileId);
      }
      const assignments = await this.entityManager.find(PermissionSetAssignment, { where: { permissionSetId } });
      for (const a of assignments) {
        await this.invalidateCache(a.userId);
      }
    } catch (err) {
      console.error('[PermissionsService] PermSet bulk invalidation failed:', err);
    }
  }
}
