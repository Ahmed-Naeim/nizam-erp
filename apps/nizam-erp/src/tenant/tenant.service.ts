import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class TenantService {
  constructor(@InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>, private readonly dataSource: DataSource) {}

  getData() {
    return { message: 'Tenant Service Data' };
  }

  async createTenant(companyName: string) : Promise<Tenant> {

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

    // 4- CRITICAL STEP: Create the new private database
    try {
      await this.dataSource.query(`CREATE DATABASE "${db_name}"`);
      // We will run migrations on this new DB later
    } catch (error) {
      // If DB creation fails, we must roll back by deleting the tenant
      await this.tenantRepository.delete(savedTenant.id);
      throw new InternalServerErrorException(
        `Could not create database for tenant: ${error.message}`,
      );
    }

    return savedTenant;

  }
}
