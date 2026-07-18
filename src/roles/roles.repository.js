import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class RolesRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.role.create({ data });
  }

  async findAll() {
    return this.prismaService.role.findMany({
      where: { deletedAt: null },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findById(id) {
    return this.prismaService.role.findUnique({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findByName(name) {
    return this.prismaService.role.findUnique({
      where: { name, deletedAt: null },
    });
  }

  async update(id, data) {
    return this.prismaService.role.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return this.prismaService.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
