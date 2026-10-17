import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { PublicGroup } from './public-group.entity';
import { User } from './user.entity';

@Entity({ name: 'group_user_members' })
@Unique(['groupId', 'userId'])
export class GroupUserMember extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => PublicGroup, (group) => group.userMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: PublicGroup;

  @ManyToOne(() => User, (user) => user.groupUserMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
