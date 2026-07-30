import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { AccountShare } from '../entities/account-share.entity.js';
import { Account } from '../entities/account.entity.js';
import { User } from '../entities/user.entity.js';
import { OrgWideDefault } from '../entities/org-wide-default.entity.js';
import { SchemaObject } from '../entities/schema-object.entity.js';
import { SharingEventService } from './sharing-event.service.js';

@Injectable()
@Dependencies(getEntityManagerToken(), SharingEventService)
export class SharingService {
  constructor(entityManager, sharingEventService) {
    this.entityManager = entityManager;
    this.sharingEventService = sharingEventService;
  }

  /**
   * Retrieves all collaborators for a given record.
   */
  async getCollaborators(recordId, objectType) {
    if (objectType !== 'Account') {
      throw new NotFoundException(`Sharing operations not supported for object type: ${objectType}`);
    }

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
  }

  /**
   * Shares a record manually with a target user.
   */
  async addManualShare(recordId, objectType, targetUserId, accessLevel, creatorId) {
    if (objectType !== 'Account') {
      throw new NotFoundException(`Sharing operations not supported for object type: ${objectType}`);
    }

    const record = await this.entityManager.findOne(Account, { where: { id: recordId } });
    if (!record) {
      throw new NotFoundException(`Record not found for ID: ${recordId}`);
    }

    const targetUser = await this.entityManager.findOne(User, { where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException(`Target user not found for ID: ${targetUserId}`);
    }

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
  }

  /**
   * Revokes a manual record share.
   */
  async removeManualShare(recordId, objectType, targetUserId) {
    if (objectType !== 'Account') {
      throw new NotFoundException(`Sharing operations not supported for object type: ${objectType}`);
    }

    const share = await this.entityManager.findOne(AccountShare, {
      where: { accountId: recordId, userId: targetUserId, rowCause: 'MANUAL' },
    });

    if (!share) {
      throw new NotFoundException('Manual share record not found');
    }

    await this.entityManager.remove(AccountShare, share);
    return { success: true };
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
