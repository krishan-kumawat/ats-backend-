import pg from 'pg';
import crypto from 'crypto';
import 'dotenv/config';


const { Client } = pg;


const dbUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || "postgresql://postgres:root@localhost:5432/ATS%20TV?schema=public";


const uuid = () => crypto.randomUUID();


const SCHEMA = [
  {
    apiName: 'Job', label: 'Jobs', iconName: 'briefcase', tabType: 'OBJECT', sortOrder: 10,
    fields: [
      { apiName: 'title',        label: 'Title' },
      { apiName: 'description',  label: 'Description' },
      { apiName: 'status',       label: 'Status' },
      { apiName: 'budget',       label: 'Budget' },
      { apiName: 'departmentId', label: 'Department' },
      { apiName: 'ownerId',      label: 'Owner' },
    ],
  },
  {
    apiName: 'Candidate', label: 'Candidates', iconName: 'users', tabType: 'OBJECT', sortOrder: 20,
    fields: [
      { apiName: 'firstName', label: 'First Name' },
      { apiName: 'lastName',  label: 'Last Name' },
      { apiName: 'email',     label: 'Email' },
      { apiName: 'phone',     label: 'Phone' },
      { apiName: 'skills',    label: 'Skills' },
      { apiName: 'ownerId',   label: 'Owner' },
    ],
  },
  {
    apiName: 'Department', label: 'Departments', iconName: 'layers', tabType: 'OBJECT', sortOrder: 30,
    fields: [
      { apiName: 'name',     label: 'Name' },
      { apiName: 'parentId', label: 'Parent Department' },
    ],
  },
  {
    apiName: 'User', label: 'Users', iconName: 'settings', tabType: 'OBJECT', sortOrder: 40,
    fields: [
      { apiName: 'email',        label: 'Email' },
      { apiName: 'firstName',    label: 'First Name' },
      { apiName: 'lastName',     label: 'Last Name' },
      { apiName: 'isActive',     label: 'Is Active' },
      { apiName: 'roleId',       label: 'Role' },
      { apiName: 'profileId',    label: 'Profile' },
      { apiName: 'departmentId', label: 'Department' },
    ],
  },
  {
    apiName: 'Profile', label: 'Profiles', iconName: 'shield', tabType: 'OBJECT', sortOrder: 50,
    fields: [
      { apiName: 'name',        label: 'Name' },
      { apiName: 'description', label: 'Description' },
      { apiName: 'isCustom',    label: 'Is Custom' },
    ],
  },
  {
    apiName: 'Role', label: 'Roles', iconName: 'git-merge', tabType: 'OBJECT', sortOrder: 60,
    fields: [
      { apiName: 'name',          label: 'Name' },
      { apiName: 'developerName', label: 'Developer Name' },
      { apiName: 'parentId',      label: 'Parent Role' },
    ],
  },
  {
    apiName: 'PermissionSet', label: 'Permission Sets', iconName: 'key', tabType: 'OBJECT', sortOrder: 65,
    fields: [
      { apiName: 'name',               label: 'Name' },
      { apiName: 'description',        label: 'Description' },
      { apiName: 'isCustom',           label: 'Is Custom' },
      { apiName: 'isManagedByProfile', label: 'Is Managed By Profile' },
      { apiName: 'profileId',          label: 'Profile' },
    ],
  },
  {
    apiName: 'Analytics', label: 'Analytics', iconName: 'bar-chart-2', tabType: 'DASHBOARD', sortOrder: 70,
    fields: [],
  },
  {
    apiName: 'Account', label: 'Accounts', iconName: 'building', tabType: 'OBJECT', sortOrder: 75,
    fields: [
      { apiName: 'name',          label: 'Name' },
      { apiName: 'ownerId',       label: 'Owner' },
      { apiName: 'annualRevenue', label: 'Annual Revenue' },
    ],
  },
  {
    apiName: 'AuditLog', label: 'Audit Logs', iconName: 'file-text', tabType: 'OBJECT', sortOrder: 80,
    fields: [
      { apiName: 'userId',       label: 'User' },
      { apiName: 'action',       label: 'Action' },
      { apiName: 'resourceType', label: 'Resource Type' },
      { apiName: 'resourceId',   label: 'Resource ID' },
      { apiName: 'payload',      label: 'Payload' },
      { apiName: 'ipAddress',    label: 'IP Address' },
      { apiName: 'userAgent',    label: 'User Agent' },
    ],
  },
];


async function main() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString: dbUrl });
  await client.connect();


  try {
    let totalObjects = 0;
    let totalFields = 0;


    for (const obj of SCHEMA) {
      const objId = uuid();
      const res = await client.query(`
        INSERT INTO "schema_objects" ("id", "api_name", "label", "icon_name", "tab_type", "default_sort_order", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT ("api_name") DO UPDATE SET
          "label" = EXCLUDED."label",
          "icon_name" = EXCLUDED."icon_name",
          "tab_type" = EXCLUDED."tab_type",
          "default_sort_order" = EXCLUDED."default_sort_order"
        RETURNING "id";
      `, [objId, obj.apiName, obj.label, obj.iconName, obj.tabType, obj.sortOrder]);


      const schemaObjectId = res.rows[0].id;
      totalObjects++;


      for (const field of obj.fields) {
        await client.query(`
          INSERT INTO "schema_fields" ("id", "schema_object_id", "api_name", "label", "created_at", "updated_at")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT ("schema_object_id", "api_name") DO UPDATE SET
            "label" = EXCLUDED."label";
        `, [uuid(), schemaObjectId, field.apiName, field.label]);
        totalFields++;
      }


      const fieldCount = obj.fields.length;
      console.log(`  ✔ ${obj.apiName} (${obj.label}) — ${fieldCount} field${fieldCount !== 1 ? 's' : ''}`);
    }


    console.log(`\n✅ Schema seed complete: ${totalObjects} objects, ${totalFields} fields`);


  } catch (err) {
    console.error('❌ Schema seed error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}


main();



