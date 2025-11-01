import { DataSource } from 'typeorm';
import { Employee } from './employee/entities/employee.entity';
import { Item } from './inventory/entities/item.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../..', '.env') });

export const TenantDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, 
  entities: [
    Employee,
    Item,
  ],
  migrations: [
    'apps/nizam-erp/src/migrations/tenant/*.ts',
  ],
});
