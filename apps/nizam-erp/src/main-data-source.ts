import { DataSource } from 'typeorm';
import { User } from './auth/entities/user.entity';
import { Tenant } from './tenant/entities/tenant.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../..', '.env') });

export const MainDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Tenant,
  ],
  migrations: [
    'apps/nizam-erp/src/migrations/main/*.ts',
  ],
});
