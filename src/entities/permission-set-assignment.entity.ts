import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { User } from './user.entity';
import { PermissionSet } from './permission-set.entity';

@Entity({ name: 'permission_set_assignments' })
@Unique(['userId', 'permissionSetId'])
export class PermissionSetAssignment extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index()
  @Column({ name: 'permission_set_id', type: 'uuid' })
  permissionSetId: string;

  @ManyToOne(() => User, (user) => user.permissionSetAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PermissionSet, (ps) => ps.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_set_id' })
  permissionSet: PermissionSet;
}
