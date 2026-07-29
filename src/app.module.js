import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './redis/redis.module.js';
import { User } from './entities/user.entity.js';
import { Role } from './entities/role.entity.js';
import { Profile } from './entities/profile.entity.js';
import { PermissionSet } from './entities/permission-set.entity.js';
import { PermissionSetAssignment } from './entities/permission-set-assignment.entity.js';
import { PublicGroup } from './entities/public-group.entity.js';
import { GroupUserMember } from './entities/group-user-member.entity.js';
import { GroupRoleMember } from './entities/group-role-member.entity.js';
import { SchemaObject } from './entities/schema-object.entity.js';
import { SchemaField } from './entities/schema-field.entity.js';
import { ObjectPermission } from './entities/object-permission.entity.js';
import { FieldPermission } from './entities/field-permission.entity.js';
import { SystemPermission } from './entities/system-permission.entity.js';
import { OrgWideDefault } from './entities/org-wide-default.entity.js';
import { SharingRule } from './entities/sharing-rule.entity.js';
import { Account } from './entities/account.entity.js';
import { AccountShare } from './entities/account-share.entity.js';

import { ProfilesModule } from './profiles/profiles.module.js';
import { RolesModule } from './roles/roles.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { PermissionSetsModule } from './permission-sets/permission-sets.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SharingModule } from './sharing/sharing.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { CandidatesModule } from './candidates/candidates.module.js';
import { AuditModule } from './audit/audit.module.js';
import { DepartmentsModule } from './departments/departments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User,
        Role,
        Profile,
        PermissionSet,
        PermissionSetAssignment,
        PublicGroup,
        GroupUserMember,
        GroupRoleMember,
        SchemaObject,
        SchemaField,
        ObjectPermission,
        FieldPermission,
        SystemPermission,
        OrgWideDefault,
        SharingRule,
        Account,
        AccountShare,
      ],
      synchronize: true,
    }),
    PrismaModule,
    RedisModule,
    ProfilesModule,
    RolesModule,
    PermissionsModule,
    PermissionSetsModule,
    UsersModule,
    AuthModule,
    SharingModule,
    JobsModule,
    CandidatesModule,
    AuditModule,
    DepartmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
