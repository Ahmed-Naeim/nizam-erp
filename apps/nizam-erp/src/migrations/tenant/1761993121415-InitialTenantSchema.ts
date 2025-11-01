import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTenantSchema1761993121415 implements MigrationInterface {
    name = 'InitialTenantSchema1761993121415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "position" character varying(255), "salary" numeric(10,2), "start_date" date, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "sku" character varying(500) NOT NULL, "description" text, "unitOfMeasure" character varying(50) NOT NULL, "quantityOnHand" numeric NOT NULL DEFAULT '0', "lowStockThreshold" numeric NOT NULL DEFAULT '0', CONSTRAINT "UQ_ed4485e4da7cc242cf46db2e3a9" UNIQUE ("sku"), CONSTRAINT "UQ_ed4485e4da7cc242cf46db2e3a9" UNIQUE ("sku"), CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "items"`);
        await queryRunner.query(`DROP TABLE "employees"`);
    }

}
