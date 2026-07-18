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
    { module: 'Identity', resource: 'Profile', action: 'Write', code: 'identity:profile:write' },
    { module: 'Identity', resource: 'Profile', action: 'Read', code: 'identity:profile:read' },
    { module: 'Identity', resource: 'Role', action: 'Write', code: 'identity:role:write' },
    { module: 'Identity', resource: 'Role', action: 'Read', code: 'identity:role:read' },
    { module: 'Identity', resource: 'Permission', action: 'Write', code: 'identity:permission:write' },
    { module: 'Identity', resource: 'Permission', action: 'Read', code: 'identity:permission:read' },
    { module: 'Identity', resource: 'PermissionSet', action: 'Write', code: 'identity:permissionset:write' },
    { module: 'Identity', resource: 'PermissionSet', action: 'Read', code: 'identity:permissionset:read' },
    { module: 'Identity', resource: 'User', action: 'Write', code: 'identity:user:write' },
    { module: 'Identity', resource: 'User', action: 'Read', code: 'identity:user:read' },
    
    // Recruitment Permissions
    { module: 'Recruitment', resource: 'Job', action: 'Write', code: 'recruitment:job:write' },
    { module: 'Recruitment', resource: 'Job', action: 'Read', code: 'recruitment:job:read' },
    { module: 'Recruitment', resource: 'Candidate', action: 'Write', code: 'recruitment:candidate:write' },
    { module: 'Recruitment', resource: 'Candidate', action: 'Read', code: 'recruitment:candidate:read' },
    
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
  await prisma.profilePermission.createMany({
    data: seededPermissions.map((p) => ({
      profileId: adminProfile.id,
      permissionId: p.id,
    })),
  });

  // Recruiter Profile gets Recruitment Write/Read permissions
  const recruiterPermCodes = [
    'recruitment:job:write',
    'recruitment:job:read',
    'recruitment:candidate:write',
    'recruitment:candidate:read',
  ];
  await prisma.profilePermission.deleteMany({ where: { profileId: recruiterProfile.id } });
  await prisma.profilePermission.createMany({
    data: getPermIdsByCodes(recruiterPermCodes).map((pid) => ({
      profileId: recruiterProfile.id,
      permissionId: pid,
    })),
  });

  // Hiring Manager Profile gets Recruitment Read-Only
  const hmPermCodes = ['recruitment:job:read', 'recruitment:candidate:read'];
  await prisma.profilePermission.deleteMany({ where: { profileId: hiringManagerProfile.id } });
  await prisma.profilePermission.createMany({
    data: getPermIdsByCodes(hmPermCodes).map((pid) => ({
      profileId: hiringManagerProfile.id,
      permissionId: pid,
    })),
  });

  // Read Only Profile gets HM Perms
  await prisma.profilePermission.deleteMany({ where: { profileId: readOnlyProfile.id } });
  await prisma.profilePermission.createMany({
    data: getPermIdsByCodes(hmPermCodes).map((pid) => ({
      profileId: readOnlyProfile.id,
      permissionId: pid,
    })),
  });

  // 4. Seed Roles (Hierarchy only)
  console.log('[Seed] Seeding roles hierarchy...');
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

  const managerRole = await prisma.role.upsert({
    where: { name: 'Recruitment Manager' },
    update: { parentId: hrHeadRole.id },
    create: { name: 'Recruitment Manager', parentId: hrHeadRole.id },
  });

  const recruiterRole = await prisma.role.upsert({
    where: { name: 'Recruiter' },
    update: { parentId: managerRole.id },
    create: { name: 'Recruiter', parentId: managerRole.id },
  });

  // 5. Seed Sharing Children Metadata (Job -> Candidate)
  console.log('[Seed] Seeding resource share children metadata rules...');
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
  
  await prisma.user.upsert({
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

  // Disconnect
  await prisma.$disconnect();
  await pool.end();
  console.log('[Seed] Seeding completed successfully.');
}

main().catch((error) => {
  console.error('[Seed] Error occurred while seeding database:', error);
  process.exit(1);
});
