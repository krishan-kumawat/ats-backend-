import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class PermissionsRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.permission.create({ data });
  }

  async createMany(data) {
    return this.prismaService.permission.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findAll() {
    return this.prismaService.permission.findMany();
  }

  async findById(id) {
    return this.prismaService.permission.findUnique({
      where: { id },
    });
  }

  async findByCode(code) {
    return this.prismaService.permission.findUnique({
      where: { code },
    });
  }
}
