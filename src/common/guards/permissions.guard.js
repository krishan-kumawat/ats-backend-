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

    const permissions = await this.getUserPermissions(user.id);
    return requiredPermissions.every((perm) => permissions.includes(perm));
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

    if (!dbUser) {
      return [];
    }

    const profilePerms = dbUser.profile.profilePermissions.map(
      (pp) => pp.permission.code
    );

    const permSetsPerms = dbUser.userPermissionSets.flatMap((ups) =>
      ups.permissionSet.permissionSetPerms.map((psp) => psp.permission.code)
    );

    return Array.from(new Set([...profilePerms, ...permSetsPerms]));
  }
}
