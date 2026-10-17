import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Dependencies,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { SystemPermGuard } from '../common/guards/system-perm.guard.js';
import { RequireSystemPerm } from '../common/decorators/require-system-perm.decorator.js';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { PermissionSet } from '../entities/permission-set.entity.js';
import { PermissionSetAssignment } from '../entities/permission-set-assignment.entity.js';
import { PublicGroup } from '../entities/public-group.entity.js';
import { GroupUserMember } from '../entities/group-user-member.entity.js';

@ApiTags('Setup Console')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SystemPermGuard)
@Controller('setup/users')
@Dependencies(getEntityManagerToken())
export class SetupController {
  constructor(entityManager) {
    this.entityManager = entityManager;
  }

  @Get(':id/details')
  @RequireSystemPerm('viewAllData')
  @ApiOperation({ summary: 'Get details of user and all security groups metadata' })
  @ApiResponse({ status: 200, description: 'Details returned successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserDetails(@Param('id') userId) {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: { profile: true, role: true },
    });
    if (!user) {
      throw new NotFoundException(`User not found for ID: ${userId}`);
    }

    // 1. Get assigned custom permission sets (profileId IS NULL)
    const assignments = await this.entityManager.find(PermissionSetAssignment, {
      where: { userId },
      relations: { permissionSet: true },
    });
    const assignedPermissionSets = assignments
      .map((a) => a.permissionSet)
      .filter((ps) => ps && ps.profileId === null);

    // 2. Get all custom permission sets
    const allPermissionSets = await this.entityManager.find(PermissionSet, {
      where: { profileId: IsNull() },
    });

    // 3. Get assigned public groups
    const groupMemberships = await this.entityManager.find(GroupUserMember, {
      where: { userId },
      relations: { group: true },
    });
    const assignedGroups = groupMemberships
      .map((m) => m.group)
      .filter((g) => g !== null);

    // 4. Get all public groups
    const allGroups = await this.entityManager.find(PublicGroup);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        profile: user.profile ? { id: user.profile.id, name: user.profile.name } : null,
        role: user.role ? { id: user.role.id, name: user.role.name } : null,
        createdDate: user.createdDate,
        createdById: user.createdById,
        createdByName: user.creator ? `${user.creator.firstName} ${user.creator.lastName}` : null,
        lastModifiedDate: user.lastModifiedDate,
        lastModifiedById: user.lastModifiedById,
        lastModifiedByName: user.updater ? `${user.updater.firstName} ${user.updater.lastName}` : null,
      },
      assignedPermissionSets,
      allPermissionSets,
      assignedGroups,
      allGroups,
    };
  }

  @Post(':id/groups')
  @RequireSystemPerm('modifyAllData')
  @ApiOperation({ summary: 'Update public group memberships for a user' })
  @ApiResponse({ status: 200, description: 'Groups updated successfully.' })
  async updateGroups(@Param('id') userId, @Body() body, @Req() request) {
    const adminUserId = request.user.sub;

    const user = await this.entityManager.findOne(User, { where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User not found for ID: ${userId}`);
    }

    // Replace all memberships inside database transaction
    await this.entityManager.transaction(async (trx) => {
      await trx.delete(GroupUserMember, { userId });

      if (body.groupIds && Array.isArray(body.groupIds)) {
        for (const groupId of body.groupIds) {
          const member = trx.create(GroupUserMember, {
            userId,
            groupId,
            createdById: adminUserId,
            lastModifiedById: adminUserId,
          });
          await trx.save(GroupUserMember, member);
        }
      }
    });

    return { success: true };
  }
}
