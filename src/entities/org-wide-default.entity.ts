import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { SchemaObject } from './schema-object.entity';

export type DefaultAccessLevel = 'PRIVATE' | 'READ_ONLY' | 'READ_WRITE';

@Entity({ name: 'org_wide_defaults' })
export class OrgWideDefault extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'schema_object_id', type: 'uuid' })
  schemaObjectId: string;

  @Column({
    name: 'default_access_level',
    type: 'varchar',
    length: 20,
    default: 'PRIVATE',
  })
  defaultAccessLevel: DefaultAccessLevel;

  @Column({ name: 'grant_access_using_hierarchies', default: true })
  grantAccessUsingHierarchies: boolean;

  @ManyToOne(() => SchemaObject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_object_id' })
  schemaObject: SchemaObject;
}
