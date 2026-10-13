import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { User } from './user.entity';
import { PermissionSet } from './permission-set.entity';


@Entity({ name: 'profiles' })
export class Profile extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ unique: true, length: 100 })
  name: string;


  @Column({ type: 'text', nullable: true })
  description: string | null;


  @Column({ name: 'is_custom', default: true })
  isCustom: boolean;


  @OneToMany(() => User, (user) => user.profile)
  users: User[];


  @OneToOne(() => PermissionSet, (permissionSet) => permissionSet.profile)
  permissionSet: PermissionSet;
}



