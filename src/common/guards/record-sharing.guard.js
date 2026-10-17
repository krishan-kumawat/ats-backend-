import { Injectable, ForbiddenException, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RECORD_ACCESS_KEY } from '../decorators/record-access.decorator.js';
import { PermissionsService } from '../../permissions/permissions.service.js';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { OrgWideDefault } from '../../entities/org-wide-default.entity.js';
import { User } from '../../entities/user.entity.js';
import { Role } from '../../entities/role.entity.js';

@Injectable()
@Dependencies(Reflector, PrismaService, PermissionsService, getEntityManagerToken())
export class RecordSharingGuard {
  constructor(reflector, prismaService, permissionsService, entityManager) {
    this.reflector = reflector;
    this.prismaService = prismaService;
    this.permissionsService = permissionsService;
    this.entityManager = entityManager;
  }

  async canActivate(context) {
    const recordAccessMeta = this.reflector.getAllAndOverride(RECORD_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!recordAccessMeta) {
      return true;
    }

    const { resourceType, accessLevel, idParamName } = recordAccessMeta;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const recordId = request.params[idParamName];
    if (!recordId) {
      throw new ForbiddenException(
        `Missing path parameter '${idParamName}' required for record-level authorization`
      );
    }

    // 1. Super Admin bypass (Check system permission modifyAllData or viewAllData for read requests)
    const matrix = await this.permissionsService.getEffectivePermissions(user.sub);
    const hasModifyAll = matrix?.system?.modifyAllData === true || matrix?.objects?.[resourceType]?.modifyAllData === true;
    const hasViewAll = matrix?.system?.viewAllData === true || matrix?.objects?.[resourceType]?.viewAllData === true;

    if (hasModifyAll || (accessLevel === 'READ' && hasViewAll)) {
      return true;
    }

    // 2. Org-Wide Default (OWD) check
    const owd = await this.getOwd(resourceType);
    if (owd) {
      if (owd.defaultAccessLevel === 'READ_WRITE') {
        return true;
      }
      if (owd.defaultAccessLevel === 'READ_ONLY' && accessLevel === 'READ') {
        return true;
      }
    }

    // 3. Record Owner check
    const ownerId = await this.getRecordOwnerId(resourceType, recordId);
    if (ownerId && ownerId === user.sub) {
      return true;
    }

    // 4. Role Hierarchy check (Manager above owner in hierarchy inherits access)
    if (ownerId && owd?.grantAccessUsingHierarchies !== false) {
      const isManager = await this.checkRoleHierarchy(user.sub, ownerId);
      if (isManager) {
        return true;
      }
    }

    // 5. Shared access check (Direct/Inherited via user_resource_access)
    const hasSharedAccess = await this.checkSharedAccess(
      user.sub,
      resourceType,
      recordId,
      accessLevel
    );
    if (hasSharedAccess) {
      return true;
    }

    // 6. Deny access
    throw new ForbiddenException(`You do not have ${accessLevel} access to this ${resourceType} record`);
  }

  async getOwd(resourceType) {
    try {
      return await this.entityManager.findOne(OrgWideDefault, {
        where: { schemaObject: { apiName: resourceType } },
        relations: { schemaObject: true },
      });
    } catch (error) {
      console.error(`Error querying OWD for ${resourceType}:`, error);
      return null;
    }
  }

  async getRecordOwnerId(resourceType, recordId) {
    try {
      if (resourceType === 'Job') {
        const record = await this.prismaService.job.findUnique({
          where: { id: recordId, deletedAt: null },
          select: { ownerId: true },
        });
        return record?.ownerId;
      }

      if (resourceType === 'Candidate') {
        const record = await this.prismaService.candidate.findUnique({
          where: { id: recordId, deletedAt: null },
          select: { ownerId: true },
        });
        return record?.ownerId;
      }
    } catch (error) {
      console.error(`Error checking record ownership for ${resourceType}:`, error);
    }
    return null;
  }

  async checkRoleHierarchy(viewerUserId, ownerUserId) {
    if (!ownerUserId || viewerUserId === ownerUserId) return false;
    try {
      const viewer = await this.entityManager.findOne(User, { where: { id: viewerUserId } });
      const owner = await this.entityManager.findOne(User, { where: { id: ownerUserId } });
      if (!viewer?.roleId || !owner?.roleId) return false;

      let currentRoleId = owner.roleId;
      while (currentRoleId) {
        const role = await this.entityManager.findOne(Role, {
          where: { id: currentRoleId },
          select: { id: true, parentId: true },
        });
        if (role && role.parentId) {
          if (role.parentId === viewer.roleId) {
            return true;
          }
          currentRoleId = role.parentId;
        } else {
          break;
        }
      }
    } catch (err) {
      console.error('Error checking role hierarchy in RecordSharingGuard:', err);
    }
    return false;
  }

  async checkSharedAccess(userId, resourceType, recordId, requiredAccessLevel) {
    try {
      const access = await this.prismaService.userResourceAccess.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId,
            resourceType,
            resourceId: recordId,
          },
        },
      });

      if (!access) {
        return false;
      }

      if (requiredAccessLevel === 'EDIT') {
        return access.accessLevel === 'EDIT';
      }

      if (requiredAccessLevel === 'READ') {
        return access.accessLevel === 'READ' || access.accessLevel === 'EDIT';
      }
    } catch (error) {
      console.error(`Error querying user resource access:`, error);
    }
    return false;
  }
}
