import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class SharingRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async createShare(data) {
    return this.prismaService.resourceShare.upsert({
      where: {
        resourceType_resourceId_sharedToId: {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          sharedToId: data.sharedToId,
        },
      },
      create: data,
      update: {
        accessLevel: data.accessLevel,
        cascadeToChildren: data.cascadeToChildren ?? false,
      },
    });
  }

  async findShare(resourceType, resourceId, sharedToId) {
    return this.prismaService.resourceShare.findUnique({
      where: {
        resourceType_resourceId_sharedToId: {
          resourceType,
          resourceId,
          sharedToId,
        },
      },
    });
  }

  async deleteShare(resourceType, resourceId, sharedToId) {
    return this.prismaService.resourceShare.deleteMany({
      where: {
        resourceType,
        resourceId,
        sharedToId,
      },
    });
  }

  async findUserAccesses(userId) {
    return this.prismaService.userResourceAccess.findMany({
      where: { userId },
    });
  }

  async findResourceAccesses(resourceType, resourceId) {
    return this.prismaService.userResourceAccess.findMany({
      where: { resourceType, resourceId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
