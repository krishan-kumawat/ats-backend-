import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { SchemaField } from './schema-field.entity';
import { ObjectPermission } from './object-permission.entity';

@Entity({ name: 'schema_objects' })
export class SchemaObject extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_name', unique: true, length: 100 })
  apiName: string;

  @Column({ length: 100 })
  label: string;

  @OneToMany(() => SchemaField, (field) => field.schemaObject)
  fields: SchemaField[];

  @OneToMany(() => ObjectPermission, (op) => op.schemaObject)
  objectPermissions: ObjectPermission[];
}
