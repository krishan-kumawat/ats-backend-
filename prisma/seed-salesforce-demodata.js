import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/TalentVibesATS?schema=public";

async function main() {
  console.log('Connecting to database:', dbUrl);
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    console.log('Starting demo data seeding...');

    // 0. Pre-generate password hash for users
    const passwordHash = bcrypt.hashSync('Password123!', 10);

    // 1. Seed Roles in Top-Down Order (CEO -> VP -> Director -> Lead -> Recruiter)
    const ceoRoleId = crypto.randomUUID();
    const vpRoleId = crypto.randomUUID();
    const directorRoleId = crypto.randomUUID();
    const leadRoleId = crypto.randomUUID();
    const recruiterRoleId = crypto.randomUUID();

    await client.query(`INSERT INTO "roles" ("id", "name", "developer_name", "parent_id") VALUES ('${ceoRoleId}', 'CEO', 'CEO', NULL) ON CONFLICT ("name") DO NOTHING;`);
    
    // Retrieve actual CEO Role ID in case it already existed
    const ceoRoleRes = await client.query('SELECT "id" FROM "roles" WHERE "name" = \'CEO\'');
    const dbCeoRoleId = ceoRoleRes.rows[0].id;

    await client.query(`INSERT INTO "roles" ("id", "name", "developer_name", "parent_id") VALUES ('${vpRoleId}', 'VP of Recruitment', 'VP_of_Recruitment', '${dbCeoRoleId}') ON CONFLICT ("name") DO NOTHING;`);
    const vpRoleRes = await client.query('SELECT "id" FROM "roles" WHERE "name" = \'VP of Recruitment\'');
    const dbVpRoleId = vpRoleRes.rows[0].id;

    await client.query(`INSERT INTO "roles" ("id", "name", "developer_name", "parent_id") VALUES ('${directorRoleId}', 'Recruitment Director', 'Recruitment_Director', '${dbVpRoleId}') ON CONFLICT ("name") DO NOTHING;`);
    const dirRoleRes = await client.query('SELECT "id" FROM "roles" WHERE "name" = \'Recruitment Director\'');
    const dbDirRoleId = dirRoleRes.rows[0].id;

    await client.query(`INSERT INTO "roles" ("id", "name", "developer_name", "parent_id") VALUES ('${leadRoleId}', 'Lead Recruiter', 'Lead_Recruiter', '${dbDirRoleId}') ON CONFLICT ("name") DO NOTHING;`);
    const leadRoleRes = await client.query('SELECT "id" FROM "roles" WHERE "name" = \'Lead Recruiter\'');
    const dbLeadRoleId = leadRoleRes.rows[0].id;

    await client.query(`INSERT INTO "roles" ("id", "name", "developer_name", "parent_id") VALUES ('${recruiterRoleId}', 'Recruiter', 'Recruiter', '${dbLeadRoleId}') ON CONFLICT ("name") DO NOTHING;`);
    const recRoleRes = await client.query('SELECT "id" FROM "roles" WHERE "name" = \'Recruiter\'');
    const dbRecruiterRoleId = recRoleRes.rows[0].id;

    console.log('Roles seeded successfully.');

    // 2. Seed 5 Salesforce-equivalent Profiles
    const sysAdminId = crypto.randomUUID();
    const standardUserId = crypto.randomUUID();
    const recruiterProfileId = crypto.randomUUID();
    const hiringManagerProfileId = crypto.randomUUID();
    const readOnlyProfileId = crypto.randomUUID();

    await client.query(`
      INSERT INTO "profiles" ("id", "name", "description", "is_custom")
      VALUES
        ('${sysAdminId}', 'System Administrator', 'Full administrative authority.', false),
        ('${standardUserId}', 'Standard User', 'General access to candidate and job objects.', false),
        ('${recruiterProfileId}', 'Recruiter Profile', 'Recruiter access for hiring pipelines.', false),
        ('${hiringManagerProfileId}', 'Hiring Manager', 'Read-only access to candidates, full job read/write.', false),
        ('${readOnlyProfileId}', 'Read Only', 'Strictly view-only access across objects.', false)
      ON CONFLICT ("name") DO NOTHING;
    `);

    // Fetch Profile IDs in case they existed
    const profRes = await client.query('SELECT "id", "name" FROM "profiles"');
    const getProfileId = (name) => profRes.rows.find(p => p.name === name).id;

    const dbSysAdminId = getProfileId('System Administrator');
    const dbStandardUserId = getProfileId('Standard User');
    const dbRecruiterId = getProfileId('Recruiter Profile');
    const dbHiringManagerId = getProfileId('Hiring Manager');
    const dbReadOnlyId = getProfileId('Read Only');

    // 3. Seed Base Permission Sets for each Profile
    const adminSetId = crypto.randomUUID();
    const standardSetId = crypto.randomUUID();
    const recruiterSetId = crypto.randomUUID();
    const managerSetId = crypto.randomUUID();
    const readSetId = crypto.randomUUID();

    await client.query(`
      INSERT INTO "permission_sets" ("id", "name", "description", "is_custom", "profile_id")
      VALUES
        ('${adminSetId}', 'SysAdmin_Base', 'SysAdmin Base Permission Set', false, '${dbSysAdminId}'),
        ('${standardSetId}', 'Standard_Base', 'Standard User Base Permission Set', false, '${dbStandardUserId}'),
        ('${recruiterSetId}', 'Recruiter_Base', 'Recruiter Base Permission Set', false, '${dbRecruiterId}'),
        ('${managerSetId}', 'HiringManager_Base', 'Hiring Manager Base Permission Set', false, '${dbHiringManagerId}'),
        ('${readSetId}', 'ReadOnly_Base', 'Read Only Base Permission Set', false, '${dbReadOnlyId}')
      ON CONFLICT ("name") DO NOTHING;
    `);

    const psetRes = await client.query('SELECT "id", "name" FROM "permission_sets"');
    const getPsetId = (name) => psetRes.rows.find(p => p.name === name).id;

    const dbAdminSetId = getPsetId('SysAdmin_Base');
    const dbStandardSetId = getPsetId('Standard_Base');
    const dbRecruiterSetId = getPsetId('Recruiter_Base');
    const dbManagerSetId = getPsetId('HiringManager_Base');
    const dbReadSetId = getPsetId('ReadOnly_Base');

    // 4. Seed Schema Objects (Job & Candidate)
    const jobId = crypto.randomUUID();
    const candId = crypto.randomUUID();

    await client.query(`
      INSERT INTO "schema_objects" ("id", "api_name", "label")
      VALUES 
        ('${jobId}', 'Job', 'Job Requisition'),
        ('${candId}', 'Candidate', 'Candidate')
      ON CONFLICT ("api_name") DO NOTHING;
    `);

    const objRes = await client.query('SELECT "id", "api_name" FROM "schema_objects"');
    const dbJobObjectId = objRes.rows.find(o => o.api_name === 'Job').id;
    const dbCandObjectId = objRes.rows.find(o => o.api_name === 'Candidate').id;

    console.log('Schema Objects seeded.');

    // 5. Seed OLS permissions for Profiles
    // allowCreate, allowRead, allowEdit, allowDelete, viewAllData, modifyAllData
    await client.query(`
      INSERT INTO "object_permissions"
        ("id", "permission_set_id", "schema_object_id", "allow_create", "allow_read", "allow_edit", "allow_delete", "view_all_data", "modify_all_data")
      VALUES
        -- SysAdmin gets full bypass
        ('${crypto.randomUUID()}', '${dbAdminSetId}', '${dbJobObjectId}', true, true, true, true, true, true),
        ('${crypto.randomUUID()}', '${dbAdminSetId}', '${dbCandObjectId}', true, true, true, true, true, true),

        -- Standard User (Create, Read, Edit on Job & Candidate)
        ('${crypto.randomUUID()}', '${dbStandardSetId}', '${dbJobObjectId}', true, true, true, false, false, false),
        ('${crypto.randomUUID()}', '${dbStandardSetId}', '${dbCandObjectId}', true, true, true, false, false, false),

        -- Recruiter (Full CRUD on Candidate, Create/Read/Edit on Job)
        ('${crypto.randomUUID()}', '${dbRecruiterSetId}', '${dbJobObjectId}', true, true, true, false, false, false),
        ('${crypto.randomUUID()}', '${dbRecruiterSetId}', '${dbCandObjectId}', true, true, true, true, false, false),

        -- Hiring Manager (Read-Only Candidate, Full Job CRUD)
        ('${crypto.randomUUID()}', '${dbManagerSetId}', '${dbJobObjectId}', true, true, true, true, false, false),
        ('${crypto.randomUUID()}', '${dbManagerSetId}', '${dbCandObjectId}', false, true, false, false, false, false),

        -- Read Only (Strictly Read-Only on both)
        ('${crypto.randomUUID()}', '${dbReadSetId}', '${dbJobObjectId}', false, true, false, false, false, false),
        ('${crypto.randomUUID()}', '${dbReadSetId}', '${dbCandObjectId}', false, true, false, false, false, false)
      ON CONFLICT ("permission_set_id", "schema_object_id") DO UPDATE SET
        "allow_create" = EXCLUDED."allow_create",
        "allow_read" = EXCLUDED."allow_read",
        "allow_edit" = EXCLUDED."allow_edit",
        "allow_delete" = EXCLUDED."allow_delete",
        "view_all_data" = EXCLUDED."view_all_data",
        "modify_all_data" = EXCLUDED."modify_all_data";
    `);

    // 6. Seed System Permissions (modifyAllData / viewAllData)
    await client.query(`
      INSERT INTO "system_permissions" ("id", "permission_set_id", "permission_key", "is_enabled")
      VALUES
        ('${crypto.randomUUID()}', '${dbAdminSetId}', 'viewAllData', true),
        ('${crypto.randomUUID()}', '${dbAdminSetId}', 'modifyAllData', true)
      ON CONFLICT ("permission_set_id", "permission_key") DO NOTHING;
    `);

    // 7. Seed Users (1 CEO with most higher role, and 5 randomchar@sf.com users)
    const ceoId = crypto.randomUUID();
    const u1Id = crypto.randomUUID();
    const u2Id = crypto.randomUUID();
    const u3Id = crypto.randomUUID();
    const u4Id = crypto.randomUUID();
    const u5Id = crypto.randomUUID();

    // Helper to generate random 6-character username string
    const randStr = (len) => crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);

    await client.query(`
      INSERT INTO "users" ("id", "email", "password_hash", "first_name", "last_name", "is_active", "profile_id", "role_id")
      VALUES
        -- The Highest Role User (CEO)
        ('${ceoId}', 'ceo@sf.com', '${passwordHash}', 'Marc', 'Benioff', true, '${dbSysAdminId}', '${dbCeoRoleId}'),
        
        -- 5 users following randomchar@sf.com format mapped to different roles and profiles
        ('${u1Id}', '${randStr(6)}@sf.com', '${passwordHash}', 'Recruitment', 'VP', true, '${dbStandardUserId}', '${dbVpRoleId}'),
        ('${u2Id}', '${randStr(6)}@sf.com', '${passwordHash}', 'Recruiter', 'Director', true, '${dbRecruiterId}', '${dbDirRoleId}'),
        ('${u3Id}', '${randStr(6)}@sf.com', '${passwordHash}', 'Hiring', 'Manager', true, '${dbHiringManagerId}', '${dbLeadRoleId}'),
        ('${u4Id}', '${randStr(6)}@sf.com', '${passwordHash}', 'Read', 'OnlyUser', true, '${dbReadOnlyId}', '${dbRecruiterRoleId}'),
        ('${u5Id}', '${randStr(6)}@sf.com', '${passwordHash}', 'Guest', 'Recruiter', true, '${dbRecruiterId}', '${dbRecruiterRoleId}')
      ON CONFLICT ("email") DO NOTHING;
    `);

    console.log('Database seeded with profiles, hierarchical roles, and 6 users successfully!');
  } catch (err) {
    console.error('Error seeding demo data:', err);
  } finally {
    await client.end();
  }
}

main();
