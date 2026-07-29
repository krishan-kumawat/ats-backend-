import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { User } from './user.entity';
import { AccountShare } from './account-share.entity';

@Entity({ name: 'accounts' })
export class Account extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'annual_revenue', type: 'decimal', precision: 18, scale: 2, default: 0 })
  annualRevenue: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' }) // owner relationship
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => AccountShare, (share) => share.account)
  shares: AccountShare[];
}
