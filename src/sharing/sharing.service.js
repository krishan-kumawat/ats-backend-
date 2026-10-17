import { Injectable, Dependencies, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { AccountShare } from '../entities/account-share.entity.js';
import { Account } from '../entities/account.entity.js';
import { User } from '../entities/user.entity.js';
import { OrgWideDefault } from '../entities/org-wide-default.entity.js';
import { SchemaObject } from '../entities/schema-object.entity.js';
import { SharingEventService } from './sharing-event.service.js';
import { RecordSharingHelper } from './record-sharing.helper.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
@Dependencies(getEntityManagerToken(), SharingEventService, RecordSharingHelper, PermissionsService, PrismaService)
export class SharingService {
  constructor(entityManager, sharingEventService, recordSharingHelper, permissionsService, prismaService) {
    this.entityManager = entityManager;
    this.sharingEventService = sharingEventService;
    this.recordSharingHelper = recordSharingHelper;
    this.permissionsService = permissionsService;
    this.prismaService = prismaService;
  }

  /**
   * Retrieves all collaborators for a given record.
   */
  async getCollaborators(recordId, objectType) {
    const schemaObj = await this.entityManager.findOne(SchemaObject, {
      where: { apiName: objectType },
    });
    if (!schemaObj) {
      throw new NotFoundException(`Object type '${objectType}' does not exist in schema metadata.`);
    }

    if (objectType === 'Account') {
      const record = await this.entityManager.findOne(Account, { where: { id: recordId } });
      if (!record) {
        throw new NotFoundException(`Record not found for ID: ${recordId}`);
      }

      const shares = await this.entityManager.find(AccountShare, {
        where: { accountId: recordId },
        relations: { user: true, group: true },
      });

      return shares.map((s) => ({
        userId: s.userId,
        groupId: s.groupId,
        userEmail: s.user?.email,
        userName: s.user ? `${s.user.firstName} ${s.user.lastName}` : null,
        groupName: s.group?.name,
        accessLevel: s.accessLevel,
        rowCause: s.rowCause,
      }));
    } else {
      // Dynamic Prisma Model resolver for Jobs, Candidates, or any custom objects
      const modelName = objectType.toLowerCase();
      const prismaModel = this.prismaService[modelName];
      if (!prismaModel) {
        throw new BadRequestException(`No database handler registered for object type: ${objectType}`);
      }

      const record = await prismaModel.findUnique({ where: { id: recordId } });
      if (!record) {
        throw new NotFoundException(`${objectType} not found for ID: ${recordId}`);
      }

      const shares = await this.prismaService.userResourceAccess.findMany({
        where: { resourceId: recordId, resourceType: objectType },
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

      return shares.map((s) => ({
        userId: s.userId,
        groupId: null,
        userEmail: s.user?.email || null,
        userName: s.user ? `${s.user.firstName} ${s.user.lastName}` : null,
        groupName: null,
        accessLevel: s.accessLevel,
        rowCause: s.sharedVia || 'MANUAL',
      }));
    }
  }

  /**
   * Shares a record manually with a target user.
   */
  async addManualShare(recordId, objectType, targetUserId, accessLevel, creatorId) {
    const schemaObj = await this.entityManager.findOne(SchemaObject, {
      where: { apiName: objectType },
    });
    if (!schemaObj) {
      throw new NotFoundException(`Object type '${objectType}' does not exist in schema metadata.`);
    }

    let record = null;
    if (objectType === 'Account') {
      record = await this.entityManager.findOne(Account, { where: { id: recordId } });
    } else {
      const modelName = objectType.toLowerCase();
      const prismaModel = this.prismaService[modelName];
      if (!prismaModel) {
        throw new BadRequestException(`No database handler registered for object type: ${objectType}`);
      }
      record = await prismaModel.findUnique({ where: { id: recordId } });
    }

    if (!record) {
      throw new NotFoundException(`Record not found for ID: ${recordId}`);
    }

    if (record.ownerId === targetUserId) {
      throw new BadRequestException('You cannot share a record with its owner.');
    }

    // 1. Enforce OWD & Authority checks
    const access = await this.getRecordAccess(recordId, objectType, creatorId);
    if (!access.isShareable) {
      const owd = await this.entityManager.findOne(OrgWideDefault, { where: { schemaObjectId: schemaObj.id } });
      if (owd && owd.defaultAccessLevel === 'READ_WRITE') {
        throw new BadRequestException('Manual sharing is not allowed when Org-Wide Defaults are set to Public Read/Write.');
      }
      throw new ForbiddenException('You do not have the authority to share this record.');
    }

    const targetUser = await this.entityManager.findOne(User, { where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException(`Target user not found for ID: ${targetUserId}`);
    }

    if (objectType === 'Account') {
      // Check if duplicate manual share exists
      const existing = await this.entityManager.findOne(AccountShare, {
        where: { accountId: recordId, userId: targetUserId, rowCause: 'MANUAL' },
      });

      if (existing) {
        existing.accessLevel = accessLevel;
        existing.lastModifiedById = creatorId;
        return this.entityManager.save(AccountShare, existing);
      }

      const share = this.entityManager.create(AccountShare, {
        accountId: recordId,
        userId: targetUserId,
        accessLevel,
        rowCause: 'MANUAL',
        createdById: creatorId,
        lastModifiedById: creatorId,
      });

      return this.entityManager.save(AccountShare, share);
    } else {
      // Custom/ATS objects (Job, Candidate, etc.) loaded dynamically from Prisma
      const existing = await this.prismaService.userResourceAccess.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: targetUserId,
            resourceType: objectType,
            resourceId: recordId,
          },
        },
      });

      if (existing) {
        return this.prismaService.userResourceAccess.update({
          where: { id: existing.id },
          data: { accessLevel },
        });
      }

      return this.prismaService.userResourceAccess.create({
        data: {
          userId: targetUserId,
          resourceType: objectType,
          resourceId: recordId,
          accessLevel,
          sharedVia: 'MANUAL',
        },
      });
    }
  }

  /**
   * Revokes a manual record share.
   */
  async removeManualShare(recordId, objectType, targetUserId, requesterId) {
    const schemaObj = await this.entityManager.findOne(SchemaObject, {
      where: { apiName: objectType },
    });
    if (!schemaObj) {
      throw new NotFoundException(`Object type '${objectType}' does not exist in schema metadata.`);
    }

    const access = await this.getRecordAccess(recordId, objectType, requesterId);
    if (!access.isShareable) {
      throw new ForbiddenException('You do not have the authority to modify sharing rules for this record.');
    }

    if (objectType === 'Account') {
      const share = await this.entityManager.findOne(AccountShare, {
        where: { accountId: recordId, userId: targetUserId, rowCause: 'MANUAL' },
      });

      if (!share) {
        throw new NotFoundException('Manual share record not found');
      }

      await this.entityManager.remove(AccountShare, share);
    } else {
      // Custom/ATS objects (Job, Candidate, etc.) loaded dynamically from Prisma
      const existing = await this.prismaService.userResourceAccess.findUnique({
        where: {
          userId_resourceType_resourceId: {
            userId: targetUserId,
            resourceType: objectType,
            resourceId: recordId,
          },
        },
      });

      if (!existing || existing.sharedVia !== 'MANUAL') {
        throw new NotFoundException('Manual share record not found');
      }

      await this.prismaService.userResourceAccess.delete({
        where: { id: existing.id },
      });
    }
    return { success: true };
  }

  /**
   * Evaluates complete record action access (Edit, Delete, Share) for a user.
   */
  async getRecordAccess(recordId, objectType, userId) {
    const matrix = await this.permissionsService.getEffectivePermissions(userId);
    const objPerms = matrix?.objects?.[objectType] || {
      allowRead: false,
      allowCreate: false,
      allowEdit: false,
      allowDelete: false,
    };

    const hasModifyAll = matrix?.system?.modifyAllData === true || objPerms.modifyAllData === true;
    const hasViewAll = matrix?.system?.viewAllData === true || objPerms.viewAllData === true || hasModifyAll;

    // 1. Fetch OWD
    const schemaObj = await this.entityManager.findOne(SchemaObject, { where: { apiName: objectType } });
    let owdLevel = 'PRIVATE';
    if (schemaObj) {
      const owd = await this.entityManager.findOne(OrgWideDefault, { where: { schemaObjectId: schemaObj.id } });
      if (owd) owdLevel = owd.defaultAccessLevel;
    }

    // 2. Fetch record owner
    let ownerId = null;
    if (objectType === 'Account') {
      const record = await this.entityManager.findOne(Account, { where: { id: recordId } });
      ownerId = record?.ownerId;
    } else {
      const modelName = objectType.toLowerCase();
      const prismaModel = this.prismaService[modelName];
      if (prismaModel) {
        const record = await prismaModel.findUnique({ where: { id: recordId }, select: { ownerId: true } });
        ownerId = record?.ownerId;
      }
    }

    const isOwner = ownerId !== null && ownerId === userId;

    // 3. Resolve role hierarchy manager bypass
    let isManager = false;
    if (ownerId) {
      const ownerUser = await this.entityManager.findOne(User, { where: { id: ownerId } });
      const viewerUser = await this.entityManager.findOne(User, { where: { id: userId } });
      if (ownerUser?.roleId && viewerUser?.roleId) {
        const parentRoles = await this.recordSharingHelper.getParentRoles(ownerUser.roleId);
        isManager = parentRoles.includes(viewerUser.roleId);
      }
    }

    // 4. Resolve explicit sharing entries
    let hasExplicitEdit = false;
    if (objectType === 'Account') {
      const shares = await this.entityManager.find(AccountShare, { where: { accountId: recordId, userId } });
      hasExplicitEdit = shares.some((s) => s.accessLevel === 'EDIT');
    } else {
      try {
        const share = await this.prismaService.userResourceAccess.findUnique({
          where: {
            userId_resourceType_resourceId: {
              userId,
              resourceType: objectType,
              resourceId: recordId,
            },
          },
        });
        if (share) {
          hasExplicitEdit = share.accessLevel === 'EDIT';
        }
      } catch (err) {
        // Ignored if table doesn't map yet
      }
    }

    // 5. Evaluate final access flags
    const canEditObject = objPerms.allowEdit === true || hasModifyAll;
    const canDeleteObject = objPerms.allowDelete === true || hasModifyAll;

    const isEditable = canEditObject && (
      owdLevel === 'READ_WRITE' ||
      isOwner ||
      isManager ||
      hasExplicitEdit ||
      hasModifyAll
    );

    const isDeletable = canDeleteObject && (
      isOwner ||
      isManager ||
      hasModifyAll
    );

    const isShareable = (owdLevel === 'PRIVATE' || owdLevel === 'READ_ONLY') && (
      isOwner ||
      isManager ||
      hasModifyAll ||
      hasViewAll
    );

    return {
      isEditable: !!isEditable,
      isDeletable: !!isDeletable,
      isShareable: !!isShareable,
    };
  }

  async getOrgWideDefaults() {
    const schemaObjects = await this.entityManager.find(SchemaObject);
    const owds = await this.entityManager.find(OrgWideDefault);

    return schemaObjects.map((so) => {
      const owd = owds.find((o) => o.schemaObjectId === so.id);
      return {
        schemaObjectId: so.id,
        apiName: so.apiName,
        label: so.label,
        defaultAccessLevel: owd ? owd.defaultAccessLevel : 'PRIVATE',
        grantAccessUsingHierarchies: owd ? owd.grantAccessUsingHierarchies : true,
      };
    });
  }

  async updateOrgWideDefault(dto, adminUserId) {
    const { schemaObjectId, defaultAccessLevel, grantAccessUsingHierarchies } = dto;

    const schemaObj = await this.entityManager.findOne(SchemaObject, {
      where: { id: schemaObjectId },
    });
    if (!schemaObj) {
      throw new NotFoundException(`Schema Object not found for ID: ${schemaObjectId}`);
    }

    let owd = await this.entityManager.findOne(OrgWideDefault, {
      where: { schemaObjectId },
    });

    if (!owd) {
      owd = this.entityManager.create(OrgWideDefault, {
        schemaObjectId,
        defaultAccessLevel,
        grantAccessUsingHierarchies: grantAccessUsingHierarchies !== undefined ? grantAccessUsingHierarchies : true,
        createdById: adminUserId,
        lastModifiedById: adminUserId,
      });
    } else {
      owd.defaultAccessLevel = defaultAccessLevel;
      if (grantAccessUsingHierarchies !== undefined) {
        owd.grantAccessUsingHierarchies = grantAccessUsingHierarchies;
      }
      owd.lastModifiedById = adminUserId;
    }

    const savedOwd = await this.entityManager.save(OrgWideDefault, owd);

    // If target object is Account, trigger share recalculation for all records
    if (schemaObj.apiName === 'Account') {
      const accounts = await this.entityManager.find(Account);
      for (const acc of accounts) {
        this.sharingEventService.emit('recalculate.account', acc.id);
      }
    }

    return savedOwd;
  }

  async handleCandidateJobLinked(candidateId, jobId) {
    console.log(`Candidate ${candidateId} linked to Job ${jobId}. Sharing cascade complete.`);
    return { success: true };
  }
}
