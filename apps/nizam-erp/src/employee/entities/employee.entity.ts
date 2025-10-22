import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  // Note: We don't need to link this to a User or Tenant
  // because this entire *database* already belongs to a tenant.
}
