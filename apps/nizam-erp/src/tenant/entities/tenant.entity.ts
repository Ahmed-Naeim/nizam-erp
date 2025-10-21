import { User } from '../../auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'tenants' }) // This sets the table name
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  subdomain: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  db_name: string;

  // A Tenant can have many Users
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
