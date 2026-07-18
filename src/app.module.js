import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
