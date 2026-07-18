import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class DepartmentsRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.department.create({ data });
  }

  async findAll() {
    return this.prismaService.department.findMany({
      where: { deletedAt: null },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findById(id) {
    return this.prismaService.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findByName(name) {
    return this.prismaService.department.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async update(id, data) {
    return this.prismaService.department.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return this.prismaService.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
