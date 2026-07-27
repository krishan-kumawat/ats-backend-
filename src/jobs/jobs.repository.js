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

  async findAll(userId, userProfile) {
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
      orderBy: { createdAt: 'desc' },
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
