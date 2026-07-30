import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { SchemaField } from './schema-field.entity';
import { ObjectPermission } from './object-permission.entity';
import { TabSetting } from './tab-setting.entity';

@Entity({ name: 'schema_objects' })
export class SchemaObject extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_name', unique: true, length: 100 })
  apiName: string;

  @Column({ length: 100 })
  label: string;

  @Column({ name: 'icon_name', length: 100, nullable: true })
  iconName: string | null;

  @Column({
    name: 'tab_type',
    type: 'varchar',
    length: 50,
    default: 'OBJECT',
  })
  tabType: 'OBJECT' | 'DASHBOARD' | 'WEB_TAB';

  @Column({ name: 'default_sort_order', type: 'integer', default: 100 })
  defaultSortOrder: number;

  @OneToMany(() => SchemaField, (field) => field.schemaObject)
  fields: SchemaField[];

  @OneToMany(() => ObjectPermission, (op) => op.schemaObject)
  objectPermissions: ObjectPermission[];

  @OneToMany(() => TabSetting, (ts) => ts.schemaObject)
  tabSettings: TabSetting[];
}
