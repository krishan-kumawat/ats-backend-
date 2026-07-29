import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/TalentVibesATS?schema=public";

async function main() {
  console.log('Connecting to database:', dbUrl);
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    console.log('Seeding Salesforce-grade standard profiles and permissions...');

    // 1. Seed Profiles
    const adminProfileId = crypto.randomUUID();
    const userProfileId = crypto.randomUUID();

    await client.query(`
      INSERT INTO "profiles" ("id", "name", "description", "is_custom")
      VALUES 
        ('${adminProfileId}', 'System Administrator', 'Full access to all settings and records.', false),
        ('${userProfileId}', 'Standard User', 'General access to candidate and job records.', false)
      ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";
    `);

    // Retrieve active profile IDs in case they already existed
    const profRes = await client.query('SELECT "id", "name" FROM "profiles"');
    const dbAdminProfileId = profRes.rows.find(p => p.name === 'System Administrator').id;
    const dbUserProfileId = profRes.rows.find(p => p.name === 'Standard User').id;

    // 2. Seed Permission Sets (linked 1:1 to Profiles)
    const adminPermSetId = crypto.randomUUID();
    const userPermSetId = crypto.randomUUID();

    await client.query(`
      INSERT INTO "permission_sets" ("id", "name", "description", "is_custom", "profile_id")
      VALUES
        ('${adminPermSetId}', 'System Administrator BaseSet', 'Base permissions for System Admin profile', false, '${dbAdminProfileId}'),
        ('${userPermSetId}', 'Standard User BaseSet', 'Base permissions for Standard User profile', false, '${dbUserProfileId}')
      ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";
    `);

    const psetRes = await client.query('SELECT "id", "name" FROM "permission_sets"');
    const dbAdminPermSetId = psetRes.rows.find(ps => ps.name === 'System Administrator BaseSet').id;
    const dbUserPermSetId = psetRes.rows.find(ps => ps.name === 'Standard User BaseSet').id;

    // 3. Seed Schema Objects
    const accObjectId = crypto.randomUUID();

    await client.query(`
      INSERT INTO "schema_objects" ("id", "api_name", "label")
      VALUES ('${accObjectId}', 'Account', 'Account Object')
      ON CONFLICT ("api_name") DO NOTHING;
    `);

    const objRes = await client.query('SELECT "id" FROM "schema_objects" WHERE "api_name" = \'Account\'');
    const dbAccObjectId = objRes.rows[0].id;

    // 4. Seed Schema Fields
    const nameFieldId = crypto.randomUUID();
    const revenueFieldId = crypto.randomUUID();

    await client.query(`
      INSERT INTO "schema_fields" ("id", "schema_object_id", "api_name", "label")
      VALUES
        ('${nameFieldId}', '${dbAccObjectId}', 'name', 'Account Name'),
        ('${revenueFieldId}', '${dbAccObjectId}', 'annualRevenue', 'Annual Revenue')
      ON CONFLICT ("schema_object_id", "api_name") DO NOTHING;
    `);

    const fieldRes = await client.query('SELECT "id", "api_name" FROM "schema_fields" WHERE "schema_object_id" = $1', [dbAccObjectId]);
    const dbNameFieldId = fieldRes.rows.find(f => f.api_name === 'name').id;
    const dbRevenueFieldId = fieldRes.rows.find(f => f.api_name === 'annualRevenue').id;

    // 5. Seed Object-Level Security (OLS)
    await client.query(`
      INSERT INTO "object_permissions" 
        ("id", "permission_set_id", "schema_object_id", "allow_create", "allow_read", "allow_edit", "allow_delete", "view_all_data", "modify_all_data")
      VALUES
        ('${crypto.randomUUID()}', '${dbAdminPermSetId}', '${dbAccObjectId}', true, true, true, true, true, true),
        ('${crypto.randomUUID()}', '${dbUserPermSetId}', '${dbAccObjectId}', false, true, false, false, false, false)
      ON CONFLICT ("permission_set_id", "schema_object_id") DO UPDATE SET
        "allow_create" = EXCLUDED."allow_create",
        "allow_read" = EXCLUDED."allow_read",
        "allow_edit" = EXCLUDED."allow_edit",
        "allow_delete" = EXCLUDED."allow_delete",
        "view_all_data" = EXCLUDED."view_all_data",
        "modify_all_data" = EXCLUDED."modify_all_data";
    `);

    // 6. Seed Field-Level Security (FLS)
    await client.query(`
      INSERT INTO "field_permissions"
        ("id", "permission_set_id", "schema_field_id", "allow_read", "allow_edit")
      VALUES
        -- Admin gets full read/edit on name & revenue
        ('${crypto.randomUUID()}', '${dbAdminPermSetId}', '${dbNameFieldId}', true, true),
        ('${crypto.randomUUID()}', '${dbAdminPermSetId}', '${dbRevenueFieldId}', true, true),
        -- Standard user gets read-only on name, and no access to annualRevenue
        ('${crypto.randomUUID()}', '${dbUserPermSetId}', '${dbNameFieldId}', true, false),
        ('${crypto.randomUUID()}', '${dbUserPermSetId}', '${dbRevenueFieldId}', false, false)
      ON CONFLICT ("permission_set_id", "schema_field_id") DO UPDATE SET
        "allow_read" = EXCLUDED."allow_read",
        "allow_edit" = EXCLUDED."allow_edit";
    `);

    // 7. Seed System Permissions
    await client.query(`
      INSERT INTO "system_permissions"
        ("id", "permission_set_id", "permission_key", "is_enabled")
      VALUES
        ('${crypto.randomUUID()}', '${dbAdminPermSetId}', 'viewAllData', true),
        ('${crypto.randomUUID()}', '${dbAdminPermSetId}', 'modifyAllData', true)
      ON CONFLICT ("permission_set_id", "permission_key") DO UPDATE SET
        "is_enabled" = EXCLUDED."is_enabled";
    `);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
}

main();
