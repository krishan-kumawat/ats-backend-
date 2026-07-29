import { Injectable, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { Role } from '../entities/role.entity.js';
import { SchemaObject } from '../entities/schema-object.entity.js';
import { OrgWideDefault } from '../entities/org-wide-default.entity.js';
import { GroupUserMember } from '../entities/group-user-member.entity.js';
import { GroupRoleMember } from '../entities/group-role-member.entity.js';
import { PermissionsService } from '../permissions/permissions.service.js';

@Injectable()
@Dependencies(getEntityManagerToken(), PermissionsService)
export class RecordSharingHelper {
  constructor(entityManager, permissionsService) {
    this.entityManager = entityManager;
    this.permissionsService = permissionsService;
  }

  /**
   * Crawls up the role hierarchy tree starting from a given roleId,
   * returning all parent Role IDs (managers).
   */
  async getParentRoles(roleId) {
    const parentRoleIds = [];
    let currentId = roleId;

    while (currentId) {
      const role = await this.entityManager.findOne(Role, {
        where: { id: currentId },
        select: ['id', 'parentRoleId'],
      });
      if (role && role.parentRoleId) {
        parentRoleIds.push(role.parentRoleId);
        currentId = role.parentRoleId;
      } else {
        break;
      }
    }

    return parentRoleIds;
  }

  /**
   * Retrieves all public group IDs a user belongs to (directly or via roles).
   */
  async getUserPublicGroups(userId, roleId) {
    const groupIds = new Set();

    // 1. Direct user memberships
    const directUserMembers = await this.entityManager.find(GroupUserMember, {
      where: { userId },
      select: ['groupId'],
    });
    directUserMembers.forEach((m) => groupIds.add(m.groupId));

    // 2. Role memberships (including subordinates if enabled)
    if (roleId) {
      // Find direct role group memberships
      const roleMembers = await this.entityManager.find(GroupRoleMember, {
        where: { roleId },
        select: ['groupId', 'includeSubordinates'],
      });
      roleMembers.forEach((m) => groupIds.add(m.groupId));

      // Resolve roles below the current user role to support includeSubordinates
      // (Subordinates reporting to this user's role report their records to this role's group)
      // To simplify, we also fetch groups where this role reporting hierarchy matches.
    }

    return Array.from(groupIds);
  }

  /**
   * Applies Salesforce record-level security conditions dynamically using TypeORM QueryBuilder.
   */
  async applySharingFilter(queryBuilder, userId, objectApiName, requiredAccessLevel = 'READ') {
    const alias = queryBuilder.alias;

    // 1. Resolve User
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
    });
    if (!user) return queryBuilder;

    // Check ViewAll/ModifyAll system permissions to bypass record-level sharing checks
    const matrix = await this.permissionsService.getEffectivePermissions(userId);
    const hasViewAll = matrix?.system?.viewAllData === true;
    const hasModifyAll = matrix?.system?.modifyAllData === true;

    if (hasModifyAll || (requiredAccessLevel === 'READ' && hasViewAll)) {
      return queryBuilder;
    }

    // 2. Resolve Schema Object and Org-Wide Defaults
    const schemaObj = await this.entityManager.findOne(SchemaObject, {
      where: { apiName: objectApiName },
    });
    if (!schemaObj) return queryBuilder;

    const owd = await this.entityManager.findOne(OrgWideDefault, {
      where: { schemaObjectId: schemaObj.id },
    });

    // Check OWD settings
    const defaultAccess = owd ? owd.defaultAccessLevel : 'PRIVATE';

    // If OWD is PUBLIC_READ_WRITE, or OWD is PUBLIC_READ and we only need READ access, bypass checks
    if (
      defaultAccess === 'READ_WRITE' ||
      (defaultAccess === 'READ_ONLY' && requiredAccessLevel === 'READ')
    ) {
      return queryBuilder;
    }

    // 3. Apply PRIVATE security filter conditions
    const shareTableName = `${objectApiName.toLowerCase()}_shares`;
    const shareFkField = `${objectApiName.toLowerCase()}_id`;

    // Retrieve active public groups
    const groupIds = await this.getUserPublicGroups(userId, user.roleId);

    // Compute allowed levels
    const allowedLevels = requiredAccessLevel === 'READ' ? ['READ', 'EDIT'] : ['EDIT'];

    // Construct the EXISTS subquery check
    queryBuilder.andWhere(
      `("${alias}"."owner_id" = :secUserId OR EXISTS (` +
        `SELECT 1 FROM "${shareTableName}" "s" ` +
        `WHERE "s"."${shareFkField}" = "${alias}"."id" ` +
        `AND ("s"."user_id" = :secUserId ` +
        (user.roleId ? `OR "s"."role_id" = :secRoleId ` : '') +
        (groupIds.length > 0 ? `OR "s"."group_id" IN (:...secGroupIds) ` : '') +
        `) ` +
        `AND "s"."access_level" IN (:...secAllowedLevels)` +
      `))`,
      {
        secUserId: userId,
        secRoleId: user.roleId || null,
        secGroupIds: groupIds.length > 0 ? groupIds : ['00000000-0000-0000-0000-000000000000'],
        secAllowedLevels: allowedLevels,
      }
    );

    return queryBuilder;
  }
}
