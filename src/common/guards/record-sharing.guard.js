import { Injectable, ForbiddenException, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RECORD_ACCESS_KEY } from '../decorators/record-access.decorator.js';

@Injectable()
@Dependencies(Reflector, PrismaService)
export class RecordSharingGuard {
  constructor(reflector, prismaService) {
    this.reflector = reflector;
    this.prismaService = prismaService;
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

    // 1. Super Admin bypass
    if (user.profile === 'Admin') {
      return true;
    }

    // 2. Record Owner check
    const isOwner = await this.checkRecordOwnership(user.sub, resourceType, recordId);
    if (isOwner) {
      return true;
    }

    // 3. Shared access check (Direct/Inherited via user_resource_access)
    const hasSharedAccess = await this.checkSharedAccess(
      user.sub,
      resourceType,
      recordId,
      accessLevel
    );
    if (hasSharedAccess) {
      return true;
    }

    // 4. Deny access
    throw new ForbiddenException(`You do not have ${accessLevel} access to this ${resourceType} record`);
  }

  async checkRecordOwnership(userId, resourceType, recordId) {
    try {
      if (resourceType === 'Job') {
        const record = await this.prismaService.job.findUnique({
          where: { id: recordId, deletedAt: null },
          select: { ownerId: true },
        });
        return record?.ownerId === userId;
      }

      if (resourceType === 'Candidate') {
        const record = await this.prismaService.candidate.findUnique({
          where: { id: recordId, deletedAt: null },
          select: { ownerId: true },
        });
        return record?.ownerId === userId;
      }
    } catch (error) {
      console.error(`Error checking record ownership for ${resourceType}:`, error);
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
            resourceId,
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
