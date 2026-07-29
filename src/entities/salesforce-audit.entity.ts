import { CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

export abstract class SalesforceAuditEntity {
  @CreateDateColumn({ name: 'created_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string;

  @UpdateDateColumn({ name: 'last_modified_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  lastModifiedDate: Date;

  @Column({ name: 'last_modified_by_id', type: 'uuid', nullable: true })
  lastModifiedById: string;
}
