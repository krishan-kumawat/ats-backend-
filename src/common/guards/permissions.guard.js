import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';

@Injectable()
@Dependencies(Reflector, PrismaService)
export class PermissionsGuard {
  constructor(reflector, prismaService) {
    this.reflector = reflector;
    this.prismaService = prismaService;
  }

  async canActivate(context) {
    const requiredPermissions = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.profile === 'Admin') {
      return true;
    }

    const permissions = await this.getUserPermissions(user.sub);
    return requiredPermissions.some((perm) => permissions.includes(perm));
  }

  async getUserPermissions(userId) {
    const dbUser = await this.prismaService.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        profile: {
          include: {
            profilePermissions: {
              include: { permission: true },
            },
          },
        },
        userPermissionSets: {
          include: {
            permissionSet: {
              include: {
                permissionSetPerms: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!dbUser) return [];

    const perms = new Set();
    if (dbUser.profile && dbUser.profile.profilePermissions) {
      dbUser.profile.profilePermissions.forEach((pp) => {
        if (pp.permission) perms.add(pp.permission.code);
      });
    }

    if (dbUser.userPermissionSets) {
      dbUser.userPermissionSets.forEach((ups) => {
        if (ups.permissionSet && ups.permissionSet.permissionSetPerms) {
          ups.permissionSet.permissionSetPerms.forEach((psp) => {
            if (psp.permission) perms.add(psp.permission.code);
          });
        }
      });
    }

    return Array.from(perms);
  }
}
