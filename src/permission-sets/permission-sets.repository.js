import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class PermissionSetsRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.permissionSet.create({ data });
  }

  async findAll() {
    return this.prismaService.permissionSet.findMany({
      where: { deletedAt: null },
      include: {
        permissionSetPerms: {
          include: { permission: true },
        },
      },
    });
  }

  async findById(id) {
    return this.prismaService.permissionSet.findUnique({
      where: { id, deletedAt: null },
      include: {
        permissionSetPerms: {
          include: { permission: true },
        },
      },
    });
  }

  async findByName(name) {
    return this.prismaService.permissionSet.findUnique({
      where: { name, deletedAt: null },
    });
  }

  async update(id, data) {
    return this.prismaService.permissionSet.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return this.prismaService.permissionSet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignPermissions(permissionSetId, permissionIds) {
    return this.prismaService.$transaction(async (tx) => {
      // Clear existing
      await tx.permissionSetPermission.deleteMany({
        where: { permissionSetId },
      });

      // Insert new
      if (permissionIds && permissionIds.length > 0) {
        const data = permissionIds.map((permissionId) => ({
          permissionSetId,
          permissionId,
        }));
        await tx.permissionSetPermission.createMany({
          data,
        });
      }

      return tx.permissionSet.findUnique({
        where: { id: permissionSetId },
        include: {
          permissionSetPerms: {
            include: { permission: true },
          },
        },
      });
    });
  }
}
