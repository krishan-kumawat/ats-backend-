import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class ProfilesRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.profile.create({ data });
  }

  async findAll() {
    return this.prismaService.profile.findMany({
      where: { deletedAt: null },
      include: {
        profilePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findById(id) {
    return this.prismaService.profile.findUnique({
      where: { id, deletedAt: null },
      include: {
        profilePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findByName(name) {
    return this.prismaService.profile.findUnique({
      where: { name, deletedAt: null },
    });
  }

  async update(id, data) {
    return this.prismaService.profile.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return this.prismaService.profile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignPermissions(profileId, permissionIds) {
    return this.prismaService.$transaction(async (tx) => {
      // Clear existing
      await tx.profilePermission.deleteMany({
        where: { profileId },
      });

      // Insert new
      if (permissionIds && permissionIds.length > 0) {
        const data = permissionIds.map((permissionId) => ({
          profileId,
          permissionId,
        }));
        await tx.profilePermission.createMany({
          data,
        });
      }

      return tx.profile.findUnique({
        where: { id: profileId },
        include: {
          profilePermissions: {
            include: { permission: true },
          },
        },
      });
    });
  }
}
