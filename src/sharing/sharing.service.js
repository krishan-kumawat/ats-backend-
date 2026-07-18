import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Dependencies,
} from '@nestjs/common';
import { SharingRepository } from './sharing.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(SharingRepository, PrismaService)
export class SharingService {
  constructor(sharingRepository, prismaService) {
    this.sharingRepository = sharingRepository;
    this.prismaService = prismaService;
  }

  async share(shareResourceDto, sharedById, userProfile) {
    const { resourceType, resourceId, sharedToId, accessLevel, cascadeToChildren } =
      shareResourceDto;

    // Validate resource existence and fetch ownerId
    let ownerId = null;
    if (resourceType === 'Job') {
      const job = await this.prismaService.job.findUnique({
        where: { id: resourceId, deletedAt: null },
      });
      if (!job) {
        throw new NotFoundException(`Job with ID '${resourceId}' not found`);
      }
      ownerId = job.ownerId;
    } else if (resourceType === 'Candidate') {
      const candidate = await this.prismaService.candidate.findUnique({
        where: { id: resourceId, deletedAt: null },
      });
      if (!candidate) {
        throw new NotFoundException(`Candidate with ID '${resourceId}' not found`);
      }
      ownerId = candidate.ownerId;
    } else {
      throw new NotFoundException(`Unsupported resource type: ${resourceType}`);
    }

    // Only owner or Admin can share a resource
    if (ownerId !== sharedById && userProfile !== 'Admin') {
      throw new ForbiddenException('Only the record owner or an Admin can share this resource');
    }

    // Save share record
    const share = await this.sharingRepository.createShare({
      resourceType,
      resourceId,
      sharedToId,
      sharedById,
      accessLevel,
      cascadeToChildren: cascadeToChildren ?? false,
    });

    // Calculate access synchronously
    await this.recalculateUserAccess(sharedToId, resourceType, resourceId);
    if (cascadeToChildren) {
      await this.cascadeAccess(sharedToId, resourceType, resourceId);
    }

    return share;
  }

  async unshare(unshareResourceDto, sharedById, userProfile) {
    const { resourceType, resourceId, sharedToId } = unshareResourceDto;

    // Validate resource existence and fetch ownerId
    let ownerId = null;
    if (resourceType === 'Job') {
      const job = await this.prismaService.job.findUnique({
        where: { id: resourceId, deletedAt: null },
      });
      if (!job) {
        throw new NotFoundException(`Job with ID '${resourceId}' not found`);
      }
      ownerId = job.ownerId;
    } else if (resourceType === 'Candidate') {
      const candidate = await this.prismaService.candidate.findUnique({
        where: { id: resourceId, deletedAt: null },
      });
      if (!candidate) {
        throw new NotFoundException(`Candidate with ID '${resourceId}' not found`);
      }
      ownerId = candidate.ownerId;
    }

    // Only owner or Admin can unshare a resource
    if (ownerId !== sharedById && userProfile !== 'Admin') {
      throw new ForbiddenException('Only the record owner or an Admin can modify sharing on this resource');
    }

    // Delete share record
    await this.sharingRepository.deleteShare(resourceType, resourceId, sharedToId);

    // Calculate and purge access synchronously
    await this.recalculateUserAccess(sharedToId, resourceType, resourceId);
    await this.cascadeAccess(sharedToId, resourceType, resourceId);

    return { success: true };
  }

  async getUserAccess(userId) {
    return this.sharingRepository.findUserAccesses(userId);
  }

  async getResourceAccess(resourceType, resourceId, userId, userProfile) {
    // Confirm calling user has access to view this resource before listing shares
    let ownerId = null;
    if (resourceType === 'Job') {
      const job = await this.prismaService.job.findUnique({
        where: { id: resourceId, deletedAt: null },
      });
      if (!job) {
        throw new NotFoundException(`Job with ID '${resourceId}' not found`);
      }
      ownerId = job.ownerId;
    } else if (resourceType === 'Candidate') {
      const candidate = await this.prismaService.candidate.findUnique({
        where: { id: resourceId, deletedAt: null },
      });
      if (!candidate) {
        throw new NotFoundException(`Candidate with ID '${resourceId}' not found`);
      }
      ownerId = candidate.ownerId;
    }

    if (ownerId !== userId && userProfile !== 'Admin') {
      const access = await this.prismaService.userResourceAccess.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId,
            resourceType,
            resourceId,
          },
        },
      });
      if (!access) {
        throw new ForbiddenException('You do not have access to view this resource');
      }
    }

    return this.sharingRepository.findResourceAccesses(resourceType, resourceId);
  }

  // --- Internal Synchronous Access Calculations ---

  async handleCandidateJobLinked(candidateId, jobId) {
    // Find all active cascading shares on this Job
    const activeShares = await this.prismaService.resourceShare.findMany({
      where: {
        resourceType: 'Job',
        resourceId: jobId,
        cascadeToChildren: true,
      },
    });

    // Compute inherited candidate access for each shared user
    for (const share of activeShares) {
      await this.recalculateUserAccess(share.sharedToId, 'Candidate', candidateId);
    }
  }

  async recalculateUserAccess(userId, resourceType, resourceId) {
    // 1. Fetch direct share rule
    const directShare = await this.prismaService.resourceShare.findUnique({
      where: {
        resourceType_resourceId_sharedToId: {
          resourceType,
          resourceId,
          sharedToId: userId,
        },
      },
    });

    // 2. Fetch inherited sharing rules
    let inheritedShares = [];
    if (resourceType === 'Candidate') {
      const linkedJobs = await this.prismaService.candidateJob.findMany({
        where: { candidateId: resourceId, deletedAt: null },
        select: { jobId: true },
      });
      const jobIds = linkedJobs.map((lj) => lj.jobId);
      
      if (jobIds.length > 0) {
        inheritedShares = await this.prismaService.resourceShare.findMany({
          where: {
            resourceType: 'Job',
            resourceId: { in: jobIds },
            sharedToId: userId,
            cascadeToChildren: true,
          },
        });
      }
    }

    // 3. Resolve highest access level (EDIT wins over READ)
    let finalAccessLevel = null;
    let sharedVia = null;

    if (directShare) {
      finalAccessLevel = directShare.accessLevel;
      sharedVia = 'DIRECT';
    }

    for (const share of inheritedShares) {
      if (share.accessLevel === 'EDIT') {
        finalAccessLevel = 'EDIT';
        sharedVia = 'INHERITED';
        break; // Maximally open, exit early
      } else if (share.accessLevel === 'READ' && finalAccessLevel !== 'EDIT') {
        finalAccessLevel = 'READ';
        sharedVia = 'INHERITED';
      }
    }

    // 4. Update the computed cache table
    if (finalAccessLevel) {
      await this.prismaService.userResourceAccess.upsert({
        where: {
          userId_resourceType_resourceId: {
            userId,
            resourceType,
            resourceId,
          },
        },
        create: {
          userId,
          resourceType,
          resourceId,
          accessLevel: finalAccessLevel,
          sharedVia,
        },
        update: {
          accessLevel: finalAccessLevel,
          sharedVia,
        },
      });
    } else {
      // Remove cache entry if access is revoked
      await this.prismaService.userResourceAccess.deleteMany({
        where: {
          userId,
          resourceType,
          resourceId,
        },
      });
    }
  }

  async cascadeAccess(userId, parentType, parentId) {
    const childConfigs = await this.prismaService.resourceShareChild.findMany({
      where: { parentType },
    });

    for (const config of childConfigs) {
      try {
        const query = `
          SELECT "${config.childFkField}" as child_id 
          FROM "${config.relationTable}" 
          WHERE "${config.parentFkField}" = $1 
            AND "deleted_at" IS NULL
        `;
        const records = await this.prismaService.$queryRawUnsafe(query, parentId);

        for (const record of records) {
          await this.recalculateUserAccess(userId, config.childType, record.child_id);
        }
      } catch (error) {
        console.error(
          `[SharingService] Error cascading share from parent ${parentType} (${parentId}) to child ${config.childType}:`,
          error
        );
      }
    }
  }
}
