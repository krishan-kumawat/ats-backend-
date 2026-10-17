import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { Role } from './role.entity';
import { Profile } from './profile.entity';
import { PermissionSetAssignment } from './permission-set-assignment.entity';
import { GroupUserMember } from './group-user-member.entity';

@Entity({ name: 'users' })
export class User extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string | null;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @ManyToOne(() => Profile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @OneToMany(() => PermissionSetAssignment, (assignment) => assignment.user)
  permissionSetAssignments: PermissionSetAssignment[];

  @OneToMany(() => GroupUserMember, (member) => member.user)
  groupUserMemberships: GroupUserMember[];
}
