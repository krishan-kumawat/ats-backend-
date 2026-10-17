import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { PublicGroup } from './public-group.entity';
import { Role } from './role.entity';

@Entity({ name: 'group_role_members' })
@Unique(['groupId', 'roleId', 'includeSubordinates'])
export class GroupRoleMember extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Index()
  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ name: 'include_subordinates', default: false })
  includeSubordinates: boolean;

  @ManyToOne(() => PublicGroup, (group) => group.roleMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: PublicGroup;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
