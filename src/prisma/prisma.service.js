import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.LOCAL_DATABASE_URL ||
      `postgresql://${process.env.DB_USERNAME || process.env.DB_USER || 'postgres'}:${encodeURIComponent(process.env.DB_PASSWORD || 'root')}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${encodeURIComponent(process.env.DB_NAME || 'TV ATS')}`;
    const isSsl = connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production';
    const pool = new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.$pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.$pool.end();
  }
}
