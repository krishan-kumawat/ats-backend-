import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class JobsRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.job.create({ data });
  }

  async findAll(userId, hasBypass) {
    // Super Admin bypass: retrieve all jobs
    if (hasBypass) {
      return this.prismaService.job.findMany({
        where: { deletedAt: null },
        include: {
          department: true,
          owner: {
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

    // Standard user: retrieve owned jobs OR directly/inherited shared jobs
    const sharedAccess = await this.prismaService.userResourceAccess.findMany({
      where: {
        userId,
        resourceType: 'Job',
      },
      select: { resourceId: true },
    });
    const sharedJobIds = sharedAccess.map((sa) => sa.resourceId);

    return this.prismaService.job.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { id: { in: sharedJobIds } },
        ],
      },
      include: {
        department: true,
        owner: {
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

  async findById(id) {
    return this.prismaService.job.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        lastModifiedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id, data) {
    return this.prismaService.job.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return this.prismaService.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
