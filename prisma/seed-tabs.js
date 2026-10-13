import pg from 'pg';
import crypto from 'crypto';
import 'dotenv/config';

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || "postgresql://postgres:root@localhost:5432/ATS%20TV?schema=public";

async function main() {
  console.log('Connecting to database:', dbUrl);
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    console.log('Initializing schema_objects metadata...');

    // 1. Core Schema Objects
    const tabs = [
      { apiName: 'Job', label: 'Jobs', iconName: 'briefcase', tabType: 'OBJECT', sortOrder: 10 },
      { apiName: 'Candidate', label: 'Candidates', iconName: 'users', tabType: 'OBJECT', sortOrder: 20 },
      { apiName: 'Department', label: 'Departments', iconName: 'layers', tabType: 'OBJECT', sortOrder: 30 },
      { apiName: 'User', label: 'Users', iconName: 'settings', tabType: 'OBJECT', sortOrder: 40 },
      { apiName: 'Profile', label: 'Profiles', iconName: 'shield', tabType: 'OBJECT', sortOrder: 50 },
      { apiName: 'Role', label: 'Roles', iconName: 'git-merge', tabType: 'OBJECT', sortOrder: 60 },
      { apiName: 'Analytics', label: 'Analytics', iconName: 'bar-chart-2', tabType: 'DASHBOARD', sortOrder: 70 },
      { apiName: 'AuditLog', label: 'Audit Logs', iconName: 'file-text', tabType: 'OBJECT', sortOrder: 80 }
    ];

    for (const t of tabs) {
      const id = crypto.randomUUID();
      await client.query(`
        INSERT INTO "schema_objects" ("id", "api_name", "label", "icon_name", "tab_type", "default_sort_order", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT ("api_name") DO UPDATE SET 
          "label" = EXCLUDED."label",
          "icon_name" = EXCLUDED."icon_name",
          "tab_type" = EXCLUDED."tab_type",
          "default_sort_order" = EXCLUDED."default_sort_order";
      `, [id, t.apiName, t.label, t.iconName, t.tabType, t.sortOrder]);
    }

    console.log('Schema objects metadata initialized.');

    // Fetch all schema objects
    const objRes = await client.query('SELECT "id", "api_name" FROM "schema_objects";');
    const dbObjects = objRes.rows;

    // Fetch all permission sets
    const psetRes = await client.query('SELECT "id" FROM "permission_sets";');
    const psets = psetRes.rows;

    console.log(`Setting up default tab visibility (is_visible = true) for ${psets.length} permission sets...`);

    for (const ps of psets) {
      for (const obj of dbObjects) {
        // 2. Insert Default Tab Setting
        const settingId = crypto.randomUUID();
        await client.query(`
          INSERT INTO "tab_settings" ("id", "permission_set_id", "schema_object_id", "is_visible", "precedence_order", "created_at", "updated_at")
          VALUES ($1, $2, $3, true, NULL, NOW(), NOW())
          ON CONFLICT ("permission_set_id", "schema_object_id") DO UPDATE SET 
            "is_visible" = true;
        `, [settingId, ps.id, obj.id]);

        // 3. Ensure OLS Read Permission is active so the OLS read gate passes
        const olsId = crypto.randomUUID();
        await client.query(`
          INSERT INTO "object_permissions" 
            ("id", "permission_set_id", "schema_object_id", "allow_read", "allow_create", "allow_edit", "allow_delete", "view_all_data", "modify_all_data", "created_at", "updated_at")
          VALUES ($1, $2, $3, true, false, false, false, false, false, NOW(), NOW())
          ON CONFLICT ("permission_set_id", "schema_object_id") DO UPDATE SET 
            "allow_read" = true;
        `, [olsId, ps.id, obj.id]);
      }
    }

    console.log('All tabs assigned as default and visible on all profiles/permission sets successfully.');

  } catch (err) {
    console.error('Error seeding tabs:', err);
  } finally {
    await client.end();
  }
}

main();
