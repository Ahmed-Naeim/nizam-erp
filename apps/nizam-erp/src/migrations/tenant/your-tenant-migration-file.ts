import { MigrationInterface, QueryRunner } from 'typeorm';

// Placeholder migration used to keep the project compiling until you generate
// the real tenant migration via the TypeORM CLI. Replace this file with the
// generated migration file (or update the import in TenantService) after
// running the migration generation step.
export class YourTenantMigration implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // no-op placeholder
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no-op placeholder
  }
}
