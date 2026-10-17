import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check, Index, Unique } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { Account } from './account.entity';
import { User } from './user.entity';
import { Role } from './role.entity';
import { PublicGroup } from './public-group.entity';

export type RowCause = 'OWNER' | 'ROLE_HIERARCHY' | 'SHARING_RULE' | 'IMPLICIT_PARENT' | 'MANUAL';

@Entity({ name: 'account_shares' })
@Check(
  `("user_id" IS NOT NULL AND "role_id" IS NULL AND "group_id" IS NULL) OR ` +
  `("user_id" IS NULL AND "role_id" IS NOT NULL AND "group_id" IS NULL) OR ` +
  `("user_id" IS NULL AND "role_id" IS NULL AND "group_id" IS NOT NULL)`
)
@Unique(['accountId', 'userId', 'roleId', 'groupId', 'rowCause'])
export class AccountShare extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string | null;

  @Index()
  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId: string | null;

  @Column({
    name: 'access_level',
    type: 'varchar',
    length: 10,
    default: 'READ',
  })
  accessLevel: 'READ' | 'EDIT';

  @Column({
    name: 'row_cause',
    type: 'varchar',
    length: 20,
    default: 'MANUAL',
  })
  rowCause: RowCause;

  @ManyToOne(() => Account, (acc) => acc.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @ManyToOne(() => PublicGroup, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: PublicGroup | null;
}
