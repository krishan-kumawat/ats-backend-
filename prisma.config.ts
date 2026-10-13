import path from 'node:path';
import 'dotenv/config';
import { defineConfig } from 'prisma/config';


export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USERNAME || process.env.DB_USER || 'postgres'}:${encodeURIComponent(process.env.DB_PASSWORD || 'root')}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${encodeURIComponent(process.env.DB_NAME || 'TV ATS')}`,
  },
});