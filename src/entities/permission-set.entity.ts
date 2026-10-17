import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { Profile } from './profile.entity';
import { PermissionSetAssignment } from './permission-set-assignment.entity';
import { ObjectPermission } from './object-permission.entity';
import { FieldPermission } from './field-permission.entity';
import { SystemPermission } from './system-permission.entity';


@Entity({ name: 'permission_sets' })
export class PermissionSet extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ unique: true, length: 100 })
  name: string;


  @Column({ type: 'text', nullable: true })
  description: string | null;


  @Column({ name: 'is_custom', default: true })
  isCustom: boolean;


  @Column({ name: 'is_managed_by_profile', default: false })
  isManagedByProfile: boolean;


  @Column({ name: 'profile_id', type: 'uuid', nullable: true, unique: true })
  profileId: string | null;


  @OneToOne(() => Profile, (profile) => profile.permissionSet, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile | null;


  @OneToMany(() => PermissionSetAssignment, (assignment) => assignment.permissionSet)
  assignments: PermissionSetAssignment[];


  @OneToMany(() => ObjectPermission, (op) => op.permissionSet)
  objectPermissions: ObjectPermission[];


  @OneToMany(() => FieldPermission, (fp) => fp.permissionSet)
  fieldPermissions: FieldPermission[];


  @OneToMany(() => SystemPermission, (sp) => sp.permissionSet)
  systemPermissions: SystemPermission[];
}



