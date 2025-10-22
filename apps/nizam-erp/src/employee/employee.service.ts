import { Injectable, Scope, Inject, OnModuleDestroy, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from '../tenant/entities/tenant.entity';
import { Employee } from './entities/employee.entity';
import { JwtPayload } from '../auth/jwt.strategy'; // Import our payload type
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

// 1. Make the service request-scoped
@Injectable({ scope: Scope.REQUEST })
export class EmployeeService implements OnModuleDestroy {

  private tenantDataSource: DataSource;
  private employeeRepository: Repository<Employee>;

  constructor(
    // 2. Inject the main "lobby" data source (from app.module)
    private readonly mainDataSource: DataSource,
    // 3. Inject the original request object
    @Inject(REQUEST) private readonly request: Request,
    // 4. Inject ConfigService to get DB credentials
    private readonly configService: ConfigService,
  ) {}

  /**
   * This is the core logic. It dynamically creates a connection
   * to the tenant's private database.
   */
  private async initializeTenantConnection(): Promise<void> {
    const user = this.request.user as JwtPayload; // Get user from our AuthGuard
    const tenantId = user.tenantId;

    // 1. Find the tenant's DB info from the main DB
    const tenant = await this.mainDataSource
      .getRepository(Tenant)
      .findOneBy({ id: tenantId });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // 2. Create a new DataSource for the tenant's private DB
    this.tenantDataSource = new DataSource({
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      username: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: tenant.db_name, // <-- The magic! the main point!!!
      entities: [Employee],
      synchronize: true,
    });

    // 3. Initialize the connection and set up the repository
    await this.tenantDataSource.initialize();
    this.employeeRepository = this.tenantDataSource.getRepository(Employee);
  }

  /**
   * A helper to ensure the connection is ready before use.
   */
  private async getRepo(): Promise<Repository<Employee>> {
    if (!this.employeeRepository) {
      await this.initializeTenantConnection();
    }
    return this.employeeRepository;
  }

  // 4. Implement OnModuleDestroy to clean up the connection
  async onModuleDestroy() {
    if (this.tenantDataSource?.isInitialized) {
      await this.tenantDataSource.destroy();
    }
  }

  // --- Our CRUD Operations for Business Logic Method ---

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const repo = await this.getRepo();
    const newEmployee = repo.create(createEmployeeDto);
    return repo.save(newEmployee);
  }

  async findAll(): Promise<Employee[]> {
    const repo = await this.getRepo();
    return repo.find();
  }

  async findOne(id: string): Promise<Employee> {
    const repo = await this.getRepo();
    const employee = await repo.findOneBy({ id });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const repo = await this.getRepo();
    // 'preload' finds the employee and merges the DTO,
    // which is safer than a raw update.
    const employee = await repo.preload({
      id: id,
      ...updateEmployeeDto,
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return repo.save(employee);
  }

  async remove(id: string): Promise<{ message: string }> {
    const repo = await this.getRepo();
    const result = await repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return { message: `Employee with ID "${id}" successfully deleted` };
  }
}

