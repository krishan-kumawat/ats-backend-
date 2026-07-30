import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity.js';
import { PermissionSet } from './permission-set.entity.js';
import { SchemaObject } from './schema-object.entity.js';

@Entity({ name: 'tab_settings' })
@Unique(['permissionSetId', 'schemaObjectId'])
export class TabSetting extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'permission_set_id', type: 'uuid' })
  permissionSetId: string;

  @Column({ name: 'schema_object_id', type: 'uuid' })
  schemaObjectId: string;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @Column({ name: 'precedence_order', type: 'integer', nullable: true })
  precedenceOrder: number | null;

  @ManyToOne(() => PermissionSet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_set_id' })
  permissionSet: PermissionSet;

  @ManyToOne(() => SchemaObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_object_id' })
  schemaObject: SchemaObject;
}
