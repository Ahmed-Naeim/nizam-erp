import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../auth/entities/user.entity';
import { InitialMainSchema1761993144402 } from '../migrations/main/1761993144402-InitialMainSchema';
import { EmployeeModule } from '../employee/employee.module';
import { InventoryModule } from '../inventory/inventory.module';
@Module({
  imports: [
    // 2. Load the .env file. Make it global so other modules can see it.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Tell it where to find the file
    }),

    // 3. Use the 'forRootAsync' version of TypeOrmModule
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],    // Import ConfigModule here so we can use it
      inject: [ConfigService],    // Inject the ConfigService
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT') || 5432),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [Tenant, User],
        synchronize: false, // Use migrations instead of auto-sync
  migrations: [InitialMainSchema1761993144402],
        // Only auto-run migrations in non-production environments.
        // In production, run migrations ahead-of-time via the CLI (CI/CD).
        migrationsRun: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    TenantModule,
    AuthModule,
    EmployeeModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
