import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../auth/entities/user.entity';
import { EmployeeModule } from '../employee/employee.module';
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
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [Tenant, User],
        synchronize: true, // Keep this for dev
      }),
    }),

    TenantModule,
    AuthModule,
    EmployeeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
