const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing');
  }

  console.log('[Seed] Connecting to database...');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('[Seed] Database connected. Starting data seed...');

  // 1. Seed Permissions
  const permissions = [
    // Identity Management Permissions
    { module: 'Identity', resource: 'Profile', action: 'Create', code: 'identity:profile:create' },
    { module: 'Identity', resource: 'Profile', action: 'Read', code: 'identity:profile:read' },
    { module: 'Identity', resource: 'Profile', action: 'Update', code: 'identity:profile:update' },
    { module: 'Identity', resource: 'Profile', action: 'Delete', code: 'identity:profile:delete' },
    { module: 'Identity', resource: 'Role', action: 'Write', code: 'identity:role:write' },
    { module: 'Identity', resource: 'Role', action: 'Read', code: 'identity:role:read' },
    { module: 'Identity', resource: 'Permission', action: 'Write', code: 'identity:permission:write' },
    { module: 'Identity', resource: 'Permission', action: 'Read', code: 'identity:permission:read' },
    { module: 'Identity', resource: 'PermissionSet', action: 'Write', code: 'identity:permissionset:write' },
    { module: 'Identity', resource: 'PermissionSet', action: 'Read', code: 'identity:permissionset:read' },
    { module: 'Identity', resource: 'User', action: 'Write', code: 'identity:user:write' },
    { module: 'Identity', resource: 'User', action: 'Read', code: 'identity:user:read' },
    { module: 'Identity', resource: 'Department', action: 'Write', code: 'identity:department:write' },
    { module: 'Identity', resource: 'Department', action: 'Read', code: 'identity:department:read' },
    
    // Recruitment CRUD Permissions
    { module: 'Recruitment', resource: 'Job', action: 'Create', code: 'recruitment:job:create' },
    { module: 'Recruitment', resource: 'Job', action: 'Read', code: 'recruitment:job:read' },
    { module: 'Recruitment', resource: 'Job', action: 'Update', code: 'recruitment:job:update' },
    { module: 'Recruitment', resource: 'Job', action: 'Delete', code: 'recruitment:job:delete' },
    { module: 'Recruitment', resource: 'Candidate', action: 'Create', code: 'recruitment:candidate:create' },
    { module: 'Recruitment', resource: 'Candidate', action: 'Read', code: 'recruitment:candidate:read' },
    { module: 'Recruitment', resource: 'Candidate', action: 'Update', code: 'recruitment:candidate:update' },
    { module: 'Recruitment', resource: 'Candidate', action: 'Delete', code: 'recruitment:candidate:delete' },
    
    // System Permissions
    { module: 'System', resource: 'Audit', action: 'Read', code: 'system:audit:read' },
  ];

  console.log('[Seed] Seeding atomic permissions...');
  const seededPermissions = [];
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    seededPermissions.push(p);
  }

  // Helper function to find permission IDs by code prefix or exact matches
  const getPermIdsByCodes = (codes) => {
    return seededPermissions
      .filter((p) => codes.includes(p.code))
      .map((p) => p.id);
  };

  // 2. Seed Profiles
  console.log('[Seed] Seeding default profiles...');
  const adminProfile = await prisma.profile.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'System Administrator - bypasses record security checks' },
  });

  const recruiterProfile = await prisma.profile.upsert({
    where: { name: 'Recruiter' },
    update: {},
    create: { name: 'Recruiter', description: 'Access to recruitment modules' },
  });

  const hiringManagerProfile = await prisma.profile.upsert({
    where: { name: 'Hiring Manager' },
    update: {},
    create: { name: 'Hiring Manager', description: 'Read-only access to recruitment data' },
  });

  const readOnlyProfile = await prisma.profile.upsert({
    where: { name: 'Read Only' },
    update: {},
    create: { name: 'Read Only', description: 'General system read-only access' },
  });

  // 3. Bind Profile Permissions
  console.log('[Seed] Binding permissions to profiles...');
  
  // Admin Profile gets all permissions
  await prisma.profilePermission.deleteMany({ where: { profileId: adminProfile.id } });
  for (const perm of seededPermissions) {
    await prisma.profilePermission.create({
      data: { profileId: adminProfile.id, permissionId: perm.id },
    });
  }

  // Recruiter Profile Permissions
  await prisma.profilePermission.deleteMany({ where: { profileId: recruiterProfile.id } });
  const recruiterPermCodes = [
    'recruitment:job:read',
    'recruitment:job:create',
    'recruitment:job:update',
    'recruitment:candidate:read',
    'recruitment:candidate:create',
    'recruitment:candidate:update',
    'identity:profile:read',
  ];
  for (const permId of getPermIdsByCodes(recruiterPermCodes)) {
    await prisma.profilePermission.create({
      data: { profileId: recruiterProfile.id, permissionId: permId },
    });
  }

  // Hiring Manager Profile Permissions
  await prisma.profilePermission.deleteMany({ where: { profileId: hiringManagerProfile.id } });
  const hmPermCodes = [
    'recruitment:job:read',
    'recruitment:candidate:read',
    'recruitment:candidate:update', // HM can review scorecards
    'identity:profile:read',
  ];
  for (const permId of getPermIdsByCodes(hmPermCodes)) {
    await prisma.profilePermission.create({
      data: { profileId: hiringManagerProfile.id, permissionId: permId },
    });
  }

  // Read Only Profile Permissions
  await prisma.profilePermission.deleteMany({ where: { profileId: readOnlyProfile.id } });
  const roPermCodes = [
    'recruitment:job:read',
    'recruitment:candidate:read',
    'identity:profile:read',
  ];
  for (const permId of getPermIdsByCodes(roPermCodes)) {
    await prisma.profilePermission.create({
      data: { profileId: readOnlyProfile.id, permissionId: permId },
    });
  }

  // 4. Seed Standard Role Hierarchy
  console.log('[Seed] Seeding Roles hierarchy...');
  
  const ceoRole = await prisma.role.upsert({
    where: { name: 'CEO' },
    update: {},
    create: { name: 'CEO' },
  });

  const hrHeadRole = await prisma.role.upsert({
    where: { name: 'HR Head' },
    update: { parentId: ceoRole.id },
    create: { name: 'HR Head', parentId: ceoRole.id },
  });

  const recruiterMgrRole = await prisma.role.upsert({
    where: { name: 'Recruitment Manager' },
    update: { parentId: hrHeadRole.id },
    create: { name: 'Recruitment Manager', parentId: hrHeadRole.id },
  });

  const recruiterRole = await prisma.role.upsert({
    where: { name: 'Recruiter' },
    update: { parentId: recruiterMgrRole.id },
    create: { name: 'Recruiter', parentId: recruiterMgrRole.id },
  });

  // 5. Seed Sharing Model Cascades (Rules metadata)
  console.log('[Seed] Seeding Resource Share Cascading Relationships...');
  await prisma.resourceShareChild.upsert({
    where: { parentType_childType: { parentType: 'Job', childType: 'Candidate' } },
    update: {},
    create: {
      parentType: 'Job',
      childType: 'Candidate',
      relationTable: 'candidate_jobs',
      parentFkField: 'job_id',
      childFkField: 'candidate_id',
    },
  });

  // 6. Seed Default Super Admin User
  console.log('[Seed] Seeding root Admin user...');
  const adminEmail = 'admin@ats.com';
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const rootAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      profileId: adminProfile.id,
      roleId: ceoRole.id,
    },
  });

  // 7. Seed OWD Sharing Defaults
  console.log('[Seed] Seeding sharing defaults...');
  await prisma.sharingDefault.upsert({
    where: { resourceType: 'Job' },
    update: {},
    create: {
      resourceType: 'Job',
      defaultInternalAccess: 'PUBLIC_READ_WRITE',
      defaultExternalAccess: 'PUBLIC_READ_WRITE',
      grantAccessUsingHierarchies: true,
      createdById: rootAdmin.id,
      lastModifiedById: rootAdmin.id,
    },
  });

  await prisma.sharingDefault.upsert({
    where: { resourceType: 'Candidate' },
    update: {},
    create: {
      resourceType: 'Candidate',
      defaultInternalAccess: 'PRIVATE',
      defaultExternalAccess: 'PRIVATE',
      grantAccessUsingHierarchies: true,
      createdById: rootAdmin.id,
      lastModifiedById: rootAdmin.id,
    },
  });

  // Disconnect
  await prisma.$disconnect();
  await pool.end();
  console.log('[Seed] Seeding completed successfully.');
}

main().catch((error) => {
  console.error('[Seed] Error occurred while seeding database:', error);
  process.exit(1);
});
