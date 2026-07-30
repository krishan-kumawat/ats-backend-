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
    console.log('Creating Super Administrator...');

    // 1. Ensure System Administrator Profile exists
    const profileName = 'System Administrator';
    let profileRes = await client.query('SELECT id FROM profiles WHERE name = $1', [profileName]);
    let profileId;
    if (profileRes.rows.length === 0) {
      profileId = crypto.randomUUID();
      await client.query('INSERT INTO profiles (id, name, description, is_custom) VALUES ($1, $2, $3, false)', [profileId, profileName, 'Full access to all settings and records.']);
    } else {
      profileId = profileRes.rows[0].id;
    }

    // 2. Ensure CEO Role exists
    const roleName = 'CEO';
    let roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    let roleId;
    if (roleRes.rows.length === 0) {
      roleId = crypto.randomUUID();
      await client.query('INSERT INTO roles (id, name, developer_name) VALUES ($1, $2, $3)', [roleId, roleName, 'CEO']);
    } else {
      roleId = roleRes.rows[0].id;
    }

    // 3. Ensure a Base Permission Set exists for this profile
    const permSetName = 'SuperAdmin_Base';
    let psetRes = await client.query('SELECT id FROM permission_sets WHERE name = $1', [permSetName]);
    let psetId;
    if (psetRes.rows.length === 0) {
      psetId = crypto.randomUUID();
      await client.query('INSERT INTO permission_sets (id, name, description, is_custom, profile_id) VALUES ($1, $2, $3, false, $4)', [psetId, permSetName, 'Super Admin Base permission set', profileId]);
    } else {
      psetId = psetRes.rows[0].id;
    }

    // 4. Assign ALL system permissions
    const systemPerms = ['viewAllData', 'modifyAllData', 'manageUsers', 'manageProfiles', 'manageRoles'];
    for (const key of systemPerms) {
      await client.query(`
        INSERT INTO system_permissions (id, permission_set_id, permission_key, is_enabled)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (permission_set_id, permission_key) DO UPDATE SET is_enabled = true
      `, [crypto.randomUUID(), psetId, key]);
    }

    // 5. Grant full OLS and Tab visibility for all Schema Objects
    const objectsRes = await client.query('SELECT id, api_name FROM schema_objects');
    for (const obj of objectsRes.rows) {
      // Object permissions
      await client.query(`
        INSERT INTO object_permissions 
          (id, permission_set_id, schema_object_id, allow_create, allow_read, allow_edit, allow_delete, view_all_data, modify_all_data)
        VALUES ($1, $2, $3, true, true, true, true, true, true)
        ON CONFLICT (permission_set_id, schema_object_id) DO UPDATE SET
          allow_create = true,
          allow_read = true,
          allow_edit = true,
          allow_delete = true,
          view_all_data = true,
          modify_all_data = true
      `, [crypto.randomUUID(), psetId, obj.id]);

      // Tab settings
      await client.query(`
        INSERT INTO tab_settings (id, permission_set_id, schema_object_id, is_visible)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (permission_set_id, schema_object_id) DO UPDATE SET is_visible = true
      `, [crypto.randomUUID(), psetId, obj.id]);
    }

    // 6. Grant full FLS for all Schema Fields
    const fieldsRes = await client.query('SELECT id FROM schema_fields');
    for (const field of fieldsRes.rows) {
      await client.query(`
        INSERT INTO field_permissions (id, permission_set_id, schema_field_id, allow_read, allow_edit)
        VALUES ($1, $2, $3, true, true)
        ON CONFLICT (permission_set_id, schema_field_id) DO UPDATE SET allow_read = true, allow_edit = true
      `, [crypto.randomUUID(), psetId, field.id]);
    }

    // 7. Create/Upsert the user: superadmin@sf.com
    const email = 'superadmin@sf.com';
    const passwordHash = bcrypt.hashSync('Password123!', 10);
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (userRes.rows.length === 0) {
      const newUserId = crypto.randomUUID();
      await client.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, profile_id, role_id)
        VALUES ($1, $2, $3, $4, $5, true, $6, $7)
      `, [newUserId, email, passwordHash, 'Super', 'Admin', profileId, roleId]);
      console.log('Created new Super Admin user successfully!');
    } else {
      await client.query(`
        UPDATE users 
        SET password_hash = $1, profile_id = $2, role_id = $3, is_active = true
        WHERE email = $4
      `, [passwordHash, profileId, roleId, email]);
      console.log('Updated existing Super Admin user successfully!');
    }

    console.log('Superadmin credentials:');
    console.log('Username/Email: superadmin@sf.com');
    console.log('Password: Password123!');

  } catch (err) {
    console.error('Error seeding superadmin:', err);
  } finally {
    await client.end();
  }
}

main();
