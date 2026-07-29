import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { SchemaObject } from './schema-object.entity';
import { User } from './user.entity';
import { Role } from './role.entity';
import { PublicGroup } from './public-group.entity';

export type ShareAccessLevel = 'READ' | 'EDIT';

@Entity({ name: 'sharing_rules' })
@Check(
  `("target_user_id" IS NOT NULL AND "target_role_id" IS NULL AND "target_group_id" IS NULL) OR ` +
  `("target_user_id" IS NULL AND "target_role_id" IS NOT NULL AND "target_group_id" IS NULL) OR ` +
  `("target_user_id" IS NULL AND "target_role_id" IS NULL AND "target_group_id" IS NOT NULL)`
)
export class SharingRule extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'schema_object_id', type: 'uuid' })
  schemaObjectId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'developer_name', unique: true, length: 100 })
  developerName: string;

  @Column({ name: 'criteria_json', type: 'jsonb', nullable: true })
  criteriaJson: any | null;

  @Index()
  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string | null;

  @Index()
  @Column({ name: 'target_role_id', type: 'uuid', nullable: true })
  targetRoleId: string | null;

  @Index()
  @Column({ name: 'target_group_id', type: 'uuid', nullable: true })
  targetGroupId: string | null;

  @Column({
    name: 'access_level',
    type: 'varchar',
    length: 10,
    default: 'READ',
  })
  accessLevel: ShareAccessLevel;

  @ManyToOne(() => SchemaObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_object_id' })
  schemaObject: SchemaObject;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_role_id' })
  targetRole: Role | null;

  @ManyToOne(() => PublicGroup, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_group_id' })
  targetGroup: PublicGroup | null;
}
