import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { MainDataSource } from '../main-data-source';
import { TenantDataSource } from '../tenant-data-source';
import { DataSource } from 'typeorm';

// Load env from project root when running inside container
dotenv.config({ path: join(__dirname, '../../../', '.env') });

async function runMainMigrations() {
  if (!MainDataSource.isInitialized) {
    await MainDataSource.initialize();
  }
  console.log('Running main DB migrations...');
  await MainDataSource.runMigrations();
  console.log('Main migrations applied.');
}

async function runTenantMigrationsAll() {
  if (!MainDataSource.isInitialized) {
    await MainDataSource.initialize();
  }

  const tenants = await MainDataSource.manager.query('SELECT db_name FROM tenant');
  if (!tenants || tenants.length === 0) {
    console.log('No tenants found in main DB; skipping tenant migrations.');
    return;
  }

  for (const t of tenants) {
    const dbName = t.db_name || t.dbname || t.database;
    if (!dbName) continue;
    await runTenantMigrationsFor(dbName);
  }
}

async function runTenantMigrationsFor(dbName: string) {
  console.log(`Running tenant migrations for: ${dbName}`);
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    entities: (TenantDataSource.options.entities as unknown) as any,
    migrations: (TenantDataSource.options.migrations as unknown) as string[],
  });

  try {
    await ds.initialize();
    await ds.runMigrations();
    await ds.destroy();
    console.log(`Tenant migrations applied for: ${dbName}`);
  } catch (err) {
    console.error(`Failed to run migrations for ${dbName}:`, err);
    throw err;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: { tenant?: string; tenantId?: string; mainOnly?: boolean; skipMain?: boolean; dryRun?: boolean } = {};
  for (let i = 0; i < args.length; i++) {
    const raw = args[i];
    const arg = raw.replace(/^--+/, '');
    if (arg.startsWith('tenant=')) {
      out.tenant = arg.split('=')[1];
    } else if (arg === 'tenant') {
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        out.tenant = next;
        i++;
      }
    } else if (arg.startsWith('tenant-id=')) {
      out.tenantId = arg.split('=')[1];
    } else if (arg === 'tenant-id') {
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        out.tenantId = next;
        i++;
      }
    } else if (arg === 'main-only') {
      out.mainOnly = true;
    } else if (arg === 'skip-main') {
      out.skipMain = true;
    } else if (arg === 'dry-run' || arg === 'dry') {
      out.dryRun = true;
    }
  }
  return out;
}

async function main() {
  const opts = parseArgs();
  try {
    if (!opts.skipMain) {
      if (opts.dryRun) {
        if (!MainDataSource.isInitialized) await MainDataSource.initialize();
        console.log('Dry-run: showing main migrations (no changes will be applied)');
        await MainDataSource.showMigrations();
      } else {
        await runMainMigrations();
      }
    }

    if (opts.mainOnly) {
      console.log('Main-only requested; skipping tenant migrations.');
      process.exit(0);
    }

    if (opts.tenantId) {
      if (!MainDataSource.isInitialized) await MainDataSource.initialize();
      const rows = await MainDataSource.manager.query('SELECT db_name FROM tenant WHERE id = $1', [opts.tenantId]);
      if (!rows || rows.length === 0) {
        throw new Error(`Tenant with id ${opts.tenantId} not found`);
      }
      const dbName = rows[0].db_name || rows[0].dbname || rows[0].database;
      if (!dbName) throw new Error(`Tenant ${opts.tenantId} has no db_name`);
      if (opts.dryRun) {
        console.log(`Dry-run: showing migrations for tenant DB ${dbName}`);
        const ds = new DataSource({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT as string, 10) || 5432,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: dbName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entities: (TenantDataSource.options.entities as unknown) as any,
          migrations: (TenantDataSource.options.migrations as unknown) as string[],
        });
        await ds.initialize();
        await ds.showMigrations();
        await ds.destroy();
      } else {
        await runTenantMigrationsFor(dbName);
      }
    } else if (opts.tenant) {
      if (opts.dryRun) {
        console.log(`Dry-run: showing migrations for tenant DB ${opts.tenant}`);
        const ds = new DataSource({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT as string, 10) || 5432,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: opts.tenant,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entities: (TenantDataSource.options.entities as unknown) as any,
          migrations: (TenantDataSource.options.migrations as unknown) as string[],
        });
        await ds.initialize();
        await ds.showMigrations();
        await ds.destroy();
      } else {
        await runTenantMigrationsFor(opts.tenant);
      }
    } else {
      if (opts.dryRun) {
        console.log('Dry-run: showing tenant migrations for all tenants (no changes will be applied)');
        if (!MainDataSource.isInitialized) await MainDataSource.initialize();
        const tenants = await MainDataSource.manager.query('SELECT db_name FROM tenant');
        for (const t of tenants) {
          const dbName = t.db_name || t.dbname || t.database;
          if (!dbName) continue;
          const ds = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT as string, 10) || 5432,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            entities: (TenantDataSource.options.entities as unknown) as any,
            migrations: (TenantDataSource.options.migrations as unknown) as string[],
          });
          await ds.initialize();
          console.log(`--- Tenant: ${dbName} ---`);
          await ds.showMigrations();
          await ds.destroy();
        }
      } else {
        await runTenantMigrationsAll();
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration runner failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
