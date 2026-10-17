import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { GroupUserMember } from './group-user-member.entity';
import { GroupRoleMember } from './group-role-member.entity';

@Entity({ name: 'public_groups' })
export class PublicGroup extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ name: 'developer_name', unique: true, length: 100 })
  developerName: string;

  @OneToMany(() => GroupUserMember, (member) => member.group)
  userMembers: GroupUserMember[];

  @OneToMany(() => GroupRoleMember, (member) => member.group)
  roleMembers: GroupRoleMember[];
}
