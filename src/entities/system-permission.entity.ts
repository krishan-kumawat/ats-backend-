import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { PermissionSet } from './permission-set.entity';

@Entity({ name: 'system_permissions' })
@Unique(['permissionSetId', 'permissionKey'])
export class SystemPermission extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'permission_set_id', type: 'uuid' })
  permissionSetId: string;

  @Index()
  @Column({ name: 'permission_key', length: 100 })
  permissionKey: string;

  @Column({ name: 'is_enabled', default: false })
  isEnabled: boolean;

  @ManyToOne(() => PermissionSet, (ps) => ps.systemPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_set_id' })
  permissionSet: PermissionSet;
}
