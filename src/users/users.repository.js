import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class UsersRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.user.create({ data });
  }

  async findAll(skip, take, search, profileName) {
    const where = { deletedAt: null };
    if (profileName && profileName !== "all") {
      where.profile = { name: profileName };
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        skip: skip !== undefined ? Number(skip) : undefined,
        take: take !== undefined ? Number(take) : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          department: true,
          role: true,
          profile: true,
          userPermissionSets: {
            include: { permissionSet: true },
          },
        },
      }),
      this.prismaService.user.count({
        where,
      }),
    ]);
    return { users, total };
  }

  async findById(id) {
    return this.prismaService.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: true,
        role: true,
        profile: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        updater: {
          select: {
            firstName: true,
            lastName: true,
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
  }

  async findByEmail(email) {
    return this.prismaService.user.findUnique({
      where: { email, deletedAt: null },
      include: {
        profile: true,
      },
    });
  }

  async update(id, data) {
    return this.prismaService.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return this.prismaService.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignPermissionSets(userId, permissionSetIds) {
    return this.prismaService.$transaction(async (tx) => {
      // Clear existing
      await tx.userPermissionSet.deleteMany({
        where: { userId },
      });

      // Insert new
      if (permissionSetIds && permissionSetIds.length > 0) {
        const data = permissionSetIds.map((permissionSetId) => ({
          userId,
          permissionSetId,
        }));
        await tx.userPermissionSet.createMany({
          data,
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          userPermissionSets: {
            include: { permissionSet: true },
          },
        },
      });
    });
  }
}
