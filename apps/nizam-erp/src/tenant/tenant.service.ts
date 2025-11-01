import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { ConfigService } from '@nestjs/config';
import { Employee } from '../employee/entities/employee.entity';
import { Item } from '../inventory/entities/item.entity';

// IMPORTANT: Replace the placeholder below with the actual migration class
// name and file you generate in Step 6. This placeholder uses a valid
// identifier so TypeScript remains happy until you replace it.
import { InitialTenantSchema1761993121415 } from '../migrations/tenant/1761993121415-InitialTenantSchema';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly mainDataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  getData() {
    return { message: 'Tenant Service Data' };
  }

  async createTenant(companyName: string): Promise<Tenant> {

    // 1- Generate the subdomain and db name based on company name
    const subdomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const db_name = `tenant_${subdomain.replace(/-/g, '_')}`;

    // 2- create the Tenant entity
    const newTenant = this.tenantRepository.create({
      name: companyName,
      subdomain: subdomain,
      db_name: db_name,
    });

    // 3- Save the tenant to the nizam_main database
    let savedTenant: Tenant;
    try {
      savedTenant = await this.tenantRepository.save(newTenant);
    } catch (error) {
      // Handle potential duplicate subdomain errors, etc.
      throw new InternalServerErrorException('Error creating tenant');
    }

    // 4- CRITICAL STEP: Create the new private database and run migrations
    let tenantDataSource: DataSource | null = null;
    try {
      await this.mainDataSource.query(`CREATE DATABASE "${db_name}"`);

      tenantDataSource = new DataSource({
        type: 'postgres',
        host: this.configService.get<string>('DB_HOST'),
        port: Number(this.configService.get<string>('DB_PORT') || 5432),
        username: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: db_name,
        entities: [Employee, Item],
  migrations: [InitialTenantSchema1761993121415],
        // Don't auto-run tenant migrations in production; CI/ops should run them
        // before starting the app. For dev/test we keep migrationsRun enabled.
        migrationsRun: this.configService.get<string>('NODE_ENV') !== 'production',
      });

      await tenantDataSource.initialize();
      await tenantDataSource.destroy();

    } catch (error) {
      if (tenantDataSource?.isInitialized) {
        await tenantDataSource.destroy();
      }
      await this.mainDataSource.query(`DROP DATABASE IF EXISTS "${db_name}"`);
      await this.tenantRepository.delete(savedTenant.id);
      throw new InternalServerErrorException(
        `Could not provision database for tenant: ${error.message}`,
      );
    }

    return savedTenant;

  }
}
