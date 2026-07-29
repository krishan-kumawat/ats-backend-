import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(PrismaService)
export class CandidatesRepository {
  constructor(prismaService) {
    this.prismaService = prismaService;
  }

  async create(data) {
    return this.prismaService.candidate.create({ data });
  }

  async findAll(userId, userProfile) {
    // Super Admin bypass: retrieve all candidates
    if (userProfile === 'Admin') {
      return this.prismaService.candidate.findMany({
        where: { deletedAt: null },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          candidateJobs: {
            include: { job: true },
          },
        },
      });
    }

    // Standard user: retrieve owned candidates OR directly/inherited shared candidates
    const sharedAccess = await this.prismaService.userResourceAccess.findMany({
      where: {
        userId,
        resourceType: 'Candidate',
      },
      select: { resourceId: true },
    });
    const sharedCandidateIds = sharedAccess.map((sa) => sa.resourceId);

    return this.prismaService.candidate.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { id: { in: sharedCandidateIds } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        candidateJobs: {
          include: { job: true },
        },
      },
    });
  }

  async findById(id) {
    return this.prismaService.candidate.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        candidateJobs: {
          include: { job: true },
        },
      },
    });
  }

  async update(id, data) {
    return this.prismaService.candidate.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return this.prismaService.candidate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async linkToJob(candidateId, jobId, status = 'Applied', modifierId) {
    return this.prismaService.candidateJob.upsert({
      where: {
        candidateId_jobId: {
          candidateId,
          jobId,
        },
      },
      create: {
        candidateId,
        jobId,
        status,
        createdById: modifierId,
        lastModifiedById: modifierId,
      },
      update: {
        status,
        lastModifiedById: modifierId,
        deletedAt: null, // restore if soft deleted
      },
    });
  }

  async updateJobLink(candidateId, jobId, data, modifierId) {
    return this.prismaService.candidateJob.update({
      where: {
        candidateId_jobId: {
          candidateId,
          jobId,
        },
      },
      data: {
        ...data,
        lastModifiedById: modifierId,
      },
    });
  }
}
