import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { PermissionSet } from './permission-set.entity';
import { SchemaField } from './schema-field.entity';

@Entity({ name: 'field_permissions' })
@Unique(['permissionSetId', 'schemaFieldId'])
export class FieldPermission extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'permission_set_id', type: 'uuid' })
  permissionSetId: string;

  @Index()
  @Column({ name: 'schema_field_id', type: 'uuid' })
  schemaFieldId: string;

  @Column({ name: 'allow_read', default: false })
  allowRead: boolean;

  @Column({ name: 'allow_edit', default: false })
  allowEdit: boolean;

  @ManyToOne(() => PermissionSet, (ps) => ps.fieldPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_set_id' })
  permissionSet: PermissionSet;

  @ManyToOne(() => SchemaField, (field) => field.fieldPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_field_id' })
  schemaField: SchemaField;
}
