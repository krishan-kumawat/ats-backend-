import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { User } from './user.entity';

@Entity({ name: 'roles' })
export class Role extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ name: 'developer_name', type: 'varchar', unique: true, length: 100, nullable: true })
  developerName: string | null;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Role, (role) => role.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: Role | null;

  @OneToMany(() => Role, (role) => role.parent)
  children: Role[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
