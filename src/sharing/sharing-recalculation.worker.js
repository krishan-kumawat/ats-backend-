import { Injectable, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { SharingEventService } from './sharing-event.service.js';
import { RecordSharingHelper } from './record-sharing.helper.js';
import { Account } from '../entities/account.entity.js';
import { AccountShare } from '../entities/account-share.entity.js';
import { SchemaObject } from '../entities/schema-object.entity.js';
import { OrgWideDefault } from '../entities/org-wide-default.entity.js';
import { SharingRule } from '../entities/sharing-rule.entity.js';
import { User } from '../entities/user.entity.js';

@Injectable()
@Dependencies(SharingEventService, getEntityManagerToken(), RecordSharingHelper)
export class SharingRecalculationWorker {
  constructor(sharingEventService, entityManager, recordSharingHelper) {
    this.sharingEventService = sharingEventService;
    this.entityManager = entityManager;
    this.recordSharingHelper = recordSharingHelper;
  }

  onModuleInit() {
    this.sharingEventService.on('recalculate.account', async (accountId) => {
      try {
        await this.recalculateAccountShares(accountId);
      } catch (err) {
        console.error(`[RecalculationWorker] Error recalculating shares for Account '${accountId}':`, err);
      }
    });
  }

  evaluateCriteria(record, criteriaJson) {
    if (!criteriaJson) return false;
    const { field, operator, value } = criteriaJson;
    const recordValue = record[field];
    if (recordValue === undefined || recordValue === null) return false;

    const val = isNaN(Number(value)) ? value : Number(value);
    const recVal = isNaN(Number(recordValue)) ? recordValue : Number(recordValue);

    switch (operator) {
      case '=':
      case '==':
        return recVal === val;
      case '>':
        return recVal > val;
      case '<':
        return recVal < val;
      case '>=':
        return recVal >= val;
      case '<=':
        return recVal <= val;
      default:
        return false;
    }
  }

  async recalculateAccountShares(accountId) {
    console.log(`[RecalculationWorker] Starting share recalculation for Account '${accountId}'...`);

    const account = await this.entityManager.findOne(Account, {
      where: { id: accountId },
    });
    if (!account) return;

    // 1. Delete all existing computed shares (excluding OWNER and MANUAL row causes)
    await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(AccountShare)
      .where('accountId = :accountId', { accountId })
      .andWhere('rowCause IN (:...causes)', { causes: ['ROLE_HIERARCHY', 'SHARING_RULE', 'IMPLICIT_PARENT'] })
      .execute();

    // 2. Fetch OWD config
    const schemaObj = await this.entityManager.findOne(SchemaObject, {
      where: { apiName: 'Account' },
    });
    if (!schemaObj) return;

    const owd = await this.entityManager.findOne(OrgWideDefault, {
      where: { schemaObjectId: schemaObj.id },
    });
    const grantHierarchies = owd ? owd.grantAccessUsingHierarchies : true;

    // 3. Hierarchy sharing: Resolve manager roles above owner
    if (grantHierarchies) {
      const owner = await this.entityManager.findOne(User, {
        where: { id: account.ownerId },
      });
      if (owner && owner.roleId) {
        const parentRoleIds = await this.recordSharingHelper.getParentRoles(owner.roleId);
        
        for (const roleId of parentRoleIds) {
          const share = this.entityManager.create(AccountShare, {
            accountId,
            roleId,
            accessLevel: 'EDIT', // Manager inherits full edit access
            rowCause: 'ROLE_HIERARCHY',
          });
          await this.entityManager.save(share);
        }
      }
    }

    // 4. Criteria-Based Sharing Rules evaluation
    const rules = await this.entityManager.find(SharingRule, {
      where: { schemaObjectId: schemaObj.id },
    });

    for (const rule of rules) {
      const matches = this.evaluateCriteria(account, rule.criteriaJson);
      if (matches) {
        const share = this.entityManager.create(AccountShare, {
          accountId,
          userId: rule.targetUserId,
          roleId: rule.targetRoleId,
          groupId: rule.targetGroupId,
          accessLevel: rule.accessLevel,
          rowCause: 'SHARING_RULE',
        });
        await this.entityManager.save(share);
      }
    }

    console.log(`[RecalculationWorker] Finished share recalculation for Account '${accountId}'.`);
  }
}
