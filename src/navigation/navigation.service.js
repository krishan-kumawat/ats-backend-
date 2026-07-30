import { Injectable, Dependencies } from '@nestjs/common';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { PermissionsService } from '../permissions/permissions.service.js';
import { User } from '../entities/user.entity.js';
import { PermissionSet } from '../entities/permission-set.entity.js';
import { PermissionSetAssignment } from '../entities/permission-set-assignment.entity.js';
import { TabSetting } from '../entities/tab-setting.entity.js';
import { In } from 'typeorm';

@Injectable()
@Dependencies(getEntityManagerToken(), PermissionsService)
export class NavigationService {
  constructor(entityManager, permissionsService) {
    this.entityManager = entityManager;
    this.permissionsService = permissionsService;
  }

  async getUserNavigationTabs(userId) {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
    });
    if (!user) return [];

    // 1. Get all active permission set IDs for the user
    const profilePermSets = await this.entityManager.find(PermissionSet, {
      where: { profileId: user.profileId },
    });
    const assignments = await this.entityManager.find(PermissionSetAssignment, {
      where: { userId },
    });
    const assignedSetIds = assignments.map((a) => a.permissionSetId);

    const activeSetIds = [];
    if (profilePermSets && profilePermSets.length > 0) {
      activeSetIds.push(...profilePermSets.map((ps) => ps.id));
    }
    activeSetIds.push(...assignedSetIds);

    if (activeSetIds.length === 0) return [];

    // 2. Query all schema objects and aggregate their settings under the active permission sets
    const sql = `
      SELECT 
        so.id as "schemaObjectId",
        so.api_name as "apiName",
        so.label as "label",
        so.icon_name as "iconName",
        so.tab_type as "tabType",
        MIN(COALESCE(ts.precedence_order, so.default_sort_order)) as "sortOrder",
        CASE 
          WHEN COUNT(ts.id) = 0 THEN true
          ELSE bool_or(ts.is_visible)
        END as "isVisible"
      FROM schema_objects so
      LEFT JOIN tab_settings ts 
        ON ts.schema_object_id = so.id 
        AND ts.permission_set_id = ANY($1)
      GROUP BY so.id, so.api_name, so.label, so.icon_name, so.tab_type
    `;

    const rawTabs = await this.entityManager.query(sql, [activeSetIds]);

    // 3. OLS Gate Check & Route assignment
    const effectivePermissions = await this.permissionsService.getEffectivePermissions(userId);
    const objectPermissions = (effectivePermissions && effectivePermissions.objects) || {};

    const evaluatedTabs = [];
    for (const tab of rawTabs) {
      // Skip if explicitly hidden by tab settings
      if (!tab.isVisible) continue;

      // OLS read check for OBJECT tab types
      if (tab.tabType === 'OBJECT') {
        const hasRead = objectPermissions[tab.apiName]?.allowRead === true;
        if (!hasRead) continue;
      }

      // Infer route dynamically: lowercased apiName plural or customized dashboard routes
      const route = tab.tabType === 'OBJECT' 
        ? `/${tab.apiName.toLowerCase()}s` 
        : `/${tab.apiName.toLowerCase()}`;

      evaluatedTabs.push({
        apiName: tab.apiName,
        label: tab.label,
        iconName: tab.iconName,
        tabType: tab.tabType,
        route,
        sortOrder: Number(tab.sortOrder),
      });
    }

    // 4. Sort by evaluated sortOrder ASC
    return evaluatedTabs.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async updateTabSetting(updateTabSettingDto, adminUserId) {
    const { permissionSetId, schemaObjectId, isVisible, precedenceOrder } = updateTabSettingDto;

    let setting = await this.entityManager.findOne(TabSetting, {
      where: { permissionSetId, schemaObjectId },
    });

    if (!setting) {
      setting = this.entityManager.create(TabSetting, {
        permissionSetId,
        schemaObjectId,
        createdById: adminUserId,
        lastModifiedById: adminUserId,
      });
    } else {
      setting.lastModifiedById = adminUserId;
    }

    if (isVisible !== undefined) {
      setting.isVisible = isVisible;
    }
    if (precedenceOrder !== undefined) {
      setting.precedenceOrder = precedenceOrder;
    }

    return this.entityManager.save(TabSetting, setting);
  }
}
