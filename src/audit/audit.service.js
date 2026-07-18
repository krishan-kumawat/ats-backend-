import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class AuditService {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async log(data) {
    try {
      await this.prismaService.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          payload: data.payload,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('[AuditService] Failed to write audit log synchronously:', error);
    }
  }

  async findAll() {
    return this.prismaService.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
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
