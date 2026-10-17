import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';


const { Client } = pg;


const dbUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || "postgresql://postgres:root@localhost:5432/ATS%20TV?schema=public";


const uuid = () => crypto.randomUUID();


async function main() {
  console.log('Connecting to database...');
  const isSsl = dbUrl.includes('sslmode=require') || process.env.NODE_ENV === 'production';
  const client = new Client({
    connectionString: dbUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();


  try {
    // ─── 1. ROLES (hierarchical) ──────────────────────────────────────
    console.log('\n📌 Creating Roles...');


    const roleDefs = [
      { key: 'admin',         name: 'Admin',          developerName: 'admin',          parentKey: null },
      { key: 'hrRecruiter',   name: 'HR / Recruiter',  developerName: 'hr_recruiter',   parentKey: 'admin' },
      { key: 'hiringManager', name: 'Hiring Manager',  developerName: 'hiring_manager', parentKey: 'admin' },
      { key: 'interviewer',   name: 'Interviewer',     developerName: 'interviewer',    parentKey: 'hiringManager' },
      { key: 'candidate',     name: 'Candidate',       developerName: 'candidate',      parentKey: null },
    ];


    const roles = {};
    for (const r of roleDefs) {
      const parentId = r.parentKey ? roles[r.parentKey].id : null;
      const res = await client.query(`
        INSERT INTO "roles" ("id", "name", "developer_name", "parent_id", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("name") DO UPDATE SET "developer_name" = EXCLUDED."developer_name"
        RETURNING "id";
      `, [uuid(), r.name, r.developerName, parentId]);
      roles[r.key] = { id: res.rows[0].id, name: r.name };
      console.log(`  ✔ Role: ${r.name}`);
    }


    // ─── 2. PROFILES ──────────────────────────────────────────────────
    console.log('\n📌 Creating Profiles...');


    const profileDefs = [
      { key: 'admin',         name: 'ATS Admin' },
      { key: 'recruiter',     name: 'ATS Recruiter' },
      { key: 'hiringManager', name: 'ATS Hiring Manager' },
      { key: 'interviewer',   name: 'ATS Interviewer' },
      { key: 'candidate',     name: 'ATS Candidate' },
    ];


    const profiles = {};
    for (const p of profileDefs) {
      const res = await client.query(`
        INSERT INTO "profiles" ("id", "name", "is_custom", "created_at", "updated_at")
        VALUES ($1, $2, false, NOW(), NOW())
        ON CONFLICT ("name") DO UPDATE SET "is_custom" = EXCLUDED."is_custom"
        RETURNING "id";
      `, [uuid(), p.name]);
      profiles[p.key] = { id: res.rows[0].id, name: p.name };
      console.log(`  ✔ Profile: ${p.name}`);
    }


    // ─── 3. PERMISSION SETS (1:1 with profiles) ──────────────────────
    console.log('\n📌 Creating Permission Sets...');


    const permSetDefs = [
      { key: 'admin',         name: 'ATS Admin Permissions',          profileKey: 'admin' },
      { key: 'recruiter',     name: 'ATS Recruiter Permissions',      profileKey: 'recruiter' },
      { key: 'hiringManager', name: 'ATS Hiring Manager Permissions', profileKey: 'hiringManager' },
      { key: 'interviewer',   name: 'ATS Interviewer Permissions',    profileKey: 'interviewer' },
      { key: 'candidate',     name: 'ATS Candidate Permissions',      profileKey: 'candidate' },
    ];


    const permSets = {};
    for (const ps of permSetDefs) {
      const res = await client.query(`
        INSERT INTO "permission_sets" ("id", "name", "is_custom", "is_managed_by_profile", "profile_id", "created_at", "updated_at")
        VALUES ($1, $2, false, true, $3, NOW(), NOW())
        ON CONFLICT ("name") DO UPDATE SET "profile_id" = EXCLUDED."profile_id"
        RETURNING "id";
      `, [uuid(), ps.name, profiles[ps.profileKey].id]);
      permSets[ps.key] = { id: res.rows[0].id, name: ps.name };
      console.log(`  ✔ Permission Set: ${ps.name}`);
    }


    // ─── 4. SYSTEM PERMISSIONS per Permission Set ─────────────────────
    console.log('\n📌 Assigning System Permissions...');


    const sysPermKeys = [
      'viewAllData', 'modifyAllData', 'manageUsers', 'manageProfiles',
      'manageRoles', 'manageSharing', 'managePermissionSets',
    ];


    const sysPermMap = {
      admin:         sysPermKeys.map(k => ({ key: k, enabled: true })),
      recruiter:     sysPermKeys.map(k => ({ key: k, enabled: ['viewAllData'].includes(k) })),
      hiringManager: sysPermKeys.map(k => ({ key: k, enabled: ['viewAllData'].includes(k) })),
      interviewer:   sysPermKeys.map(k => ({ key: k, enabled: false })),
      candidate:     sysPermKeys.map(k => ({ key: k, enabled: false })),
    };


    for (const [key, perms] of Object.entries(sysPermMap)) {
      for (const p of perms) {
        await client.query(`
          INSERT INTO "system_permissions" ("id", "permission_set_id", "permission_key", "is_enabled", "created_at", "updated_at")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT ("permission_set_id", "permission_key") DO UPDATE SET "is_enabled" = $4;
        `, [uuid(), permSets[key].id, p.key, p.enabled]);
      }
      console.log(`  ✔ System perms for: ${permSets[key].name}`);
    }


    // ─── 5. LOAD SCHEMA OBJECTS (created by seed-schema-fields.js) + OLS ──
    console.log('\n📌 Loading Schema Objects & Creating OLS...');


    const { rows: soRows } = await client.query(`SELECT "id", "api_name" AS "apiName", "default_sort_order" AS "sortOrder" FROM "schema_objects" ORDER BY "default_sort_order";`);
    const schemaObjects = soRows;
    console.log(`  ✔ Loaded ${schemaObjects.length} schema objects from DB`);


    const fullCrud = { create: true, read: true, edit: true, del: true, viewAll: true, modifyAll: true };
    const readEdit = { create: false, read: true, edit: true, del: false, viewAll: false, modifyAll: false };
    const readOnly = { create: false, read: true, edit: false, del: false, viewAll: false, modifyAll: false };
    const noAccess = { create: false, read: false, edit: false, del: false, viewAll: false, modifyAll: false };


    const olsMatrix = {
      admin: {
        Job: fullCrud, Candidate: fullCrud, Department: fullCrud,
        User: fullCrud, Profile: fullCrud, Role: fullCrud,
        Analytics: fullCrud, AuditLog: fullCrud,
      },
      recruiter: {
        Job: { create: true, read: true, edit: true, del: false, viewAll: false, modifyAll: false },
        Candidate: { create: true, read: true, edit: true, del: false, viewAll: false, modifyAll: false },
        Department: readOnly, User: readOnly, Profile: readOnly, Role: readOnly,
        Analytics: readOnly, AuditLog: noAccess,
      },
      hiringManager: {
        Job: { create: true, read: true, edit: true, del: false, viewAll: false, modifyAll: false },
        Candidate: readEdit, Department: readOnly, User: readOnly,
        Profile: readOnly, Role: readOnly, Analytics: readOnly, AuditLog: noAccess,
      },
      interviewer: {
        Job: readOnly, Candidate: readOnly, Department: readOnly,
        User: noAccess, Profile: noAccess, Role: noAccess,
        Analytics: noAccess, AuditLog: noAccess,
      },
      candidate: {
        Job: readOnly, Candidate: noAccess, Department: noAccess,
        User: noAccess, Profile: noAccess, Role: noAccess,
        Analytics: noAccess, AuditLog: noAccess,
      },
    };


    for (const [roleKey, objects] of Object.entries(olsMatrix)) {
      for (const [apiName, perms] of Object.entries(objects)) {
        const so = schemaObjects.find(s => s.apiName === apiName);
        if (!so) continue;
        await client.query(`
          INSERT INTO "object_permissions"
            ("id", "permission_set_id", "schema_object_id",
             "allow_create", "allow_read", "allow_edit", "allow_delete",
             "view_all_data", "modify_all_data", "created_at", "updated_at")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT ("permission_set_id", "schema_object_id") DO UPDATE SET
            "allow_create" = $4, "allow_read" = $5, "allow_edit" = $6, "allow_delete" = $7,
            "view_all_data" = $8, "modify_all_data" = $9;
        `, [uuid(), permSets[roleKey].id, so.id,
            perms.create, perms.read, perms.edit, perms.del, perms.viewAll, perms.modifyAll]);
      }
      console.log(`  ✔ OLS for: ${permSets[roleKey].name}`);
    }


    // ─── 6. TAB SETTINGS (all visible for all permission sets) ────────
    console.log('\n📌 Creating Tab Settings...');


    for (const ps of Object.values(permSets)) {
      for (const so of schemaObjects) {
        await client.query(`
          INSERT INTO "tab_settings" ("id", "permission_set_id", "schema_object_id", "is_visible", "precedence_order", "created_at", "updated_at")
          VALUES ($1, $2, $3, true, $4, NOW(), NOW())
          ON CONFLICT ("permission_set_id", "schema_object_id") DO UPDATE SET "is_visible" = true;
        `, [uuid(), ps.id, so.id, so.sortOrder]);
      }
    }
    console.log(`  ✔ Tab visibility set for all profiles`);


    // ─── 7. ORG-WIDE DEFAULTS ─────────────────────────────────────────
    console.log('\n📌 Creating Org-Wide Defaults...');


    const owdSettings = {
      Job:        'PRIVATE',
      Candidate:  'PRIVATE',
      Department: 'READ_ONLY',
    };


    for (const [apiName, accessLevel] of Object.entries(owdSettings)) {
      const so = schemaObjects.find(s => s.apiName === apiName);
      if (!so) continue;
      await client.query(`
        INSERT INTO "org_wide_defaults" ("id", "schema_object_id", "default_access_level", "grant_access_using_hierarchies", "created_at", "updated_at")
        VALUES ($1, $2, $3, true, NOW(), NOW())
        ON CONFLICT ("schema_object_id") DO UPDATE SET "default_access_level" = $3;
      `, [uuid(), so.id, accessLevel]);
      console.log(`  ✔ OWD ${apiName}: ${accessLevel}`);
    }


    // ─── 8. USERS ─────────────────────────────────────────────────────
    console.log('\n📌 Creating Users...');


    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);


    const users = [
      { firstName: 'Amit',  lastName: 'Sharma', email: 'amit.sharma@ats.com',  profileKey: 'admin',         roleKey: 'admin' },
      { firstName: 'Priya', lastName: 'Verma',  email: 'priya.verma@ats.com',  profileKey: 'recruiter',     roleKey: 'hrRecruiter' },
      { firstName: 'Rahul', lastName: 'Mehta',  email: 'rahul.mehta@ats.com',  profileKey: 'hiringManager', roleKey: 'hiringManager' },
      { firstName: 'Neha',  lastName: 'Singh',  email: 'neha.singh@ats.com',   profileKey: 'interviewer',   roleKey: 'interviewer' },
      { firstName: 'Arjun', lastName: 'Kumar',  email: 'arjun.kumar@ats.com',  profileKey: 'candidate',     roleKey: 'candidate' },
    ];


    for (const u of users) {
      const userId = uuid();
      await client.query(`
        INSERT INTO "users" ("id", "email", "password_hash", "first_name", "last_name", "is_active",
                             "profile_id", "role_id", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, true, $6, $7, NOW(), NOW())
        ON CONFLICT ("email") DO NOTHING;
      `, [userId, u.email, passwordHash, u.firstName, u.lastName, profiles[u.profileKey].id, roles[u.roleKey].id]);
      console.log(`  ✔ User: ${u.firstName} ${u.lastName} (${u.email}) → Profile: ${profiles[u.profileKey].name}, Role: ${roles[u.roleKey].name}`);
    }


    console.log('\n✅ Seed complete!');
    console.log(`\n📋 Login credentials for all users:`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Emails: ${users.map(u => u.email).join(', ')}`);


  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();