import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { AccountShare } from '../entities/account-share.entity.js';
import { Account } from '../entities/account.entity.js';
import { User } from '../entities/user.entity.js';

@Injectable()
@Dependencies(getEntityManagerToken())
export class SharingService {
  constructor(entityManager) {
    this.entityManager = entityManager;
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
      relations: ['user', 'group'],
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
}
