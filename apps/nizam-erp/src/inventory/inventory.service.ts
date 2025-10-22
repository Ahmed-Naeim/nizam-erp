import { Inject, Injectable, OnModuleDestroy, Scope } from "@nestjs/common";
import { DataSource, Like, Repository } from "typeorm";
import { Item } from "./entities/item.entity";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { Tenant } from "../tenant/entities/tenant.entity";
import { JwtPayload } from "../auth/jwt.strategy";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";

// 1. Make the service request-scoped
@Injectable({scope: Scope.REQUEST})
export class InventoryService implements  OnModuleDestroy {

  private tenantDataSource : DataSource;
  private itemRepository: Repository<Item>;

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
      entities: [Item],
      synchronize: true,
    });

    // 3. Initialize the connection and set up the repository
    await this.tenantDataSource.initialize();
    this.itemRepository = this.tenantDataSource.getRepository(Item);
  }

  /**
   * A helper to ensure the connection is ready before use.
   */
  private async getRepo(): Promise<Repository<Item>> {
    if (!this.itemRepository) {
      await this.initializeTenantConnection();
    }
    return this.itemRepository;
  }

  // 4. Implement OnModuleDestroy to clean up the connection
  async onModuleDestroy() {
    if (this.tenantDataSource?.isInitialized) {
      await this.tenantDataSource.destroy();
    }
  }


  //SKU Generator Method
  /**
   * Generates a unique, human-readable SKU.
   * Example: TOL-MAK-PCS-1001
   */
  private async generateUniqueSku(dto: CreateItemDto): Promise<string> {

    // 1. Build the base SKU from DTO properties
    const category = dto.category; // e.g., 'TOL'
    const brand = dto.brandCode.toUpperCase().substring(0, 3); // e.g., 'MAK'

    const baseSku = `${category}-${brand}`; // e.g., "TOL-MAK"

    // 2. Find the last item with this base SKU to get the next number
    const lastItem = await this.itemRepository.findOne({
      where: { sku: Like(`${baseSku}-%`) },
      order: { sku: 'DESC' }, // Get the one with the highest number
    });

    let sequentialNumber = 1001; // Start from 1001

    if (lastItem) {
      const lastSku = lastItem.sku;
      const lastNumberStr = lastSku.split('-').pop(); // Get '1001' from 'TOL-MAK-1001'
      const lastNumber = parseInt(lastNumberStr, 10);

      if (!isNaN(lastNumber)) {
        sequentialNumber = lastNumber + 1;
      }
    }

    // 3. Return the new, complete SKU
    return `${baseSku}-${sequentialNumber}`; // "TOL-MAK-1002"
  }


    // Implementing CRUD Operations

  async create(createItemDto: CreateItemDto): Promise<Item> {

    // Ensure repository is ready
    const repo = await this.getRepo();

    // Generate a unique SKU
    const sku = await this.generateUniqueSku(createItemDto);

    // Create and save the new item
    const newItem = repo.create({ ...createItemDto, sku });

    // Return the created item
    return await repo.save(newItem);

  }

  async findAll(): Promise<Item[]> {

    // Ensure repository is ready
    const repo = await this.getRepo();

    // Return all items
    return await repo.find();
  }

  async findOne(id: string): Promise<Item> {

    // Ensure repository is ready and get it
    const repo = await this.getRepo();

    // Find the item by ID
    const item = await repo.findOneBy({ id });

    // Return the found item
    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    // Ensure repository is ready and get it
    const repo = await this.getRepo();

    // 'preload' finds the item and merges the DTO,
    // which is safer than a raw update.
    const item = await repo.preload({
      id: id,
      ...updateItemDto,
    });

    // If item not found, throw an error
    if (!item) {
      throw new Error(`Item with ID "${id}" not found`);
    }

    // Save and return the updated item
    return repo.save(item);
  }

  async remove(id: string): Promise<{ message: string }> {

    // Ensure repository is ready and get it
    const repo = await this.getRepo();

    // Find the item to delete
    const item = await repo.findOneBy({ id });

    // If item not found, throw an error
    if (!item) {
      throw new Error(`Item with ID "${id}" not found`);
    }

    // Remove the item
    await repo.remove(item);

    // Return a success message
    return { message: `Item with ID "${id}" successfully deleted` };

  }
}
