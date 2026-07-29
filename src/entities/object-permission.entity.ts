import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { PermissionSet } from './permission-set.entity';
import { SchemaObject } from './schema-object.entity';

@Entity({ name: 'object_permissions' })
@Unique(['permissionSetId', 'schemaObjectId'])
export class ObjectPermission extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'permission_set_id', type: 'uuid' })
  permissionSetId: string;

  @Index()
  @Column({ name: 'schema_object_id', type: 'uuid' })
  schemaObjectId: string;

  @Column({ name: 'allow_create', default: false })
  allowCreate: boolean;

  @Column({ name: 'allow_read', default: false })
  allowRead: boolean;

  @Column({ name: 'allow_edit', default: false })
  allowEdit: boolean;

  @Column({ name: 'allow_delete', default: false })
  allowDelete: boolean;

  @Column({ name: 'view_all_data', default: false })
  viewAllData: boolean;

  @Column({ name: 'modify_all_data', default: false })
  modifyAllData: boolean;

  @ManyToOne(() => PermissionSet, (ps) => ps.objectPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_set_id' })
  permissionSet: PermissionSet;

  @ManyToOne(() => SchemaObject, (obj) => obj.objectPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_object_id' })
  schemaObject: SchemaObject;
}
