# Project behavioral rules and customization rules

## Database ORM usage guidelines
1. Keep both TypeORM and Prisma in the project to maintain backwards compatibility with existing modules.
2. For all new database tables, columns, features, repositories, and services, **only use TypeORM**. Do not introduce new Prisma schemas or writes.
3. **No assumed relationships**: Do not assume any relationships (lookup, master-detail, or foreign key cascades) between objects when implementing new endpoints/entities without discussing it with the user first.
