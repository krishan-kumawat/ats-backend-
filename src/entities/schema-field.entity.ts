import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Unique, Index } from 'typeorm';
import { SalesforceAuditEntity } from './salesforce-audit.entity';
import { SchemaObject } from './schema-object.entity';
import { FieldPermission } from './field-permission.entity';

@Entity({ name: 'schema_fields' })
@Unique(['schemaObjectId', 'apiName'])
export class SchemaField extends SalesforceAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'schema_object_id', type: 'uuid' })
  schemaObjectId: string;

  @Column({ name: 'api_name', length: 100 })
  apiName: string;

  @Column({ length: 100 })
  label: string;

  @ManyToOne(() => SchemaObject, (obj) => obj.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_object_id' })
  schemaObject: SchemaObject;

  @OneToMany(() => FieldPermission, (fp) => fp.schemaField)
  fieldPermissions: FieldPermission[];
}
