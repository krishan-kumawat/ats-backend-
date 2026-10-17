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
    const profiles = await this.prismaService.profile.findMany({
      where: { deletedAt: null },
      include: {
        profilePermissions: {
          include: { permission: true },
        },
      },
    });
    const raws = await this.prismaService.$queryRawUnsafe(
      `SELECT id, is_custom FROM profiles WHERE deleted_at IS NULL`
    );
    for (const profile of profiles) {
      const match = raws.find((r) => r.id === profile.id);
      if (match) {
        profile.isCustom = match.is_custom;
      }
    }
    return profiles;
  }

  async findById(id) {
    const profile = await this.prismaService.profile.findUnique({
      where: { id, deletedAt: null },
      include: {
        profilePermissions: {
          include: { permission: true },
        },
      },
    });
    if (profile) {
      const raw = await this.prismaService.$queryRawUnsafe(
        `SELECT is_custom FROM profiles WHERE id = $1`,
        id
      );
      if (raw && raw[0]) {
        profile.isCustom = raw[0].is_custom;
      }
    }
    return profile;
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
